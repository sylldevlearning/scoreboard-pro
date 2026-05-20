/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["./jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  collectCoverageFrom: [
    "hooks/**/*.ts",
    "components/**/*.tsx",
    "app/**/*.tsx",
    "!app/_layout.tsx",
    "!app/+html.tsx",
    "!app/+error.tsx",
    "!app/+not-found.tsx",
    "!**/__tests__/**",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
};
