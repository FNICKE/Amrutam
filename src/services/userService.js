'use strict';

const { getPrismaClient } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/hash');
const { NotFoundError, AuthenticationError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');

const prisma = getPrismaClient();

/** Get profile for the logged-in user */
async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });
  if (!user) throw new NotFoundError('User');
  const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
  return safeUser;
}

/** Update user profile fields */
async function updateProfile(userId, data) {
  const { firstName, lastName, dateOfBirth, gender, avatarUrl, address } = data;
  const profile = await prisma.userProfile.update({
    where: { userId },
    data: { firstName, lastName, dateOfBirth, gender, avatarUrl, address }
  });
  return profile;
}

/** Change password after verifying current one */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AuthenticationError('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Revoke all refresh tokens on password change
  await prisma.refreshToken.deleteMany({ where: { userId } });
  return { message: 'Password changed successfully' };
}

/** Soft delete user account */
async function deactivateAccount(userId) {
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  return { message: 'Account deactivated successfully' };
}

/** Admin: list all users with pagination + filters */
async function getAllUsers(filters, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (filters.role)     where.role     = filters.role;
  if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const safeUsers = users.map(({ passwordHash: _, mfaSecret: __, ...u }) => u);
  return { users: safeUsers, page, limit, total };
}

module.exports = { getProfile, updateProfile, changePassword, deactivateAccount, getAllUsers };
