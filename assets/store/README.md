# Store assets

Captured from the **v1.0.8 Release** build on 31 Jul 2026, in the July 2026 pastel brand.
All five screens are the same set the listings have always used: Landing, Swipe,
Liked Names, Partner, Profile.

| Folder / file | Size | Where it goes |
|---|---|---|
| `screenshots/ios-iphone-6.9/` | 1320×2868 | App Store — 6.9" iPhone (the only mandatory iPhone size; Apple scales it down for smaller devices) |
| `screenshots/ios-ipad-13/` | 2064×2752 | App Store — 13" iPad. Required because `app.json` sets `ios.supportsTablet: true` |
| `screenshots/android-phone/` | 1080×2400 | Play Console — phone screenshots |
| `screenshots/android-tablet-7/` | 1080×1920 | Play Console — 7" tablet |
| `screenshots/android-tablet-10/` | 1536×2048 | Play Console — 10" tablet (**3:4 — see below**) |
| `feature-graphic-1024x500.png` | 1024×500 | Play Console — feature graphic |
| `app-icon-512.png` | 512×512 | Play Console — listing icon |

Screenshots were shot on the `sherbet@…` demo account (invite code `AI-G098`,
14 favourites) so all three platforms show consistent content.

## Regenerating

**Feature graphic** — pure composition from `assets/brand/`, no device needed:

```sh
python3 scripts/make-feature-graphic.py
```

**Screenshots** — capture raw frames, then normalise them into the folders above:

```sh
python3 scripts/export-store-screenshots.py <dir-of-raw-captures>
```

`export-store-screenshots.py` enforces the exact pixel size per platform and
refuses anything that does not match, so a capture taken on the wrong device
fails loudly instead of reaching the store.

### Capture notes

- **iOS / iPadOS** — boot the sim, then pin the status bar before capturing:
  `xcrun simctl status_bar booted override --time 9:41 --wifiBars 3 --cellularBars 4 --batteryState charged --batteryLevel 100`
- **iPadOS 26 only** — windowed apps draw a resize handle in the bottom-right
  corner. It is OS chrome, not app UI, so the export script flattens that corner
  to the surrounding background (~520px per shot, always over flat cream).
- **Android** — put SystemUI into demo mode for a clean status bar:
  `adb shell settings put global sysui_demo_allowed 1`, then broadcast
  `com.android.systemui.demo` with `clock hhmm 0941`, `battery level 100`,
  `network wifi show level 4 fully true`, `network mobile hide`,
  `notifications visible false`. Exit with `command exit` afterwards.
- The Play-image emulator disallows `adb root`, and the release APK is not
  debuggable, so seeding a logged-in session needs a one-off release build with
  `debuggable true` applied through a `gradlew -I` init script — this keeps
  `android/app/build.gradle` untouched.

## Play's 10-inch tablet ratio

The 10" slot rejects images that are too elongated. Measured against what Play
actually accepted:

| Size | Ratio | Result |
|---|---|---|
| 2064×2752 | 3:4 (0.750) | accepted |
| 1600×2560 | 5:8 (0.625) | rejected |
| 1440×2560 | 9:16 (0.563) | rejected |

So the cutoff sits above 0.625, and **3:4 is the safe target** — do not "fix"
this slot to 16:9/9:16, which makes it worse. The 7" slot and phone slot are
happy with taller ratios.

## Still stale

`screenshots/check*.png` (×8) and `screenshots/phone-01-landing.png` are
old-brand leftovers from before the rebrand. They are not part of any current
listing set and can be deleted.
