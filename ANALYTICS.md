# Bump Match — Analytics & Audience Setup

Three surfaces, two data pipes.

| Surface | Google Analytics 4 | Meta |
|---|---|---|
| iOS app | Firebase Analytics SDK | Meta App Events SDK |
| Android app | Firebase Analytics SDK | Meta App Events SDK |
| bumpmatch.app (Framer) | GA4 web tag | Meta Pixel |

**GA4 and Meta are separate pipes.** GA4 answers "what are users doing"; Meta
answers "who should we advertise to". Meta lookalike audiences cannot be built
from GA4 data, which is why the app sends the funnel to both.

---

## 1. The event ladder

Five milestones, each a stronger buying signal than the last. The last three
fire **once per install** — repeat swipes don't re-trigger `started_swiping`.

| # | Rung | GA4 event | Meta event | Fires from |
|---|---|---|---|---|
| 1 | App install | `first_open` (automatic) | `fb_mobile_activate_app` (automatic) | SDK |
| 2 | Account created | `sign_up` | `fb_mobile_complete_registration` | `AuthContext.signUp` |
| 3 | Started swiping | `started_swiping` | `StartedSwiping` | `AppPage` first swipe |
| 4 | Added partner | `partner_connected` | `AddedPartner` | `PartnerScreen` + `AuthContext` |
| 5 | Matched on names | `names_matched` | `MatchedNames` | `PartnerScreen` match reveal |

Rung 4 fires on **both** sides of the link — the invitee from `PartnerScreen`,
the inviter from `AuthContext` when `verifyToken` first reports a `partnerId`.

### Supporting events (GA4 only)

`login`, `onboarding_complete`, `name_liked`, `name_passed`, `name_favorited`,
`filter_changed`, `share_name_card`, `store_link_tapped`, `att_prompt_answered`,
plus automatic `screen_view` on every navigation.

`invite_sent` goes to both — it is the viral loop, worth targeting on.

### User properties (GA4 audience dimensions)

`user_gender`, `age_band`, `has_partner`, `country`.

`pregnancy_status` is **withheld by default** — see Section 4. No raw PII either:
age is bucketed to a band, and email/name never leave as user properties.

---

## 2. What you must do in the consoles

The code is done, and Firebase is now set up. What remains is Meta and the
website — plus a push migration that the Firebase choice created.

### 2a. Firebase — DONE

Set up on 24 August 2026 in project **`bump-match`** (not `bump-match-26e15` —
see the migration note below).

| | Value |
|---|---|
| Firebase project | `bump-match` (number `520738666572`) |
| GA4 property | `bump-match`, property ID `551265528` |
| GA4 account | Default Account for Firebase, account ID `405716043` |
| Country of business | South Africa |
| Android app | `com.orbitai.bumpmatch` — stream ID `15490590926` |
| iOS app | `com.sherbetagency.bumpmatch`, App Store ID `6776671806` |

Both config files are in the repo root and verified to point at the same project:
`google-services.json` and `GoogleService-Info.plist`.

All four GA4 data-sharing options are **off** (Google products & services,
modeling contributions/benchmarking, technical support, recommendations).

### 2b. 🚫 Push notification migration — BLOCKED

Switching to `bump-match` changed the FCM sender ID:

| | Old | New |
|---|---|---|
| Project | `bump-match-26e15` | `bump-match` |
| Sender ID | `223598917653` | `520738666572` |

EAS needs a Firebase **service account JSON key** to send FCM V1 push. Attempting
to generate one on 25 Aug 2026 failed:

> Key creation is not allowed on this service account. Please check if service
> account key creation is restricted by organization policies.

The `bumpmatch.app` Google Cloud org enforces
`constraints/iam.disableServiceAccountKeyCreation`. Firebase cannot mint the key,
so the migration cannot be completed as things stand.

**Push is not broken right now.** EAS still holds the old `bump-match-26e15`
credentials and the shipped v1.0.8 is registered against the old sender. The
break happens the moment a build ships carrying the new `google-services.json`.

**⚠️ Do not ship an Android build until this is resolved.** Analytics would work;
push would silently stop.

Note the constraint: `google-services.json` binds the Android app to **one**
Firebase project for all services. Analytics on `bump-match` and push on
`bump-match-26e15` is not a possible combination.

#### Chosen path: keep `bump-match`, grant a scoped exception

Decided 25 Aug 2026. Everything analytics-side is already built here, and a
company product's Firebase project should not live in a personal Gmail account —
which is what caused the two-project confusion in the first place.

These steps change security settings and grant IAM roles, so they are done by a
person, not by tooling.

