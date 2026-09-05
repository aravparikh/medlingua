// https://docs.expo.dev/guides/using-eslint/
//
// TODO(ui-redesign): three React Compiler rules are downgraded to `warn` below —
//   react-hooks/refs, react-hooks/purity, react-hooks/set-state-in-effect
// They flag the pre-existing `useRef(new Animated.Value()).current` idiom and
// render-time ref reads that the redesign rewrites screen by screen. Flip all
// three back to `error` IN THE SAME COMMIT as the last screen migration.
// Warning count must be zero before ui-redesign merges.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Names re-exported from src/theme.ts's TRANSITIONAL ALIASES block. Importing
 * any of them is an error everywhere except the files still waiting to be
 * migrated (listed below). Migrating a file = redesigning it on the new tokens
 * AND deleting it from UNMIGRATED; if it still reaches for an alias, lint fails.
 */
const TRANSITIONAL_ALIASES = ['colors', 'fonts', 'type', 'shadows', 'displayFontFor', 'MIN_TARGET', 'palette'];

/** Cross these off as they migrate. Empty list = delete the aliases block. */
const UNMIGRATED = [
  'src/components/BodyMap.tsx',
  'src/components/FullscreenTranslation.tsx',
  'src/components/RightsCard.tsx',
  'src/components/Skeleton.tsx',
  'src/components/SummaryModal.tsx',
  'src/components/icons/scenes.tsx',
  'src/screens/AboutScreen.tsx',
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'scripts/tune_results.csv'],
  },
  {
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/theme', '**/theme.ts'],
              importNames: TRANSITIONAL_ALIASES,
              message:
                'Transitional alias from src/theme.ts. Use useTheme()/fontFor()/text/tapTarget/elevation instead. ' +
                'Only files listed in UNMIGRATED (eslint.config.js) may still import these.',
            },
          ],
        },
      ],
    },
  },
  {
    files: UNMIGRATED,
    rules: { 'no-restricted-imports': 'off' },
  },
]);
