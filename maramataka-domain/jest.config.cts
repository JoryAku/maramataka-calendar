module.exports = {
  displayName: 'maramataka-domain',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/maramataka-domain',
  maxWorkers: 1,
  openHandlesTimeout: 5000,
};
