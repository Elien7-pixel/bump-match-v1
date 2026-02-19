# Bump Match - App Store Deployment Guide

Your app is now configured for deployment to both app stores!

## ✅ Configuration Complete

| Setting | Value |
|---------|-------|
| **App Name** | Bump Match |
| **Bundle ID (iOS)** | `com.orbitai.bumpmatch` |
| **Package Name (Android)** | `com.orbitai.bumpmatch` |
| **Version** | 1.0.0 |

---

## 🍎 Apple App Store Deployment

### Step 1: Apple Developer Account
If you don't have one yet:
1. Go to [developer.apple.com/programs](https://developer.apple.com/programs/)
2. Enroll in the Apple Developer Program ($99/year)
3. Wait 24-48 hours for approval

### Step 2: Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Enter:
   - Platform: **iOS**
   - Name: **Bump Match**
   - Primary Language: Your language
   - Bundle ID: Select `com.orbitai.bumpmatch`
   - SKU: `bumpmatch` (internal identifier)

### Step 3: Build & Submit
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --latest
```

### Step 4: Store Listing Requirements
You'll need to provide in App Store Connect:
- [ ] App description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Screenshots (minimum 3 per device size)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] App icon (1024x1024, no transparency)

---

## 🤖 Google Play Store Deployment

### Step 1: Google Play Console Account
If you don't have one yet:
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete developer profile setup

### Step 2: Create App in Play Console
1. Click **Create app**
2. Enter:
   - App name: **Bump Match**
   - Default language: Your language
   - App or Game: **App**
   - Free or Paid: Your choice
3. Accept the declarations

### Step 3: Build & Submit
```bash
# Build for Play Store (produces AAB file)
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --latest
```

### Step 4: Store Listing Requirements
Complete these sections in Play Console:
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots (min 2, recommended 8)
- [ ] Feature graphic (1024 x 500px)
- [ ] App icon (512x512)
- [ ] Privacy Policy URL
- [ ] Content rating questionnaire
- [ ] Target audience & content
- [ ] Data safety form

---

## 🚀 Quick Commands Reference

```bash
# Development build (for testing)
eas build --platform all --profile development

# Preview build (internal testing)
eas build --platform all --profile preview

# Production build (store submission)
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## 📋 Pre-Submission Checklist

### Required Assets
- [ ] App icon (1024x1024 PNG, no transparency for iOS)
- [ ] Adaptive icon foreground (1024x1024 PNG for Android)
- [ ] Feature graphic (1024x500 PNG for Google Play)
- [ ] Screenshots for all required device sizes
- [ ] Privacy Policy hosted online

### Legal Requirements
- [ ] Privacy Policy URL
- [ ] Terms of Service URL (recommended)
- [ ] GDPR compliance if serving EU users
- [ ] COPPA compliance if app could appeal to children

### Testing
- [ ] Test production build on physical devices
- [ ] Verify all features work without dev tools
- [ ] Test on multiple device sizes
- [ ] Check for crashes and performance issues

---

## ❓ Common Issues & Solutions

**"Bundle ID already exists"**
→ Someone else has claimed this ID. Choose a different one.

**iOS build fails with signing error**
→ Run `eas credentials` and let EAS manage signing automatically.

**Android build fails with keystore error**
→ Run `eas credentials` to generate a new keystore.

**App rejected for missing privacy policy**
→ Host a privacy policy on your website and add the URL to store listings.
