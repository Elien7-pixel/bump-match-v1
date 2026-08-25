#!/usr/bin/env node
/**
 * Preflight for the analytics stack.
 *
 * Firebase and Meta both fail at native build time with unhelpful errors when a
 * config file or key is missing, so check the four things that actually go wrong
 * and say exactly which console to open.
 *
 *   npm run check:analytics
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;

const problems = [];
const ok = [];

// Both platforms must sit in the SAME Firebase project, or the two app streams
// land in different GA4 properties and no funnel spans them. Easy to get wrong
// when more than one Firebase project exists for the same app.
let androidProject = null;
let iosProject = null;

// 1. Android Firebase config
const androidFile = app.android?.googleServicesFile;
if (!androidFile || !fs.existsSync(path.join(root, androidFile))) {
  problems.push(
    `Android: ${androidFile || 'google-services.json'} is missing.\n` +
    `   Firebase console > Project settings > Your apps > Android (${app.android?.package}) > google-services.json`,
  );
} else {
  const gs = JSON.parse(fs.readFileSync(path.join(root, androidFile), 'utf8'));
  const pkgs = (gs.client || []).map((c) => c.client_info?.android_client_info?.package_name);
  if (!pkgs.includes(app.android?.package)) {
    problems.push(
      `Android: google-services.json has no client for "${app.android?.package}" (found: ${pkgs.join(', ') || 'none'}).`,
    );
  } else {
    androidProject = gs.project_info?.project_id;
    ok.push(`Android Firebase config OK (${app.android.package}, project ${androidProject})`);
  }
}

// 2. iOS Firebase config
const iosFile = app.ios?.googleServicesFile;
if (!iosFile || !fs.existsSync(path.join(root, iosFile))) {
  problems.push(
    `iOS: ${iosFile || 'GoogleService-Info.plist'} is missing.\n` +
    `   Firebase console > Add app > iOS, bundle ID "${app.ios?.bundleIdentifier}", then download GoogleService-Info.plist to the project root.`,
  );
} else {
  const plist = fs.readFileSync(path.join(root, iosFile), 'utf8');
  if (!plist.includes(app.ios?.bundleIdentifier)) {
    problems.push(
      `iOS: GoogleService-Info.plist does not mention bundle ID "${app.ios?.bundleIdentifier}" — wrong app downloaded?`,
    );
  } else {
    iosProject = (plist.match(/<key>PROJECT_ID<\/key>\s*<string>([^<]+)<\/string>/) || [])[1];
    ok.push(`iOS Firebase config OK (${app.ios.bundleIdentifier}, project ${iosProject})`);
  }
}

// 2b. Both configs must name the same Firebase project.
if (androidProject && iosProject && androidProject !== iosProject) {
  problems.push(
    `Split projects: Android reports to "${androidProject}" but iOS reports to "${iosProject}".\n` +
    '   The two app streams would land in different GA4 properties and no funnel would span them.\n' +
    '   Re-download both config files from the same Firebase project.',
  );
} else if (androidProject && iosProject) {
  ok.push(`Both platforms report to the same project (${androidProject})`);
}

// 3. Meta SDK keys
const fbPlugin = (app.plugins || []).find(
  (p) => Array.isArray(p) && p[0] === 'react-native-fbsdk-next',
);
if (!fbPlugin) {
  problems.push('Meta: the react-native-fbsdk-next plugin is not configured in app.json.');
} else {
  const { appID, clientToken, scheme } = fbPlugin[1] || {};
  if (!appID || appID.includes('PLACEHOLDER')) {
    problems.push(
      'Meta: appID is still a placeholder.\n' +
      '   developers.facebook.com > your app > Settings > Basic > App ID',
    );
  } else if (scheme !== `fb${appID}`) {
    problems.push(`Meta: scheme should be "fb${appID}" but is "${scheme}".`);
  } else if (!clientToken || clientToken.includes('PLACEHOLDER')) {
    problems.push(
      'Meta: clientToken is still a placeholder.\n' +
      '   developers.facebook.com > your app > Settings > Advanced > Client token',
    );
  } else {
    ok.push(`Meta SDK config OK (App ID ${appID})`);
  }
}

// 4. ATT string — App Store review rejects the build without one.
if (!app.ios?.infoPlist?.NSUserTrackingUsageDescription) {
  problems.push('iOS: NSUserTrackingUsageDescription is missing — App Review rejects ATT builds without it.');
} else {
  ok.push('ATT usage description present');
}

ok.forEach((line) => console.log(`  ok  ${line}`));

if (problems.length) {
  console.error(`\n${problems.length} problem(s) to fix before building:\n`);
  problems.forEach((p, i) => console.error(` ${i + 1}. ${p}\n`));
  process.exit(1);
}

console.log('\nAnalytics config is complete — safe to build.');
