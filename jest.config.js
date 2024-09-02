module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
      '**/*.(t|j)s',
      '!**/*.spec.(t|j)s',
      '!**/node_modules/**',
      '!**/dist/**',
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/'],
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/src/$1',
    },
    coverageReporters: ['text', 'lcov', 'json', 'html'],
  };