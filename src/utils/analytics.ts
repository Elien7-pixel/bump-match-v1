/**
 * Unified analytics for Bump Match.
 *
 * One call site, two destinations:
 *   - Firebase Analytics  -> Google Analytics 4 (product reporting, funnels, retention)
 *   - Meta App Events     -> Events Manager -> Custom Audiences -> Lookalikes
 *
 * Both SDKs are optional at runtime. In Expo Go, in unit tests, or in any build
 * where the native modules are missing, every function here degrades to a no-op
 * instead of throwing — the same defensive pattern App.tsx already uses for
 * push notifications.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Optional native modules
// ---------------------------------------------------------------------------

let fb: any = null;          // @react-native-firebase/analytics (modular API)
let fbAnalytics: any = null; // the resolved Analytics instance
let meta: any = null;        // react-native-fbsdk-next
let att: any = null;         // expo-tracking-transparency

try {
  // The modular API is NOT on the package root in v23 — the root exports the
  // legacy namespaced surface. Requiring the root leaves getAnalytics undefined,
  // and because every call here is wrapped in try/catch that fails *silently*:
  // the app would ship reporting nothing at all. Import the subpath explicitly.
  fb = require('@react-native-firebase/analytics/lib/modular');
} catch (e) {
  console.log('[analytics] Firebase Analytics unavailable:', (e as Error)?.message);
}

// Fail loudly in development if the surface is not what this file expects. A
// version bump that moves these functions would otherwise look like "analytics
// is quiet today" rather than a break.
if (__DEV__ && fb) {
  const required = [
    'getAnalytics', 'logEvent', 'logScreenView',
    'setUserId', 'setUserProperties', 'setAnalyticsCollectionEnabled', 'setConsent',
  ];
  const missing = required.filter((fn) => typeof fb[fn] !== 'function');
  if (missing.length) {
    console.error(
      `[analytics] Firebase modular API is missing: ${missing.join(', ')}. ` +
      'Analytics will silently no-op. Check the @react-native-firebase/analytics version.',
    );
  }
}

try {
  meta = require('react-native-fbsdk-next');
} catch (e) {
  console.log('[analytics] Meta SDK unavailable:', (e as Error)?.message);
}

try {
  att = require('expo-tracking-transparency');
} catch (e) {
  console.log('[analytics] Tracking transparency unavailable:', (e as Error)?.message);
}

const getFb = () => {
  if (!fb) return null;
  if (!fbAnalytics) {
    try {
      fbAnalytics = fb.getAnalytics();
    } catch (e) {
      console.log('[analytics] getAnalytics failed:', (e as Error)?.message);
      return null;
    }
  }
  return fbAnalytics;
};

// ---------------------------------------------------------------------------
// Event names
//
// GA4 rules: <=40 chars, letters/digits/underscore, must not start with a digit.
// Meta custom event names follow the same shape, so one constant serves both.
// The five FUNNEL_* events are the acquisition ladder the Meta audiences are
// built from — install -> account -> swiping -> partner -> match.
// ---------------------------------------------------------------------------

export const AnalyticsEvent = {
  // --- Funnel (also mirrored to Meta as audience sources) ---
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  STARTED_SWIPING: 'started_swiping',
  PARTNER_CONNECTED: 'partner_connected',
  NAMES_MATCHED: 'names_matched',

  // --- Engagement ---
  ONBOARDING_START: 'onboarding_start',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  NAME_LIKED: 'name_liked',
  NAME_PASSED: 'name_passed',
  NAME_FAVORITED: 'name_favorited',
  FILTER_CHANGED: 'filter_changed',

  // --- Virality ---
  INVITE_SENT: 'invite_sent',
  SHARE_NAME_CARD: 'share_name_card',
  STORE_LINK_TAPPED: 'store_link_tapped',

  // --- Consent ---
  ATT_PROMPT_ANSWERED: 'att_prompt_answered',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/**
 * Events that are also sent to Meta, mapped to the event name Meta will show in
 * Events Manager. Only funnel-grade signals go to Meta — high-frequency noise
 * like every single swipe would dilute the audiences and burn the event budget.
 */
const META_EVENT_MAP: Partial<Record<AnalyticsEventName, string>> = {
  [AnalyticsEvent.SIGN_UP]: 'fb_mobile_complete_registration', // Meta standard
  [AnalyticsEvent.STARTED_SWIPING]: 'StartedSwiping',
  [AnalyticsEvent.PARTNER_CONNECTED]: 'AddedPartner',
  [AnalyticsEvent.NAMES_MATCHED]: 'MatchedNames',
  [AnalyticsEvent.INVITE_SENT]: 'InviteSent',
  [AnalyticsEvent.ONBOARDING_COMPLETE]: 'CompletedOnboarding',
};

