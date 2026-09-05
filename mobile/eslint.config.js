// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'scripts/tune_results.csv'],
  },
  {
    // React Compiler rules. They flag the `useRef(new Animated.Value()).current`
    // idiom in the five motion files and ref reads in ConversationScreen —
    // all pre-existing, all rewritten screen-by-screen in the redesign. Warn
    // (visible, counted) until the last screen migrates; then flip to error.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
