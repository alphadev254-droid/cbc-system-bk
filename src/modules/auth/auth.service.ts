import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/tokenHelper';
import { addDays } from '../../utils/dateHelper';
import { sendEmail } from '../../services/email.service';
import { createError } from '../../middleware/errorHandler.middleware';
import { getUserSchools } from '../../services/roleContext.service';
import { DEFAULT_ROLE_PERMISSIONS, Role, BCRYPT_ROUNDS } from '../../config/constants';
import { prisma } from '../../config/prisma';
import * as repo from './auth.repository';

export const register = async (name: string, email: string, password: string) => {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw createError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await repo.createUser({
    name,
    email,
    passwordHash,
    role:             'SYSTEM_ADMIN',
    schoolId:         null,
    isActive:         true,
    twoFactorEnabled: false,
  });

  // Global SchoolRole — schoolId null = platform-wide SYSTEM_ADMIN
  await prisma.schoolRole.create({
    data: { userId: user.id, schoolId: null, role: 'SYSTEM_ADMIN', isActive: true },
  });

  // Ensure SYSTEM_ADMIN permissions are linked
  const permKeys    = DEFAULT_ROLE_PERMISSIONS[Role.SYSTEM_ADMIN] ?? [];
  const permissions = await prisma.permission.findMany({ where: { key: { in: permKeys } } });
  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where:  { role_permissionId: { role: 'SYSTEM_ADMIN', permissionId: p.id } },
        create: { role: 'SYSTEM_ADMIN', permissionId: p.id },
        update: {},
      })
    )
  );

  return { id: user.id, name: user.name, email: user.email, role: Role.SYSTEM_ADMIN };
};

export const login = async (email: string, password: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401);

  const schoolContexts = await getUserSchools(user.id);
  const isGlobalAdmin  = schoolContexts.some((s) => s.isGlobalAdmin);
  const primarySchool  = schoolContexts.find((s) => s.schoolId !== null) ?? schoolContexts[0];
  const schoolId       = isGlobalAdmin ? '' : (primarySchool?.schoolId ?? '');
  const role           = primarySchool?.role ?? (user.role as Role);

  const payload      = { userId: user.id, schoolId, role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await repo.saveRefreshToken(user.id, refreshToken, addDays(new Date(), 30));
  await repo.updateUserById(user.id, { lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    user: {
      id:           user.id,
      name:         user.name,
      email:        user.email,
      role,
      isGlobalAdmin,
      schools: schoolContexts.map((ctx) => ({
        schoolId:    ctx.schoolId,
        schoolName:  ctx.school?.name ?? null,
        role:        ctx.role,
        permissions: ctx.permissions,
      })),
    },
  };
};

export const refreshToken = async (token: string) => {
  const stored = await repo.findRefreshTokenByValue(token);
  if (!stored || new Date() > stored.expiresAt) throw createError('Invalid refresh token', 401);

  const payload     = verifyToken(token, process.env.JWT_REFRESH_SECRET as string);
  const accessToken = generateAccessToken({
    userId:   payload.userId,
    schoolId: payload.schoolId,
    role:     payload.role,
  });

  return { accessToken };
};

export const logout = async (token: string) => {
  await repo.revokeRefreshTokenByValue(token);
};

export const forgotPassword = async (email: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) return;

  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = addDays(new Date(), 1);

  await repo.updateUserById(user.id, { passwordResetToken: token, passwordResetExpiry: expiry });
  await sendEmail(
    email,
    'reset-password',
    { name: user.name, resetUrl: `${process.env.APP_URL}/reset-password?token=${token}` },
    'Reset Your Password'
  );
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await repo.findUserByResetToken(token);
  if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
    throw createError('Invalid or expired reset token', 400);
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await repo.updateUserById(user.id, {
    passwordHash,
    passwordResetToken:  null,
    passwordResetExpiry: null,
  });
};
