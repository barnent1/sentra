import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

// Configure snapshot testing
global.beforeEach(() => {
  // Setup for visual tests
});
