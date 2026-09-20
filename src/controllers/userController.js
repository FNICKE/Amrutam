'use strict';

const userService = require('../services/userService');
const { sendSuccess, sendPaginated } = require('../utils/response');

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    sendSuccess(res, { data: user });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { message: 'Profile updated', data: profile });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const result = await userService.changePassword(req.user.id, req.body);
    sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
}

async function deactivateAccount(req, res, next) {
  try {
    const result = await userService.deactivateAccount(req.user.id);
    sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
}

async function getAllUsers(req, res, next) {
  try {
    const { users, page, limit, total } = await userService.getAllUsers(req.query, req.query);
    sendPaginated(res, { data: users, page, limit, total });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, changePassword, deactivateAccount, getAllUsers };
