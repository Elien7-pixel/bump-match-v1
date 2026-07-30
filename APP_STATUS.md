# Bump Match

A collaborative baby name discovery app for expecting parents and partners.

## About

Bump Match helps couples find baby names they both love using a Tinder-like swiping interface. Swipe right on names you like, left on ones you don't. When both partners like the same name, it's a match.

### Features

- **Swipe to discover** — Browse name cards showing meaning, origin, and cultural background
- **Partner matching** — Connect with your partner via QR code or invite code and see matches in real time
- **14 languages** — Names from Afrikaans, English, isiZulu, isiXhosa, Sesotho, Setswana, Greek, Latin, and more
- **Gender filtering** — Browse boy, girl, or gender-neutral names
- **Liked names** — All favorites saved in a grid view with match indicators
- **Profile & settings** — Dark mode, push notifications, account management
- **Account deletion** — Full GDPR-compliant data deletion via app or web

## Tech Stack

- **Frontend:** React Native + Expo (SDK 54)
- **Backend:** Convex
- **Language:** TypeScript
- **Navigation:** React Navigation
- **Animations:** React Native Reanimated

## App Store Status

| Store | Status | Link |
|-------|--------|------|
| Apple App Store | v1.0.8 (build 9) uploaded to App Store Connect 30 Jul 2026 — needs version created + submitted for review | [App Store Connect](https://appstoreconnect.apple.com/apps/6776671806) |
| Google Play Store | v1.0.7 (versionCode 9) built; Android v1.0.8 build pending Firebase (push delivery) | [Play Console](https://play.google.com/console) |

- **Bundle ID:** iOS `com.sherbetagency.bumpmatch` / Android `com.orbitai.bumpmatch`
- **Version:** 1.0.8 (iOS build 9)
- **Backend:** Convex `silent-ermine-169` — v1.0.8 functions deployed 30 Jul 2026 (trending table + weekly cron, match-push, DOB/name repairs); DOB migration run (16 accounts fixed)
- **Privacy Policy:** https://elated-newt-380.convex.cloud/privacy-policy
- **Support:** https://elated-newt-380.convex.cloud/support
- **Contact:** ai@sherbetagency.com
