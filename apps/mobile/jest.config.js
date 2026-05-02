/**
 * Jest config for pure-logic unit tests inside apps/mobile.
 *
 * Scope: files under src/lib/** that have no React Native or Expo
 * dependencies. UI/component tests (eventually with @testing-library/
 * react-native) will need a separate preset (jest-expo) and config.
 *
 * Why scoped narrowly: the React Native / Expo Jest preset has a
 * heavy startup cost and needs jsdom-style environment shimming.
 * For state machines and reducers a plain node environment with
 * ts-jest is far faster and just as correct.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src/lib',
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
