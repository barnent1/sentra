import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/setup/vitest.setup.ts'],

    // Globals (enables describe, it, expect without imports)
    globals: true,

    // Coverage configuration matching CLAUDE.md requirements
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'out/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/app/**', // Next.js app router files
        'src/lib/tauri.ts', // Requires Tauri integration tests (Tauri IPC)
        'src/components/ArchitectChat.tsx', // Requires Tauri integration tests (Tauri IPC)
        'src/lib/openai-voice.ts', // Requires browser API integration tests (MediaRecorder, AudioContext)
        'src/lib/openai-realtime.ts', // Requires browser API integration tests (WebSocket, AudioContext)
      ],
      // Overall threshold: 75%
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
      // Specific thresholds for services and utils (90%+)
      watermarks: {
        lines: [75, 90],
        functions: [75, 90],
        branches: [75, 90],
        statements: [75, 90],
      },
    },

    // Test file patterns
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}', // Allow co-located tests
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'out',
      '.next',
      'tests/e2e/**', // E2E tests use Playwright
      'tests/setup/**',
    ],

    // Reporters
    reporters: ['verbose'],

    // Test timeout
    testTimeout: 10000,

    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