// Milestones that must fire at most once per install.
const ONCE_ONLY: AnalyticsEventName[] = [
  AnalyticsEvent.STARTED_SWIPING,
  AnalyticsEvent.PARTNER_CONNECTED,
  AnalyticsEvent.NAMES_MATCHED,
];

const onceKey = (event: string) => `bumpmatch_analytics_once_${event}`;

// ---------------------------------------------------------------------------
// Tracking consent
//
// Advertising identifiers and Meta advanced matching need a lawful basis under
// POPIA and GDPR. iOS has ATT; Android has no OS-level equivalent, so the app
// asks directly. Either way the answer lands here.
//
// Default is DENIED. Nothing advertising-related is collected until the user
// says yes — the previous behaviour enabled it unconditionally on Android,
// which gave the same processing a consent basis on iOS and none on Android.
// ---------------------------------------------------------------------------

export type TrackingConsent = 'granted' | 'denied' | 'unknown';

const CONSENT_KEY = 'bumpmatch_tracking_consent';

/** Mirrors the stored value so synchronous callers can read it without await. */
let consentState: TrackingConsent = 'unknown';

/** Has the user been asked yet? Drives whether the Android prompt is shown. */
export const hasAnsweredTrackingConsent = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    return stored === 'granted' || stored === 'denied';
  } catch {
    return false;
  }
};

export const getTrackingConsent = (): TrackingConsent => consentState;

/**
 * Push the current answer into both SDKs.
 *
 * Product analytics (`analytics_storage`) stays on regardless — that runs on
 * legitimate interests and uses no advertising identifier. Only the three
 * advertising signals follow consent.
 */
const applyConsent = async (granted: boolean): Promise<void> => {
  try {
    const analytics = getFb();
    if (analytics) {
      await fb.setConsent(analytics, {
        analytics_storage: true,
        ad_storage: granted,
        ad_user_data: granted,
        ad_personalization: granted,
      });
    }
  } catch (e) {
    console.log('[analytics] setConsent failed:', (e as Error)?.message);
  }

  try {
    if (meta?.Settings) {
      meta.Settings.setAdvertiserIDCollectionEnabled(granted);
      meta.Settings.setAdvertiserTrackingEnabled(granted);
    }
  } catch (e) {
    console.log('[analytics] Meta consent failed:', (e as Error)?.message);
  }
};

/** Record the user's answer and apply it. Used by both the ATT and Android flows. */
export const setTrackingConsent = async (granted: boolean): Promise<void> => {
  consentState = granted ? 'granted' : 'denied';
  try {
    await AsyncStorage.setItem(CONSENT_KEY, consentState);
  } catch (e) {
    console.log('[analytics] persisting consent failed:', (e as Error)?.message);
  }
  await applyConsent(granted);

  // Clear anything already shared with Meta when consent is withdrawn.
  if (!granted) {
    try {
      meta?.AppEventsLogger?.clearUserData?.();
    } catch (e) {
      console.log('[analytics] clearUserData failed:', (e as Error)?.message);
    }
  }
};

// ---------------------------------------------------------------------------
// Param sanitising
// ---------------------------------------------------------------------------

/**
 * GA4 rejects the whole event if a param is malformed, so clamp everything:
 * string values to 100 chars, at most 25 params, no null/undefined.
 */
const sanitize = (params?: Record<string, any>): Record<string, any> => {
  if (!params) return {};
  const out: Record<string, any> = {};
  let count = 0;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || count >= 25) continue;
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (typeof value === 'string') {
      out[safeKey] = value.slice(0, 100);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[safeKey] = value;
    } else {
      out[safeKey] = String(value).slice(0, 100);
    }
    count++;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

let initialised = false;

/**
 * Boot both SDKs. Safe to call more than once.
 *
 * Meta's SDK is deliberately NOT auto-initialised in app.json — advertiser-ID
 * collection has to wait until we know the user's ATT choice on iOS, otherwise
 * the first events leave before the prompt is answered.
 */
