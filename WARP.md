# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Install dependencies

- `npm install`

There is no lockfile checked in, so any Node package manager (npm, yarn, pnpm) can be used. The examples below assume npm.

### Run the app (Expo / React Native)

From the project root:

- `npm start` – runs `expo start` (starts the Metro bundler with Expo).
- `npm run android` – starts the app in an Android emulator or connected device.
- `npm run ios` – starts the app in an iOS simulator (macOS with Xcode required).
- `npm run web` – runs the web version in a browser.

### Build, lint, and tests

- There are currently **no lint or test scripts** defined in `package.json`, and no Jest/ESLint configuration files in the repo.
- Production builds are handled through Expo/EAS tooling configured outside this repo; prefer to expose any future build, lint, or test flows via `npm run <script>`.

## Architecture overview

### Platform and entrypoints

- This is an **Expo-managed React Native app**.
- `index.ts` is the entrypoint; it calls `registerRootComponent(App)` from `expo`, so `App.tsx` is the root component for both Expo Go and native builds.
- `App.tsx` wires up global concerns:
  - Loads Inter fonts via `@expo-google-fonts/inter`.
  - Reads onboarding state from `@react-native-async-storage/async-storage` (`bumpmatch_onboarding_completed`).
  - Chooses the initial navigation route (`Landing` vs `App`) based on onboarding completion.
  - Sets up a React Navigation stack (`@react-navigation/native`, `@react-navigation/stack`) with `LandingPage` and `AppPage` screens and hides the default headers.

### Screen layer (`src/screens`)

- `src/screens/LandingPage.tsx`
  - Onboarding / login-like entry screen.
  - Renders a background image and gradient overlay, with primary CTA "Log In / Sign Up".
  - Uses local React state to collect:
    - `surname` (last name),
    - `gender` (`'mom' | 'dad' | 'partner'`),
    - `status` (expecting status string).
  - Persists profile data to AsyncStorage under the key `bumpmatch_user_profile` and marks onboarding complete via `bumpmatch_onboarding_completed = 'true'`.
  - On success, replaces the current route with the `App` screen via `navigation.replace('App')`.
  - Relies heavily on design tokens (`AppTokens`) and shared UI primitives (`Button`, `Input`).

- `src/screens/AppPage.tsx`
  - Main swiping experience after onboarding.
  - Reads the stored profile from AsyncStorage (`bumpmatch_user_profile`) to display a personalized greeting using the saved surname.
  - Maintains local state for:
    - Current stack of `BabyName` cards (`names`).
    - Swipe history (`cardHistory`) used for a simple "rewind" feature.
    - `likedNames` and `dislikedNames` collections.
    - Active filters: `genderFilter` (`'boy' | 'unisex' | 'girl'`) and `languageFilter` (e.g. `All`, `English`, `Zulu`, `Afrikaans`).
    - Visibility of a partner-invite modal (`inviteVisible`).
  - Uses `getRandomNames` from `src/data/babyNames` to fetch batches of names according to the selected filters and previously seen IDs.
  - Passes the `names` list to `CardStack`, and wires swipe callbacks:
    - Right swipe → add to `likedNames`, record in `cardHistory`, remove from `names`.
    - Left swipe → add to `dislikedNames`, record in `cardHistory`, remove from `names`.
    - `handleRewind` pops the last card from history, removes it from liked/disliked lists, and re-inserts it at the front of `names`.
    - `handleEmpty` fetches and appends additional names when the stack is exhausted.
  - Renders a header with invite/menu icons, a filter bar, the card stack, swipe action buttons, and footer stats.

### Components and domain layer (`src/components`, `src/models`, `src/data`)

- `src/models/BabyName.ts`
  - Defines the core domain model for the app:
    - `id: string`
    - `name: string`
    - `gender: 'boy' | 'girl' | 'unisex'`
    - `origin: string`
    - `meaning: string`
    - `language: string`
  - All name-related UI and logic is typed against this interface.

- `src/data/babyNames.ts`
  - Provides the underlying dataset of baby names and a helper `getRandomNames` used by `AppPage` to generate filtered card stacks.
  - Filtering uses the `gender` and `language` fields, and supports excluding already seen IDs.

- `src/components/CardStack.tsx`
  - Implements the Tinder-like swipe interaction for baby-name cards.
  - Uses `react-native-gesture-handler` and `react-native-reanimated` to track drag gestures and animate the top card.
  - Treats `names[0]` as the current card and `names[1]` as the "next" card, animating the next card slightly scaled/underneath.
  - Exposes callbacks:
    - `onSwipeRight(name: BabyName)`
    - `onSwipeLeft(name: BabyName)`
    - `onEmpty()` when the stack is depleted.
  - Resets internal animated values whenever the ID of the top card changes.

- Other components (from filenames)
  - `src/components/Button.tsx` and `src/components/Input.tsx` encapsulate common styling/behavior for buttons and text inputs, using `AppTokens` for consistency.
  - `src/components/NameCard.tsx` renders the visual representation of a single `BabyName` (name, meaning, metadata) and is used inside `CardStack`.
  - `src/components/PartnerInviteDialog.tsx` displays a share/invite flow, using the stored surname to generate copy; this is controlled by `AppPage` via `inviteVisible`.

### Theming and design tokens (`src/theme`)

- `src/theme/designTokens.ts`
  - Central design system object `AppTokens` used across screens and components for:
    - Colors (primary, secondary, like/dislike, text, greys, gradients, shadows).
    - Spacing scale (`xs` → `xxl`).
    - Border radii (including a `round` radius for pills/circles).
    - Typography (font family names matching Inter font variants, and a small set of font sizes: `small`, `body`, `h3`, `h2`, `h1`, `hero`).
  - All layout and typography in the app should prefer these tokens over inline literals to keep the UI consistent.

### Navigation, persistence, and state

- Navigation is handled entirely via React Navigation's stack navigator configured in `App.tsx`.
- Persistent state is stored in `AsyncStorage` under these keys:
  - `bumpmatch_user_profile` – JSON-encoded profile object from `LandingPage`.
  - `bumpmatch_onboarding_completed` – string `'true'` when onboarding is complete; used by `App.tsx` to choose the initial route.
- Runtime state is maintained via local `useState` hooks within screens; there is no global state manager (Redux, Zustand, etc.).

### Tooling and configuration

- `app.json` configures the Expo app (name, slug, icons, splash screen, platform-specific options, and EAS project ID).
- `babel.config.js` uses the `babel-preset-expo` preset with the `react-native-reanimated/plugin` required by Reanimated.
- `tsconfig.json` extends the Expo base TypeScript config (`expo/tsconfig.base`) and enables `strict` mode.

This overview should be sufficient for future Warp agents to quickly understand how to run and extend the app, where to place new screens or components, and how baby-name data flows from storage and data helpers into the swipe UI.