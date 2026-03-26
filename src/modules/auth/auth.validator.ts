// @ts-nocheck
import Joi from 'joi';

export const registerSchema = Joi.object({
  name:     Joi.string().required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginIdentitySchema = Joi.object({
  userType: Joi.string().valid('staff', 'parent').required(),
  identity: Joi.string().required(),
  password: Joi.string().min(4).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const forgotPasswordOtpSchema = Joi.object({
  userType: Joi.string().valid('staff', 'parent').required(),
  identity: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  userType: Joi.string().valid('staff', 'parent').required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resetPasswordSchema = Joi.object({
  token:    Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