**0. Turn on MFA first — deadline 3 September 2026.** `admin@bumpmatch.app` loses
Firebase access after that date, and it is currently the only account that can see
`bump-match`. myaccount.google.com → Security → 2-Step Verification. Do this even
if everything below slips.

**1. Grant yourself Organization Policy Administrator.**
The `bumpmatch.app` Cloud organization ID is **`745745414486`**, so go straight to
org-level IAM — the resource picker must be on the *organization*, not the project:

https://console.cloud.google.com/iam-admin/iam?organizationId=745745414486

The heading must read "Permissions for organization 'bumpmatch.app'". Then Grant
access → principal `admin@bumpmatch.app` → role **Organization Policy
Administrator** (`roles/orgpolicy.policyAdmin`) → Save.

If Grant access is greyed out, the account can read the org but not modify its IAM
— that needs **Organization Administrator**
(`roles/resourcemanager.organizationAdmin`), held by whoever created the Workspace.

**2. Override the constraint for this project only.**

https://console.cloud.google.com/iam-admin/orgpolicies/iam-disableServiceAccountKeyCreation?project=bump-match

Manage policy → **Override parent's policy** → Enforcement **Off** → Set policy.
The `?project=bump-match` is what scopes it — do not turn it off org-wide.

**3. Mint the key.** Firebase → `bump-match` → Project settings → Service accounts
→ Generate new private key. Secret — never commit it (`.gitignore` already covers
`*firebase-adminsdk*.json`).

**4. Upload to EAS.** Interactive, so run it yourself:

```bash
npx eas credentials --platform android
# → production → Push Notifications: FCM V1 → Upload a service account key
```

**5. Restore the policy.** Back to step 2's screen → set to **Inherit parent's
policy**. The key stays valid — the constraint blocks key *creation*, not key
*use*. So restoring it costs nothing and closes the hole.

**6. Verify.** Build, install on a real Android device, send a test push.

#### If the role turns out to be unreachable

Fall back to reverting to `bump-match-26e15` (personal Gmail, no org policy, and
EAS already holds working credentials so push never breaks). `git checkout
google-services.json` restores the old config; then register the iOS app, enable
Analytics and create a GA4 property + web stream there, and update Framer with the
new Measurement ID. GCP supports moving a project into an organization later, so
that door stays open.

#### Meanwhile

iOS push runs on **APNs, not FCM**, so it is entirely unaffected. `eas build
--platform ios` can ship today. Only do that if Android will land on the **same**
Firebase project eventually — otherwise the two platforms report to different GA4
properties and no funnel spans them. `npm run check:analytics` catches that.

### 2c. GA4 website stream — DONE

| | Value |
|---|---|
| Stream | Bump Match Website — ID `15490768723` |
| URL | `https://www.bumpmatch.app` |
| Measurement ID | **`G-CHQEBXS4S3`** |

Enhanced measurement is on, and **"page changes based on browser history events"**
is enabled — required, because Framer is a single-page app and without it only the
first pageview is ever recorded.

One property now holds all three streams (iOS, Android, web), so web and app users
appear in the same funnel reports.

**Framer setup, 24 Aug 2026.** Framer has a **native Google Analytics field**,
so the base tag does not need a custom script:

| Where | What |
|---|---|
| Site Settings → General → Google Analytics | `G-CHQEBXS4S3` |
| Site Settings → Code → "Store link tracking" | End of `<body>`, All pages, Once |

Use the native field, **not** a gtag custom script. Having both loads gtag twice
and double-counts every pageview. A GA4 custom script was briefly added and then
removed for exactly this reason.

The store-link tracker stays a custom script because the native field only emits
pageviews — it cannot fire custom events like `store_link_tapped`.

The Meta Pixel is deliberately **not** installed: `fbq('init')` with a placeholder
ID throws on every page load. Add it as a second script once a Pixel ID exists;
the store-link tracker already guards on `fbq` and will start reporting with no edit.

⚠️ **Not published yet.** Framer only applies both the native GA field and custom
code on the **published** site — neither fires in the editor or preview. Nothing
is tracked until someone hits Publish. The project reported no other pending
changes, so publishing sends only this.

**After publishing, check for double-counted pageviews.** If Framer's native
integration also fires a `page_view` on client-side route changes, it can collide
with GA4's own "page changes based on browser history events". Load the live site,
navigate between pages, and watch GA4 → Realtime. If each navigation produces two
`page_view` events, turn that setting off in the web stream's Enhanced measurement.

Source of truth for the store-link script stays `docs/framer-tracking-snippet.html`.

### 2d. Meta — app created 25 Aug 2026

Bump Match is a Sherbet Agency product, so everything lives in the **Sherbet
Agency business portfolio** and uses its **existing ad account**. No new ad
account, no billing setup, no new-account spend limits.

