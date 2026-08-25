import { internalQuery } from "./_generated/server";
import { isHiddenUser } from "./adminHiddenUsers";

// Normalises the stored `age` field to a plain "YYYY-MM-DD" date of birth.
// Rows that predate the date-picker fix hold a full ISO datetime; this applies
// the same roll-forward as users.repairDobFormats so the dashboard shows the
// birth date the user actually picked, not the UTC instant behind it.
function normaliseDateOfBirth(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();

  const withTime = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/);
  if (withTime) {
    let day = Date.UTC(Number(withTime[1]), Number(withTime[2]) - 1, Number(withTime[3]));
    if (Number(withTime[4]) >= 12) day += 24 * 60 * 60 * 1000;
    return new Date(day).toISOString().slice(0, 10);
  }

  return trimmed;
}

// Years old, from an already-normalised "YYYY-MM-DD". Reads the literal
// calendar parts so the result never depends on the server's timezone. A
// handful of the earliest accounts stored a plain age instead of a birth date.
function ageFromDateOfBirth(value: string): number | null {
  if (!value) return null;
  if (/^\d{1,3}$/.test(value)) return Number(value);

  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!parts) return null;

  const [, y, m, d] = parts.map(Number);
  const today = new Date();
  let years = today.getUTCFullYear() - y;
  const monthDiff = today.getUTCMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < d)) {
    years--;
  }
  return years >= 0 && years < 130 ? years : null;
}

// Internal-only: this returns registration PII, so it must stay reachable only
// from the admin-key-gated HTTP routes in http.ts, never from the client.
export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const liked = await ctx.db.query("likedNames").collect();
    const submissions = await ctx.db.query("submittedNames").collect();

    // Group the child tables once rather than querying per user.
    const likedCounts = new Map<string, { total: number; favourites: number }>();
    for (const entry of liked) {
      const counts = likedCounts.get(entry.userId) ?? { total: 0, favourites: 0 };
      counts.total++;
      if (entry.isFavorite) counts.favourites++;
      likedCounts.set(entry.userId, counts);
    }

    const submissionCounts = new Map<string, number>();
    for (const entry of submissions) {
      submissionCounts.set(entry.submittedBy, (submissionCounts.get(entry.submittedBy) ?? 0) + 1);
    }

    const byId = new Map(users.map((u) => [u._id as string, u]));

    return users
      // Suppressed after `byId` is built from the full table, so a hidden account
      // still resolves as somebody else's partner name.
      .filter((user) => !isHiddenUser(user.email))
      .map((user) => {
        const partner = user.partnerId ? byId.get(user.partnerId) : undefined;
        const counts = likedCounts.get(user._id) ?? { total: 0, favourites: 0 };
        const storedDob = normaliseDateOfBirth(user.age);
        // The birth-date field has collected more than birth dates: the earliest
        // accounts stored a plain age ("33"), and at least one holds a run-together
        // date ("230986") that cannot be read without guessing the order. Show the
        // column only when the value really is a date — the Age column still
        // reports a plain age, so nothing knowable is lost.
        const dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(storedDob) ? storedDob : "";

        return {
          id: user._id as string,
          registeredAt: user.createdAt ?? user._creationTime,
          firstName: user.firstName,
          surname: user.surname,
          email: user.email,
          dateOfBirth,
          // From the stored value, not the blanked one, so plain-age rows keep an age.
          ageYears: ageFromDateOfBirth(storedDob),
          gender: user.gender,
          expecting: user.expecting ?? "",
          status: user.status ?? "",
          dueDate: user.dueDate ?? "",
          country: user.country ?? "",
          province: user.province ?? "",
          heritage: user.heritage ?? [],
          // Partner Offers consent, for working out who may lawfully be included
          // in a partner share. The timestamp is the evidence, not the boolean.
          partnerOffers: user.partnerOffersOptIn ?? false,
          partnerOffersAt: user.partnerOffersOptInAt ?? null,
          inviteCode: user.inviteCode,
          partnerName: partner ? `${partner.firstName} ${partner.surname}`.trim() : "",
          partnerEmail: partner ? partner.email : "",
          isPaired: Boolean(user.partnerId),
          revealDate: user.matchRevealDate ?? null,
          revealDateConfirmed: Boolean(user.revealDateConfirmed),
          pushEnabled: Boolean(user.pushToken),
          likedNames: counts.total,
          favouriteNames: counts.favourites,
          submittedNames: submissionCounts.get(user._id) ?? 0,
        };
      })
      .sort((a, b) => b.registeredAt - a.registeredAt);
  },
});
