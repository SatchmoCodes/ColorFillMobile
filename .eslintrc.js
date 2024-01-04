module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['@react-native', 'prettier'],
  rules: {
    'no-shadow': 'off',
    'react-native/no-inline-styles': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react/self-closing-comp': 'off',
  },
}