One thing to get right first: whichever portfolio owns the app when events start
accumulating is where the audiences are stuck permanently. Custom audiences
cannot be moved between business portfolios — only shared. Apps, Pages, pixels
and ad accounts can all be transferred later; audiences cannot. Since Bump Match
is Sherbet's own product, the Sherbet portfolio is the right home and this is
settled — but it is the reason to create the app in the right place the first time.

Confirm the Bump Match Facebook Page and `@bumpmatchofficial` Instagram account
are claimed into the Sherbet portfolio too — ads run from the Page.

**Done:**

| | Value |
|---|---|
| Meta App ID | `1094018189789929` |
| Client token | in `app.json` (not secret — ships in the binary) |
| URL scheme | `fb1094018189789929` |
| iOS platform | `com.sherbetagency.bumpmatch`, Store ID `6776671806` (iPhone + iPad) |
| Android platform | `com.orbitai.bumpmatch`, class `com.orbitai.bumpmatch.MainActivity` |

`FacebookAutoInitEnabled` and `FacebookAdvertiserIDCollectionEnabled` are both
**false** on purpose. The SDK is initialised from `src/utils/analytics.ts` after
the ATT prompt is answered, so no advertising identifier is collected before the
user has decided. Auto-init would send events before that.

**Still outstanding on the Meta side:** connect the app as a data source in Events
Manager, and configure Aggregated Event Measurement for iOS (rank `MatchedNames`
> `AddedPartner` > `StartedSwiping` > registration > install). Neither blocks the
build.

<details>
<summary>How it was created, for reference</summary>

1. developers.facebook.com → My Apps → Create App.
   - Use case: **"Create an app without a use case"** (under the "Others" filter).
     It gives an App ID with no permissions, features or products — exactly what
     the SDK needs. Do **not** pick "Other": Meta flags it "going away soon" and
     it builds the app in the retiring old experience. Do not pick "Facebook
     Login" either — the app authenticates with its own email/password through
     Convex, so it would only add permissions that trigger App Review for no
     benefit. Nor Messaging, Audience Network or Games.
   - Attach it to the **Sherbet Agency business portfolio**.
   - **Add no products.** The dashboard will offer Facebook Login, Webhooks and
     others — skip them all. Basic app events need no App Review; adding products
     drags you into review and business verification you do not need.
2. Settings → Basic → Add Platform → **iOS**: bundle ID `com.sherbetagency.bumpmatch`
3. Add Platform → **Android**: package `com.orbitai.bumpmatch`, class `com.orbitai.bumpmatch.MainActivity`
4. Copy **App ID** (Settings → Basic) and **Client token** (Settings → Advanced)
5. Paste both into `app.json` → `react-native-fbsdk-next` plugin, replacing
   `META_APP_ID_PLACEHOLDER` and `META_CLIENT_TOKEN_PLACEHOLDER`.
   The `scheme` must be `fb` + your App ID, e.g. `fb1234567890`.
6. Events Manager → connect the app as a data source. Because the app and the ad
   account sit in the same portfolio, they link automatically — no cross-business
   sharing needed.
7. iOS only: Events Manager → app → **Aggregated Event Measurement** → configure
   the 8 SKAdNetwork conversion events. Rank them:
   `MatchedNames` > `AddedPartner` > `StartedSwiping` > registration > install.

</details>

Then verify before you build:

```bash
npm run check:analytics
```

It fails loudly with the exact console path for anything still missing.

---

## 3. Building and shipping

The app has **no OTA updates** (`expo-updates` is not installed), so none of
this reaches real users until new binaries ship to both stores.

```bash
npm run check:analytics          # must pass first
npx expo prebuild --clean        # regenerate native projects with the new plugins
eas build --platform all --profile production
eas submit --platform all --profile production
```

### Verifying before release

- **Firebase DebugView** — Analytics → DebugView. For a dev build:
  - iOS: add launch arg `-FIRDebugEnabled` in Xcode
  - Android: `adb shell setprop debug.firebase.analytics.app com.orbitai.bumpmatch`
- **Meta Events Manager** → your app → Test Events. Install the build, walk the
  funnel, and confirm `StartedSwiping` / `AddedPartner` / `MatchedNames` arrive.
- GA4 reports lag up to 24h. DebugView and Test Events are real-time — use those.

---

## 4. Privacy — what was changed and what is left

The app collects pregnancy status. That is special-category data under GDPR
Art. 9 and special personal information under POPIA, so the instrumentation was
built to keep it out of both analytics pipes.

### Two switches in `src/utils/analytics.ts`

