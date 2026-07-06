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

Show this as its own screen after onboarding, or as a toggle in Settings. Default
state = OFF.

**Title:** Get offers from our partner brands

**Body:**
> Want deals on baby and parenting products? Turn this on to let us share your
> **name and contact details** with trusted partner brands so they can send you
> relevant offers.
>
> - It's completely optional — Bump Match works fully without it.
> - You can turn it off anytime in Settings.
> - Partners may be able to tell you're an expecting or new parent.
>
> Read how we handle your data in our **[Privacy Policy]**.

**Toggle (default OFF):**
> ☐ **Share my name & contact details with partner brands for offers**

**Buttons:**
> **[ Turn on offers ]**   **[ Not now ]**

*Optional incentive to lift opt-in rates (legitimate):*
> 🎁 Opt in and unlock [a partner discount code / a free month of Premium].

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
