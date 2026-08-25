# Legal review brief — advertising & analytics release

**Prepared:** 25 August 2026
**For:** review before the next store submission
**Scope:** what changed, and the specific questions that need a lawyer's answer

Bump Match now sends behavioural data to Google Analytics and to Meta, and builds
Meta advertising audiences from it. The app collects pregnancy information and
cultural heritage from users who are, by definition, pregnant or trying to be.
That combination is what makes this worth a review rather than a rubber stamp.

Jurisdictions in play: **POPIA** (South Africa, the primary market), **GDPR/UK
GDPR** (any EU/UK users), and **CCPA/CPRA** (the policy already addresses this).

---

## The four questions that actually need answering

### 1. Android consent — GAP CLOSED 25 Aug 2026, basis still needs confirming

On iOS, the advertising identifier is gated behind Apple's App Tracking
Transparency prompt: no grant, no IDFA, no Meta tracking. That is a real consent
gate.

Android has no OS-level equivalent. Until 25 Aug the app enabled advertising-ID
collection and tracking unconditionally at startup, so the same processing had a
consent basis on iOS and none on Android.

**Now fixed.** Consent defaults to **denied** on both platforms. Nothing
advertising-related is collected until the user agrees:

- Android sees `TrackingConsentDialog`, shown once after onboarding
- iOS continues to use ATT, and its result feeds the same consent state
- Both drive `setTrackingConsent()`, which sets Firebase consent mode
  (`ad_storage`, `ad_user_data`, `ad_personalization`) and Meta's advertiser-ID
  flags together
- Meta advanced matching is gated on the same answer
- Withdrawal is available any time via Settings → **Ad Measurement**, which also
  clears data already shared with Meta
- Product analytics (`analytics_storage`) stays on regardless — no advertising
  identifier involved, running on legitimate interests

**Question that remains:** is an in-app opt-in of this form sufficient consent
under POPIA and GDPR for advertising identifiers, and is "legitimate interests"
defensible for the product analytics that continue when the user declines?

### 2. Meta Advanced Matching — hashed email and name to an ad network

`setMetaAdvancedMatching()` sends SHA-256 hashed email, first name, surname,
gender and country to Meta on sign-up and login. Meta matches those hashes
against its own user table to build custom audiences.

It is on by default (`META_ADVANCED_MATCHING_ENABLED = true`). Hashing is a
safeguard, not anonymisation — this remains personal data being shared with an
independent controller for advertising.

**Question:** is the current basis sufficient, or does this need separate,
explicit opt-in? Setting the flag to `false` ships everything else unchanged and
costs roughly half the audience match rate.

### 3. Special-category data — pregnancy and ethnic origin

Two Article 9 / POPIA "special personal information" categories are collected:

- **Pregnancy status and due date** (`status`, `dueDate`)
- **Cultural heritage** (`heritage`) — options include isiZulu, isiXhosa,
  Afrikaans, Sepedi and others. In the South African context this reveals ethnic
  origin.

Neither is sent to Google or Meta. That is enforced in code — `SENSITIVE_PARAM_KEYS`
strips them from every event, unconditionally for Meta — not merely promised in
the policy.

But they are still **collected and stored**, and Article 9 is not satisfied by
legitimate interests. Consent is currently bundled into account creation.

**Question:** is bundled sign-up consent adequate for these two fields, or does
Article 9 require separate explicit consent? Note heritage was entirely
undisclosed in the privacy policy until 25 Aug 2026; it is now covered in
Section 3a.

### 4. Two privacy policies that disagree

The policy exists twice and the copies have drifted:

- `PRIVACY_POLICY.md` — the full document, now current
- the in-app modal in `src/screens/SettingsScreen.tsx` — a hand-maintained,
  much shorter copy

Until 24 Aug the in-app version was dated January 2026 against the document's
July, and stated *"We do not sell your personal information to third parties"* —
which Section 5 of the real policy contradicts, since it describes an opt-in data
sale. That sentence is corrected and an advertising section added, but they remain
two separately maintained documents.

**Question:** does the in-app text need to match the full policy verbatim, or does
a summary plus a link suffice? If verbatim, the app should render one source
rather than maintaining two.

---

## What has already been done

- **Section 7, Advertising and measurement** added to `PRIVACY_POLICY.md` —
  covers both pipes, advertising identifiers, legal bases, opt-out routes
- **Cultural heritage disclosed** in Section 3a, flagged as special category
- In-app policy modal gained a matching **Analytics & Advertising** section, and
  its false "we do not sell" sentence corrected
- Pregnancy and heritage **stripped in code** before any analytics call
- ATT prompt deferred until after onboarding, not first launch
- PDF regenerated from the markdown

## What is deliberately still open

- Advanced matching is bundled into the same consent as the advertising
  identifier rather than asked separately (question 2)
- Store privacy labels not yet updated — see `docs/STORE_PRIVACY_LABELS.md`

## Where to look in the code

| Concern | File |
|---|---|
| Everything sent to Google or Meta | `src/utils/analytics.ts` |
| Sensitive-field stripping | `SENSITIVE_PARAM_KEYS`, `stripSensitive()` |
| Feature flags | `SEND_SENSITIVE_USER_PROPERTIES`, `META_ADVANCED_MATCHING_ENABLED` |
| Consent state and gating | `setTrackingConsent()`, `applyConsent()` in `analytics.ts` |
| Prompt timing, both platforms | `src/screens/AppPage.tsx` → `maybeAskForTracking()` |
| Android consent UI | `src/components/TrackingConsentDialog.tsx` |
| Withdrawal | `src/screens/SettingsScreen.tsx` → Ad Measurement toggle |
| What is stored server-side | `convex/schema.ts` |
