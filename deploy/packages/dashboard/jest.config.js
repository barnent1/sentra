module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
    '**/__tests__/**/*.test.vue',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }],
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,vue}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  }
};