'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_chars';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/amrutam_test';
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';

const { hashPassword, comparePassword } = require('../../src/utils/hash');

describe('password hashing', () => {
  test('hashes and verifies a password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple1');

    expect(hash).not.toBe('CorrectHorseBatteryStaple1');
    await expect(comparePassword('CorrectHorseBatteryStaple1', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
