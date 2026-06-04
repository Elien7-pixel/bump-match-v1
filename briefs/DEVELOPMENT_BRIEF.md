# Bump Match — Development Brief

## Project Overview

Bump Match is a cross-platform mobile application that helps expecting parents discover baby names together. Using a swipe-based interface inspired by modern dating apps, partners independently browse curated name cards and the app highlights matches when both like the same name.

## Objective

To create a simple, engaging tool that turns the baby naming process from a source of disagreement into a collaborative, enjoyable experience for couples.

## Development Timeline

The app was developed in a rapid build cycle, moving from concept to store submission within a compressed timeframe. The development approach prioritized real-time partner sync, multi-language name coverage, and a polished mobile-first UX.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Backend | Convex (real-time cloud database) |
| Navigation | React Navigation 7 |
| Animations | React Native Reanimated 4 |
| Auth | Custom email/password with hashed credentials and session tokens |
| Email Service | Resend (password resets) |
| Build & Deploy | EAS Build + EAS Submit |
| Platforms | iOS, Android, Web |

## Key Features

- Swipe-based name discovery with meaning, origin, and cultural background
- Real-time partner matching via QR code or invite code
- 14 supported languages including Afrikaans, English, isiZulu, isiXhosa, Sesotho, Greek, and Latin
- Gender filtering (boy, girl, neutral)
- Liked names grid with match indicators
- Profile customization with avatar selection
- Dark mode support
- Full account deletion (GDPR-compliant)
- Tablet-responsive design

## Architecture

- **Frontend:** React Native handles the UI layer with Expo managing native modules, builds, and OTA updates
- **Backend:** Convex provides real-time data sync, serverless functions, and database hosting
- **Auth:** Custom-built authentication flow with hashed passwords, session tokens, and email-based password reset
- **HTTP Routes:** Convex HTTP router serves the privacy policy, support page, and account deletion page

## Staff

| Role | Name |
|------|------|
| Founder & Lead Developer | Elton Matanda |
| AI Development Assistant | Claude (Anthropic) |

## Contact

- **Email:** ai@sherbetagency.com
- **Company:** Sherbet Agency / Orbit AI
