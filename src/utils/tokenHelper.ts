import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../config/constants';

export interface TokenPayload {
  userId: string;
  schoolId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: JWT_ACCESS_EXPIRY,
  } as SignOptions);

export const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: JWT_REFRESH_EXPIRY,
  } as SignOptions);

export const verifyToken = (token: string, secret: string): TokenPayload =>
  jwt.verify(token, secret) as TokenPayload;
