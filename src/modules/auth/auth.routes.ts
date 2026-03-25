import { Router } from 'express';
import * as ctrl from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  loginIdentitySchema,
  forgotPasswordSchema,
  forgotPasswordOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from './auth.validator';

const router = Router();

router.post('/register',        validate(registerSchema),       ctrl.register);
router.post('/login',           validate(loginSchema),          ctrl.login);
router.post('/login-identity', validate(loginIdentitySchema),  ctrl.loginIdentity);
router.post('/refresh',         validate(refreshTokenSchema),   ctrl.refresh);
router.post('/logout',          validate(refreshTokenSchema),   ctrl.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/forgot-password-otp', validate(forgotPasswordOtpSchema), ctrl.forgotPasswordOtp);
router.post('/reset-password',  validate(resetPasswordSchema),  ctrl.resetPassword);
router.post('/verify-otp', validate(verifyOtpSchema), ctrl.verifyOtp);

export default router;
