// Store listing URLs. The links belong in share TEXT/captions — never baked
// into share-card images.
export const APP_STORE_URL = 'https://apps.apple.com/app/id6776671806';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.orbitai.bumpmatch';

export const buildShareCaption = (fullName: string, meaning: string, origin: string): string =>
  `We're loving the name "${fullName}" for our baby! 💕\n` +
  `Meaning: ${meaning}\n` +
  `Origin: ${origin}\n\n` +
  `Find your baby's name on Bump Match:\n` +
  `iPhone: ${APP_STORE_URL}\n` +
  `Android: ${PLAY_STORE_URL}`;
