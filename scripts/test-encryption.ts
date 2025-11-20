/**
 * Test encryption service
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// Import encryption service
import { encryptValue, decryptValue, isEncryptionConfigured } from '../src/services/encryption';

async function testEncryption() {
  console.log('Testing encryption service...');
  console.log('Is encryption configured?', isEncryptionConfigured());

  if (!isEncryptionConfigured()) {
    console.error('ERROR: ENCRYPTION_SECRET not set in environment');
    process.exit(1);
  }

  // Test encryption/decryption
  const testData = [
    'sk-test-key-12345',
    'ghp_testtoken123',
    'anthropic-api-key-test',
  ];

  for (const plainText of testData) {
    console.log('\nOriginal:', plainText);

    const encrypted = encryptValue(plainText);
    console.log('Encrypted:', encrypted.substring(0, 50) + '...');

    const decrypted = decryptValue(encrypted);
    console.log('Decrypted:', decrypted);

    if (plainText === decrypted) {
      console.log('✅ PASS: Encryption/decryption successful');
    } else {
      console.log('❌ FAIL: Decryption did not match original');
      process.exit(1);
    }
  }

  console.log('\n✅ All encryption tests passed!');
}

testEncryption().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
