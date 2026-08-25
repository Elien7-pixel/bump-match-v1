# Bump Match — Consent & Onboarding Copy

Ready-to-use UI copy for the sign-up flow, the Partner Offers opt-in, and Settings.
Keep the wording specific and honest — vague or pre-ticked consent is legally invalid
under GDPR and rejected by Apple. All partner sharing must default to OFF.

---

## 1. Sign-up screen (mandatory — this is fine to require)

> By creating an account you agree to our **[Terms of Service]** and
> **[Privacy Policy]**.
>
> ☐ I confirm I am 18 or older.
>
> **[ Create account ]**

*Do NOT bundle partner data-sharing into this checkbox. The account terms can be
mandatory; the data sale cannot.*

---

## 2. Partner Offers opt-in (separate, optional, default OFF)

Two placements, and they do different jobs. Use both.

### 2a. At registration — inline, below the terms

Sits *underneath* the mandatory terms tick so the two read as separate asks.
Unticked. Declining changes nothing about what happens next.

> ☐ **Send me baby product deals**
> We'll pass your name and email to brands we've checked out, so they can send
> you offers. Never your pregnancy details, due date, or the names you like.
> Change your mind anytime in Settings.

Keep it to one line of value and one line of reassurance. At sign-up people are
skimming, and a paragraph here costs completions without lifting opt-ins.

### 2b. After onboarding — its own screen, with the incentive

This is where the rate is actually won. Ask once the app has proved useful, not
before.

**Title:** Want deals on baby gear?

**Body:**
> Brands we've vetted send offers to Bump Match parents — nappies, prams,
> newborn essentials. Turn this on and we'll pass them your name and email so
> they can reach you.
>
> **We never share** your pregnancy stage, due date, or any name you've liked.

**Incentive (legitimate, and the single biggest lever):**
> 🎁 Opt in and unlock [a partner discount code / a free month of Premium].

**Buttons:**
> **[ Yes, send me deals ]**   **[ Not now ]**

---

## 2c. Writing rules for this consent

What raises opt-in rates lawfully is framing and timing. What looks like it
should work — pre-ticking, gating, burying — produces consent that cannot be
relied on, so the tick is worthless even when you get it.

**Do**
- Lead with what they get, in concrete nouns: "nappies, prams, newborn
  essentials" beats "relevant offers from partners".
- Name exactly what is shared — *name and email* — and exactly what is not.
  Naming the exclusions is what earns the tick from a cautious audience; vagueness
  reads as hiding something, especially to pregnant users.
- Offer something. An incentive is entirely legitimate and moves the number more
  than any wording change.
- Ask at a good moment, and ask again later if declined.
- Say it is reversible, and mean it.

**Don't**
- Pre-tick it. Invalid under GDPR (*Planet49*), and POPIA s69 requires prior
  opt-in for direct marketing.
- Gate the app on it. GDPR Art. 7(4) — consent tied to access is not freely
  given. Also an Apple 5.1.1 rejection line.
- Make declining harder than accepting — a greyed-out, tiny, or hidden decline
  is a deceptive-design pattern (EDPB Guidelines 03/2022) and undermines the
  validity of every consent collected through it.
- Use confirmshaming. "No thanks, I don't like saving money" both damages trust
  and taints the consent.
- Bundle it with the terms tick. Terms can be mandatory; the data sale cannot.

**Record the timestamp.** Consent has to be demonstrable, so store when it was
given alongside the boolean, not just the current state.

---

## 3. Settings → Privacy

> **Partner Offers**
> Share your name & contact details with partner brands for offers.
> [ Toggle: ON / OFF ]  ← reflects current consent, default OFF
>
> **Do Not Sell or Share My Personal Information**
> [ Tap to opt out ]  ← required for California/US users
>
> **Download my data**   ›
> **Delete my account & data**   ›
> **View Privacy Policy**   ›

---

## 4. Confirmation messages

**When turned ON:**
> ✅ You're in. We'll share your name and contact details with partner brands so
> they can send you offers. You can turn this off anytime in Settings.

**When turned OFF:**
> Done — we'll stop sharing your details with partner brands. Note: brands you were
> already shared with may still hold your details; contact us to request deletion.

---

## Implementation notes (for the dev, not shown to users)

- Store consent as an explicit, timestamped record per user (who, what, when,
  policy version). You must be able to *prove* consent was given — GDPR requires it.
- Persist the toggle state server-side (Convex), not just on-device.
- Only include a user in any partner export **while** their toggle is ON.
- Re-request consent if you materially change what data is sold or who buys it.
- Wire the "Do Not Sell", "Download my data", and "Delete my account" actions to
  real backend flows — a policy that promises them without delivering is itself a
  violation.
- For iOS App Store: declare data "used to track you" / "sold to data brokers"
  accurately in the App Privacy nutrition label, or the app can be rejected/pulled.
