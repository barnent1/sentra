/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/disabled/**',
        'deploy/**'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    include: ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/node_modules/**',
      '**/disabled/**',
      'deploy/**'
    ],
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    }
  },
  resolve: {
    alias: {
      '@sentra/types': resolve(__dirname, './packages/types/src'),
      '@sentra/core': resolve(__dirname, './packages/core/src'),
      '@': resolve(__dirname, './packages')
    }
  }
});