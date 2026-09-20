'use strict';

const { getPrismaClient } = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { hashPassword, comparePassword } = require('../utils/hash');
const { AuthenticationError, ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

const prisma = getPrismaClient();

/** Register a new user */
async function register({ email, password, role = 'PATIENT', firstName = '', lastName = '' }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      profile: {
        create: { firstName, lastName }
      }
    },
    include: { profile: true }
  });

  logger.info('User registered', { userId: user.id, role: user.role });

  const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
  return safeUser;
}

/** Login with email + password, returns tokens */
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user || !user.isActive) throw new AuthenticationError('Invalid email or password');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AuthenticationError('Invalid email or password');

  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Persist refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

  logger.info('User logged in', { userId: user.id });

  const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

/** Rotate refresh tokens */
async function refreshTokens(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token expired or revoked');
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const payload = { sub: decoded.sub, role: decoded.role, email: decoded.email };
  const newAccessToken  = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: decoded.sub, token: newRefreshToken, expiresAt } });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/** Logout — revoke refresh token */
async function logout(refreshToken) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  logger.info('User logged out');
}

/** Get current user profile */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });
  if (!user) throw new NotFoundError('User');
  const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
  return safeUser;
}

module.exports = { 
  register,
  login,
  refreshTokens,
  logout,
  getMe
     };