export const initAnalytics = async (): Promise<void> => {
  if (initialised) return;
  initialised = true;

  try {
    const analytics = getFb();
    if (analytics) {
      await fb.setAnalyticsCollectionEnabled(analytics, true);
    }
  } catch (e) {
    console.log('[analytics] Firebase init failed:', (e as Error)?.message);
  }

  try {
    if (meta?.Settings) {
      meta.Settings.initializeSDK();
      meta.Settings.setAutoLogAppEventsEnabled(true);
    }
  } catch (e) {
    console.log('[analytics] Meta init failed:', (e as Error)?.message);
  }

  // Restore the stored answer, defaulting to denied. Both platforms start with
  // advertising off and only turn it on once the user has actually agreed.
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    consentState = stored === 'granted' ? 'granted' : stored === 'denied' ? 'denied' : 'unknown';
  } catch {
    consentState = 'unknown';
  }
  await applyConsent(consentState === 'granted');
};

/**
 * Ask for App Tracking Transparency (iOS 14.5+) and tell the Meta SDK the
 * answer. Without a granted ATT prompt iOS gives Meta no IDFA, which is what
 * drives custom-audience match rates and therefore lookalike quality.
 *
 * Call this AFTER onboarding, never on the very first frame — a cold prompt
 * with no context is the single biggest cause of low opt-in rates.
 */
export const requestTrackingPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios' || !att) return Platform.OS === 'android';

  try {
    const { status } = await att.requestTrackingPermissionsAsync();
    const granted = status === 'granted';
    await setTrackingConsent(granted);
    void logEvent(AnalyticsEvent.ATT_PROMPT_ANSWERED, { granted, platform: 'ios' });
    return granted;
  } catch (e) {
    console.log('[analytics] ATT request failed:', (e as Error)?.message);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Pregnancy status is the most useful segmentation dimension this app has, and
 * also the one it must not send by default.
 *
 * It is special-category data under GDPR Art. 9 and special personal information
 * under POPIA. Art. 9 is not satisfied by legitimate interests — the basis the
 * privacy policy currently claims for analytics — it needs explicit, separate,
 * opt-in consent. Google's own Firebase guidance also discourages sensitive
 * values in user properties.
 *
 * Flip this to true ONLY once the app collects a specific analytics consent for
 * it and PRIVACY_POLICY.md documents it. Everything else keeps working either way.
 */
const SEND_SENSITIVE_USER_PROPERTIES = false;

/**
 * Event parameters that describe pregnancy or health.
 *
 * These are stripped from GA4 unless the flag above is on, and stripped from
 * Meta ALWAYS — regardless of the flag, and regardless of consent. Meta's
 * business tool terms prohibit sending health data, and a breach risks the ad
 * account, not just a fine. Keep this list ahead of new call sites.
 */
const SENSITIVE_PARAM_KEYS = ['status', 'pregnancy_status', 'expecting', 'due_date', 'dueDate'];

/**
 * Meta Advanced Matching — hashed email/name sent to Meta to raise custom-audience
 * match rates (roughly a third -> two thirds, which is the difference between a
 * lookalike modelled on your users and one modelled on a sample of them).
 *
 * On by default because it is what makes the audience strategy work, but it is
 * still sharing personal data with an ad network and needs a lawful basis.
 * Set to false to ship without it while the consent flow and privacy policy
 * catch up — nothing else in this file changes.
 */
const META_ADVANCED_MATCHING_ENABLED = true;

const stripSensitive = (params: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_PARAM_KEYS.includes(key)) continue;
    out[key] = value;
  }
  return out;
};

export type AnalyticsUserProps = {
  status?: string;    // pregnancy status — gated, see above
  gender?: string;
  ageBand?: string;
  hasPartner?: boolean;
  country?: string;
};

/**
 * Attach a stable ID and audience-shaping properties to the current user.
 *
 * NOTE: never pass raw email/name here. GA4 forbids PII in user properties, and
 * Meta advanced matching is handled separately in setMetaAdvancedMatching().
 */
export const identifyUser = async (
  userId: string,
  props?: AnalyticsUserProps,
): Promise<void> => {
  try {
    const analytics = getFb();
    if (analytics) {
      await fb.setUserId(analytics, userId);
      if (props) {
        await fb.setUserProperties(analytics, {
          user_gender: props.gender ?? '',
          age_band: props.ageBand ?? '',
          has_partner: props.hasPartner ? 'true' : 'false',
          country: props.country ?? '',
          ...(SEND_SENSITIVE_USER_PROPERTIES
            ? { pregnancy_status: props.status ?? '' }
            : {}),
        });
      }
    }
  } catch (e) {
    console.log('[analytics] identifyUser (Firebase) failed:', (e as Error)?.message);
  }

  try {
    meta?.AppEventsLogger?.setUserID?.(userId);
  } catch (e) {
    console.log('[analytics] identifyUser (Meta) failed:', (e as Error)?.message);
  }
};

