# Bump Match — Outstanding Items

Last updated: 23 March 2026

---

## Needs External Input

### 1. Celebrity Names Filter
- **What it is:** A "Celebrity" filter on the swipe screen showing names of famous people's children (athletes, actors, musicians)
- **What's needed:** A curated list of ~50–100 celebrity baby names. Each entry needs:
  - Baby name
  - Celebrity parent(s)
  - Category (athlete / actor / musician / royal / etc.)
  - Gender (boy / girl / unisex)
  - Meaning
  - Origin
- **Code work once provided:** Add a `celebrity` tag to the name data, add a "Celebrity" filter toggle on AppPage (similar to the existing "Popular" toggle)

### 2. Crowdsourced Name Submission
- **What it is:** Users submit new names to the database, which are reviewed before going live
- **What's needed:** A decision on the moderation approach:
  - **Option A:** In-app admin screen (simple, you review on your phone)
  - **Option B:** Separate web dashboard (more powerful, needs hosting)
- **Code work once decided:**
  - User-facing submission form (name, meaning, origin, language, gender)
  - New `submittedNames` Convex table with status (pending / approved / rejected)
  - Admin review queue (approve/reject with one tap)
  - Auto-add approved names to the main database

### 3. Video Tutorial
- **What it is:** A step-by-step walkthrough video in the onboarding flow (alternative to the current swipeable slides)
- **What's needed:** An MP4/MOV video file (screen recording or animated explainer, 30–60 seconds recommended), or Lottie animation files
- **Code work once provided:** Embed in onboarding using `expo-av` video player with play/pause controls, skip button

### 4. Push Notifications
- **What it is:** Notify partners when the match reveal deadline is reached: "Hey [Name], here are all the names you both matched!"
- **What's needed:**
  - Apple Push Notification certificate (from Apple Developer account)
  - Expo Push setup (one-time configuration)
- **Code work once set up:**
  - Push token registration on login
  - Scheduled Convex action to send notifications on deadline date
  - Also enables future notifications (new matches, partner activity, pregnancy milestones)

---

## Administrative (Not Code)

### 5. Apple App Store Account Migration
- **What it is:** Move from individual developer account to company/agency account
- **Why:** Required to change the app name on the store; also more professional
- **Action:** Start the process now — Apple's review can take weeks
- **Who:** Account owner / admin

### 6. Google Play Store Listing Update
- **What it is:** Transfer listing to company account, update screenshots and description
- **Who:** Account owner / admin

### 7. QR Code App Store Link
- **What it is:** The in-app QR code currently shows a placeholder alert when tapped. Once the iOS App Store URL is confirmed, update it to link directly to the store listing.
- **When:** Version 1.2, after App Store approval
- **Code change:** One line update in `PartnerInviteDialog.tsx` — replace the `Alert` in `handleQRTap` with `Linking.openURL(appStoreUrl)`

---

## Nice-to-Have / Future Versions

These were discussed but explicitly deferred:

- **Tutorial/walkthrough after first sign-in** (needs design assets beyond current slides)
- **Due date milestone notifications** ("Your baby is the size of a pineapple!") — the in-app banner exists, push notification version needs #4 above
- **Crowdsourced name moderation system** — needs #2 above
- **Celebrity names category** — needs #1 above
- **App Store account migration** — administrative, not code (#5 above)
- **Gamified reveal with push alerts** — the in-app deadline/reveal exists, push version needs #4 above