| Flag | Default | What it controls |
|---|---|---|
| `SEND_SENSITIVE_USER_PROPERTIES` | `false` | Whether pregnancy status reaches GA4, as a user property or an event param |
| `META_ADVANCED_MATCHING_ENABLED` | `true` | Whether hashed email/name go to Meta for audience matching |

`SEND_SENSITIVE_USER_PROPERTIES` is off because Art. 9 is **not** satisfied by
legitimate interests — the basis the privacy policy claims for analytics. It needs
separate, explicit, opt-in consent. Turn it on only once the app collects that
consent. Everything else keeps working either way; you lose pregnancy-stage
segmentation in GA4 reports, nothing more.

Pregnancy fields are stripped from Meta **unconditionally** — regardless of that
flag and regardless of consent — because Meta's business tool terms prohibit
sending health data, and a breach risks the ad account rather than just a fine.
The strip list is `SENSITIVE_PARAM_KEYS`; keep it ahead of new call sites.

`META_ADVANCED_MATCHING_ENABLED` is on because it roughly doubles audience match
rates, which is most of why the lookalike strategy works. It is still sharing
personal data with an ad network and still needs a lawful basis. Set it to `false`
to ship without it while a consent flow catches up.

### Documents updated

- `PRIVACY_POLICY.md` — new **Section 7, Advertising and measurement**, covering
  both pipes, advertising identifiers, legal bases and opt-out routes. Old
  sections 7–14 renumbered to 8–15; cross-references fixed.
- `Bump-Match-Privacy-Policy.pdf` — regenerated via `python3 scripts/generate_privacy_pdf.py`
- `SettingsScreen.tsx` — the in-app policy modal gained a matching
  **4. Analytics & Advertising** section

### Still outstanding

- **The in-app modal and `PRIVACY_POLICY.md` are two separate copies that have
  drifted badly.** The modal was dated January 2026 against the document's July
  2026, and still claimed "we do not sell your personal information to third
  parties" while Section 5 describes an opt-in data sale. The false sentence is
  corrected and the advertising section added, but the two texts remain very
  different documents. Worth collapsing to one source of truth.
- **A legal read.** Advertising on a pregnancy app is a sensitive combination and
  this went in without review.
- **Store privacy labels** must be updated before the next submission — both
  stores will now see "data used to track you" (the advertising identifier) and
  "data linked to you" (analytics identifiers). Mis-declaring is a common
  rejection reason and is caught at review, not at build.
- **A consent flow**, if you want pregnancy-stage segmentation back or want
  advanced matching on a firmer footing. `CONSENT_COPY.md` is the right place for
  the wording; it already has the house style for this.

### Consent

Advertising consent defaults to **denied on both platforms**. Nothing
advertising-related is collected until the user agrees.

| Platform | How they are asked |
|---|---|
| iOS | Apple's ATT prompt, after onboarding — never on the first frame, which is the main cause of low opt-in |
| Android | `TrackingConsentDialog`, shown once after onboarding. Android has no OS-level gate, so the app asks for itself |

Both funnel into `setTrackingConsent()`, which drives Firebase consent mode
(`ad_storage`, `ad_user_data`, `ad_personalization`) and Meta's advertiser-ID
flags together, and gates advanced matching. Product analytics keeps running
either way — no advertising identifier is involved.

Users can withdraw at any time via **Settings → Ad Measurement**, which also
clears data already shared with Meta.

---

## 5. Code map

| File | Role |
|---|---|
| `src/utils/analytics.ts` | The only file that talks to either SDK. Both are optional at runtime — missing native modules degrade to no-ops. |
| `App.tsx` | `initAnalytics()` on mount; screen tracking via `NavigationContainer.onStateChange` |
| `src/context/AuthContext.tsx` | `sign_up`, `login`, identity, rung 4 (inviter side), logout reset |
| `src/screens/AppPage.tsx` | `started_swiping`, `name_liked`, `name_passed`, ATT prompt |
| `src/screens/PartnerScreen.tsx` | `invite_sent`, `partner_connected`, `names_matched` |
| `src/components/PartnerInviteDialog.tsx` | `invite_sent` |
| `src/screens/LikedNamesScreen.tsx` | `share_name_card` |
| `scripts/check-analytics-config.js` | Preflight — run via `npm run check:analytics` |

### Adding an event

```ts
import { AnalyticsEvent, logEvent } from '../utils/analytics';

logEvent(AnalyticsEvent.NAME_FAVORITED, { origin: name.origin });
```

Add the name to `AnalyticsEvent`, and add it to `META_EVENT_MAP` only if it is a
funnel-grade signal worth building an audience on. High-frequency events sent to
Meta dilute audiences rather than sharpen them.