/**
 * Meta Advanced Matching. The SDK SHA-256 hashes these on-device before they
 * leave the phone; Meta matches the hashes against its own user table, which is
 * what lifts custom-audience match rates from ~30% to ~70%+ and makes a 1%
 * lookalike actually resemble your users.
 *
 * Only call this once the user has consented — it shares hashed personal data
 * with an advertising network, which needs a lawful basis under POPIA/GDPR.
 */
export const setMetaAdvancedMatching = (data: {
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // YYYYMMDD
  gender?: string;      // 'm' | 'f'
  country?: string;     // ISO-2, lowercase
}): void => {
  try {
    if (!META_ADVANCED_MATCHING_ENABLED) return;
    // Sharing hashed personal data with an ad network is advertising processing,
    // so it waits for the same consent as the advertising identifier.
    if (consentState !== 'granted') return;
    if (!meta?.AppEventsLogger?.setUserData) return;
    meta.AppEventsLogger.setUserData({
      email: data.email?.trim().toLowerCase(),
      firstName: data.firstName?.trim().toLowerCase(),
      lastName: data.lastName?.trim().toLowerCase(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender?.trim().toLowerCase(),
      country: data.country?.trim().toLowerCase(),
    });
  } catch (e) {
    console.log('[analytics] Meta advanced matching failed:', (e as Error)?.message);
  }
};

/** Wipe identity on logout so the next user isn't merged into this one. */
export const resetUser = async (): Promise<void> => {
  try {
    const analytics = getFb();
    if (analytics) await fb.setUserId(analytics, null);
  } catch (e) {
    console.log('[analytics] resetUser (Firebase) failed:', (e as Error)?.message);
  }
  try {
    meta?.AppEventsLogger?.clearUserData?.();
    meta?.AppEventsLogger?.setUserID?.(null);
  } catch (e) {
    console.log('[analytics] resetUser (Meta) failed:', (e as Error)?.message);
  }
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Log an event to GA4 and, when it is a funnel signal, to Meta as well.
 * Fire-and-forget: callers never need to await this and it never throws.
 */
export const logEvent = async (
  event: AnalyticsEventName,
  params?: Record<string, any>,
): Promise<void> => {
  const safeParams = sanitize(params);

  // One-shot milestones: only the first occurrence per install counts.
  if ((ONCE_ONLY as string[]).includes(event)) {
    try {
      const seen = await AsyncStorage.getItem(onceKey(event));
      if (seen === 'true') return;
      await AsyncStorage.setItem(onceKey(event), 'true');
    } catch {
      // If storage fails, still send the event — a duplicate beats a silent miss.
    }
  }

  const gaParams = SEND_SENSITIVE_USER_PROPERTIES ? safeParams : stripSensitive(safeParams);
  const metaParams = stripSensitive(safeParams);

  try {
    const analytics = getFb();
    if (analytics) await fb.logEvent(analytics, event, gaParams);
  } catch (e) {
    console.log(`[analytics] Firebase logEvent(${event}) failed:`, (e as Error)?.message);
  }

  try {
    const metaName = META_EVENT_MAP[event];
    if (metaName && meta?.AppEventsLogger?.logEvent) {
      meta.AppEventsLogger.logEvent(metaName, metaParams);
    }
  } catch (e) {
    console.log(`[analytics] Meta logEvent(${event}) failed:`, (e as Error)?.message);
  }

  if (__DEV__) console.log(`[analytics] ${event}`, gaParams);
};

/** Screen view. Wired centrally from the navigation container. */
export const logScreen = async (screenName: string): Promise<void> => {
  try {
    const analytics = getFb();
    if (analytics) {
      await fb.logScreenView(analytics, {
        screen_name: screenName,
        screen_class: screenName,
      });
    }
  } catch (e) {
    console.log('[analytics] logScreen failed:', (e as Error)?.message);
  }
};

/** Clear the one-shot milestone flags (used when a user logs out). */
export const resetMilestones = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(ONCE_ONLY.map(onceKey));
  } catch (e) {
    console.log('[analytics] resetMilestones failed:', (e as Error)?.message);
  }
};
