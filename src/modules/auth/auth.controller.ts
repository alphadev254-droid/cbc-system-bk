import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { success } from '../../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.register(req.body.name, req.body.email, req.body.password);
    success(res, user, 'Account created successfully', 201);
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await authService.refreshToken(req.body.refreshToken);
    success(res, data);
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.body.refreshToken);
    success(res, null, 'Logged out');
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    success(res, null, 'If that email exists, a reset link has been sent');
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    success(res, null, 'Password reset successful');
  } catch (err) { next(err); }
};

export const loginIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await authService.loginIdentity(req.body.userType, req.body.identity, req.body.password);
    success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

export const forgotPasswordOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPasswordOtp(req.body.userType, req.body.identity);
    success(res, null, 'If the identity is valid, an OTP has been sent');
  } catch (err) { next(err); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.verifyOtp(req.body.userType, req.body.otp);
    success(res, null, 'OTP verified');
  } catch (err) { next(err); }
};
