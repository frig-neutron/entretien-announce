/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  collectCoverageFrom: ['src/**ts', '!src/i18n/**'],

  detectOpenHandles: true,

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  globals: {
    'ts-jest': {},
  },
};
