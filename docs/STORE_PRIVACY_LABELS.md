# Store privacy declarations

Derived from what the code actually collects — `convex/schema.ts`,
`src/utils/analytics.ts`, and the Meta/Firebase SDK behaviour — not from
assumptions. Mis-declaring is a common rejection reason and it is caught at
review, not at build.

**The headline change:** this release adds advertising tracking. Both stores must
now declare it. Previous submissions did not.

**Firebase Analytics is NOT in the shipped build** — it could not be made to
build on Expo SDK 54. Meta is the only third-party recipient. Anything below
that mentions Google applies only if Firebase is reinstated later.

---

## What the app collects

| Field | Source | Sensitivity |
|---|---|---|
| email, firstName, surname | sign-up | personal |
| passwordHash | sign-up | credential (hashed) |
| age, gender (mom/dad/partner), expecting | sign-up | personal |
| **status, dueDate** | sign-up / profile | **special category — pregnancy** |
| **heritage** | profile | **special category — ethnic origin** |
| country, province | profile | coarse location |
| likedNames, feedback, submittedNames | in-app | user content |
| pushToken | notifications | device identifier |
| app-instance ID, user ID, screen views, events | Firebase | analytics identifiers |
| IDFA / Android ad ID | Meta SDK, **only if ATT granted** | advertising identifier |
| hashed email + name | Meta advanced matching | personal, for ad targeting |

Pregnancy and heritage are **collected but never sent** to Google or Meta —
enforced by `SENSITIVE_PARAM_KEYS` and `SEND_SENSITIVE_USER_PROPERTIES` in
`src/utils/analytics.ts`, not just by policy. That distinction is what lets you
answer "collected, not shared" truthfully below, and it matters: Play prohibits
sharing sensitive health data with third parties for advertising.

---

## Apple — App Privacy (App Store Connect)

### Data Used to Track You
This section is **new** and is the one that changes your listing. Apple defines
tracking as linking user or device data with third-party data for targeted
advertising — Meta advanced matching and custom audiences are exactly that.

- **Contact Info** → Email Address, Name
- **Identifiers** → User ID, Device ID
- **Usage Data** → Product Interaction, Advertising Data

### Data Linked to You
- **Contact Info** → Email Address, Name
- **Sensitive Info** → pregnancy status, due date, cultural heritage.
  Apple's "Sensitive Info" definition explicitly names *pregnancy or childbirth
  information* and *racial or ethnic data*. Declare it here rather than under
  Health & Fitness.
- **Location** → Coarse Location (country/province, plus IP-derived region in GA4)
- **Identifiers** → User ID, Device ID
- **Usage Data** → Product Interaction, Advertising Data
- **User Content** → Other User Content (feedback, submitted names)
- **Other Data** → age, role, expected baby gender

### Data Not Linked to You
Nothing. Crash and performance data were Firebase's, and Firebase is not in the
shipped build — there is no crash reporting in the app at all, so leave the
Diagnostics category untouched.

### Also required
`NSUserTrackingUsageDescription` is already in `app.json` — App Review rejects
ATT builds without it.

---

## Google Play — Data safety

Meta is the **only** third party the app sends data to. Firebase Analytics was
removed before release, so Google receives nothing from the app.

### Collected

- **Personal info** → Name, Email address, **Race and ethnicity** (heritage),
  Other info (age, role, expected baby gender)
- **Health and fitness** → Health info (pregnancy status, due date)
- **Location** → Approximate location (country/province)
- **App activity** → App interactions, Other user-generated content
- **Device or other IDs** → Device or other IDs

### NOT collected — do not tick

- **App info and performance** (crash logs, diagnostics). There is no crash
  reporting in the app. Firebase was the only source and it is gone; nothing
  replaced it. Declaring collection you do not perform is as wrong as omitting
  collection you do.

### Processed ephemerally: NO, for every type

Play defines ephemeral as accessed in memory only and retained no longer than
needed to service the request in real time. Every field above is persisted —
account data in Convex, Meta events on Meta's servers. Answer **No** throughout.

### Required or optional

| Data | Which | Why |
|---|---|---|
| Name, Email address | **Required** | Needed to create an account |
| Race and ethnicity | *Optional* | Cultural heritage is a skippable profile field |
| Health info | *Optional* | Pregnancy status and due date can be left blank |
| Approximate location | *Optional* | Country/province are optional profile fields |
| App interactions | **Required** | Meta events fire for all users |
| Other user-generated content | *Optional* | Feedback and name submissions are voluntary |
| Device or other IDs | *Optional* | The advertising ID needs consent; the push token needs notifications enabled |

### Shared with third parties

Play excludes service providers processing on your behalf. Meta is not one — it
uses the data for its own advertising purposes, so it counts as sharing.

Shared with Meta for **advertising or marketing**:
- Name, Email address (hashed, via advanced matching)
- Device or other IDs
- App interactions

**Not shared with anyone:** health info, race and ethnicity, approximate
location, user-generated content.

### Security practices

- Data is encrypted in transit — **yes**
- Users can request data deletion — **yes** (privacy policy Section 10, and
  in-app account deletion)
- Committed to Play Families Policy — **no** (18+)

## Watch-outs

1. **Play prohibits sharing sensitive user data for advertising.** You are
   compliant only because pregnancy and heritage are stripped in code before any
   Meta call. If anyone removes `SENSITIVE_PARAM_KEYS` or re-enables
   `SEND_SENSITIVE_USER_PROPERTIES` without revisiting these declarations, the
   Play listing becomes false.
2. **Apple treats "tracking" as a yes/no.** Once ATT ships, answering "no" to
   tracking anywhere in the questionnaire contradicts the prompt in the binary,
   and reviewers do check.
3. **Both declarations must match the privacy policy.** The policy now covers
   advertising (Section 7) and heritage (Section 3a). Keep them in step.
