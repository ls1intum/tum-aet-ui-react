/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  reportNeedlessDisables: true,
  reportInvalidScopeDisables: true,
  reportDescriptionlessDisables: true,
  rules: {
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
      'color',
      'device-cmyk',
    ],
    'color-no-hex': true,
    'color-named': 'never',
    'declaration-empty-line-before': null,
    // Hover, focus and disabled states are ordered by meaning, not by specificity.
    'no-descending-specificity': null,
    'declaration-no-important': true,
    'selector-max-id': 0,
    'selector-max-compound-selectors': 4,
    'max-nesting-depth': 2,
    'selector-class-pattern': [
      '^tumaet-ui-[a-z0-9]+(?:-[a-z0-9]+)*$',
      { message: 'Class names start with tumaet-ui-' },
    ],
    'custom-property-pattern': [
      '^(?:tumaet-ui-|_)[a-z0-9]+(?:-[a-z0-9]+)*$',
      { message: 'Custom properties start with --tumaet-ui-' },
    ],
  },
  overrides: [
    {
      // The theme file is where the literal colours are defined.
      files: ['src/styles/themes.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
      },
    },
  ],
};
