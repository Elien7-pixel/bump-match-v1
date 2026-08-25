const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Allow non-modular includes inside framework modules.
 *
 * `useFrameworks: "static"` is required for react-native-firebase on CocoaPods —
 * FirebaseCoreInternal is a Swift pod depending on GoogleUtilities, which
 * defines no modules, so it cannot integrate as a plain static library.
 *
 * Building pods as framework modules then makes RNFBApp's inclusion of
 * React-Core's RCTConvert.h an error, because React-Core is not itself modular:
 *
 *   include of non-modular header inside framework module
 *   'RNFBApp.RCTConvert_FIRApp' [-Werror,-Wnon-modular-include-in-framework-module]
 *
 * CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES downgrades that back to
 * a warning. It is the fix react-native-firebase documents for this exact
 * combination, and it is narrower than making every pod modular with
 * use_modular_headers!, which changes how the whole dependency graph builds.
 *
 * expo-build-properties exposes no option for this, hence a local plugin.
 */
const SNIPPET = `
    # Added by plugins/withNonModularIncludes.js — see that file for why.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
`;

module.exports = function withNonModularIncludes(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        return cfg;
      }

      // Append inside the existing post_install block, after react_native_post_install.
      const marker = /(\s*react_native_post_install\((?:[^()]|\([^()]*\))*\)\n)/;
      if (!marker.test(contents)) {
        throw new Error(
          'withNonModularIncludes: could not find react_native_post_install in the Podfile. ' +
          'The Podfile template changed — update this plugin rather than skipping it silently.',
        );
      }
      contents = contents.replace(marker, `$1${SNIPPET}`);

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
