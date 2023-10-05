module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 100,
      statements: 100,
      functions: 100,
      lines: 100,
    },
  },
};
