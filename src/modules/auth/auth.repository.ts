// @ts-nocheck
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export const findUserByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email, isActive: true } });

export const findUserByPhoneNumber = (phoneNumber: string) =>
  prisma.user.findFirst({ where: { phoneNumber, isActive: true } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const findUserByResetToken = (token: string) =>
  prisma.user.findFirst({ where: { passwordResetToken: token } });

export const createUser = (data: Prisma.UserUncheckedCreateInput) =>
  prisma.user.create({ data });

export const updateUserById = (id: string, data: Prisma.UserUncheckedUpdateInput) =>
  prisma.user.update({ where: { id }, data });

export const saveRefreshToken = (userId: string, token: string, expiresAt: Date) =>
  prisma.refreshToken.create({ data: { userId, token, expiresAt } });

export const findRefreshTokenByValue = (token: string) =>
  prisma.refreshToken.findFirst({ where: { token, isRevoked: false } });

export const revokeRefreshTokenByValue = (token: string) =>
  prisma.refreshToken.updateMany({ where: { token }, data: { isRevoked: true } });

export const revokeAllTokensByUserId = (userId: string) =>
  prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
