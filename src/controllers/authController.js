'use strict';

const authService = require('../services/authService');
const { sendSuccess, sendCreated } = require('../utils/response');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    sendCreated(res, { message: 'Registration successful', data: user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, { message: 'Login successful', data: result });
  } catch (err) { next(err); }
}

async function refreshTokens(req, res, next) {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, { message: 'Tokens refreshed', data: tokens });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { data: user });
  } catch (err) { next(err); }
}

module.exports = { register, login, refreshTokens, logout, getMe };
