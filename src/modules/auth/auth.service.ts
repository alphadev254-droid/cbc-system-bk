// @ts-nocheck
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/tokenHelper';
import { addDays } from '../../utils/dateHelper';
import { sendEmail } from '../../services/email.service';
import { sendSMS } from '../../services/sms.service';
import { createError } from '../../middleware/errorHandler.middleware';
import { getUserSchools } from '../../services/roleContext.service';
import { DEFAULT_ROLE_PERMISSIONS, Role, BCRYPT_ROUNDS } from '../../config/constants';
import { ensureSystemSchool } from '../../services/systemSchool.service';
import { prisma } from '../../config/prisma';
import * as repo from './auth.repository';

export const register = async (name: string, email: string, password: string) => {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw createError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const systemSchool = await ensureSystemSchool();

  const user = await repo.createUser({
    name,
    email,
    passwordHash,
    role:             'SYSTEM_ADMIN',
    schoolId:         systemSchool.id,
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

function normalizePhone(raw: string): string {
  return raw.replace(/\s/g, '').replace(/-/g, '');
}

function looksLikeEmail(raw: string): boolean {
  return raw.includes('@');
}

function looksLikePhone(raw: string): boolean {
  // Accept digits, optional leading +, spaces and dashes.
  return /^[+]?[\d\s-]{6,}$/.test(raw);
}

function generateOtp6(): string {
  const otp = crypto.randomInt(0, 1_000_000);
  return otp.toString().padStart(6, '0');
}

const OTP_EXPIRY_MINUTES = 10;

export const loginStudent = async (admissionNumber: string, password: string) => {
  const student = await prisma.student.findFirst({
    where: { admissionNumber: admissionNumber.trim() },
    select: { id: true, fullName: true, admissionNumber: true, schoolId: true, grade: true },
  });
  if (!student) throw createError('Invalid credentials', 401);

  // Password is the admission number itself
  if (password.trim() !== student.admissionNumber) throw createError('Invalid credentials', 401);

  const payload = { userId: student.id, schoolId: student.schoolId, role: 'STUDENT' as Role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token against student id (reuse same table, userId = student.id)
  await repo.saveRefreshToken(student.id, refreshToken, addDays(new Date(), 30));

  return {
    accessToken,
    refreshToken,
    user: {
      id:           student.id,
      name:         student.fullName,
      email:        '',
      role:         'STUDENT' as Role,
      isGlobalAdmin: false,
      studentId:    student.id,
      grade:        student.grade,
      admissionNumber: student.admissionNumber,
      schools: [{ schoolId: student.schoolId, schoolName: null, role: 'STUDENT' as Role, permissions: [] }],
    },
  };
};

export const loginIdentity = async (
  userType: 'staff' | 'parent',
  identity: string,
  password: string
) => {
  if (!identity) throw createError('Identity is required', 400);

  let userId: string | null = null;
  let tokenSchoolId: string | null = null;
  let tokenRole: Role = userType === 'parent' ? Role.PARENT : Role.TEACHER;

    let user: Awaited<ReturnType<typeof prisma.user.findFirst<{
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
        phoneNumber: true;
        passwordHash: true;
      }
    }>>> = null;
  if (userType === 'staff') {
    const isEmail = looksLikeEmail(identity);
    const normalizedEmail = isEmail ? identity.trim().toLowerCase() : undefined;
    const normalizedPhone = !isEmail ? normalizePhone(identity.trim()) : undefined;

    if (normalizedEmail) {
      user = await repo.findUserByEmail(normalizedEmail);
    } else if (normalizedPhone && looksLikePhone(identity)) {
      user = await repo.findUserByPhoneNumber(normalizedPhone);
    }

    if (!user || user.role === Role.PARENT) throw createError('Invalid credentials', 401);

    const schoolContexts = await getUserSchools(user.id);
    const isGlobalAdmin = schoolContexts.some((s) => s.isGlobalAdmin);
    const primarySchool = schoolContexts.find((s) => s.schoolId !== null) ?? schoolContexts[0];
    tokenSchoolId = isGlobalAdmin ? '' : (primarySchool?.schoolId ?? '');
    tokenRole = (primarySchool?.role ?? (user.role as Role)) as Role;

    const accessToken = generateAccessToken({ userId: user.id, schoolId: tokenSchoolId, role: tokenRole });
    const refreshToken = generateRefreshToken({ userId: user.id, schoolId: tokenSchoolId, role: tokenRole });

    await repo.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    await repo.updateUserById(user.id, { lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: tokenRole,
        isGlobalAdmin,
        schools: schoolContexts.map((ctx) => ({
          schoolId: ctx.schoolId,
          schoolName: ctx.school?.name ?? null,
          role: ctx.role,
          permissions: ctx.permissions,
        })),
      },
    };
  }

  // parent login
  if (looksLikePhone(identity)) {
    const normalizedPhone = normalizePhone(identity.trim());
    user = await repo.findUserByPhoneNumber(normalizedPhone);
    if (!user || user.role !== Role.PARENT) throw createError('Invalid credentials', 401);

    const schoolContexts = await getUserSchools(user.id);
    const primarySchool = schoolContexts.find((s) => s.schoolId !== null) ?? schoolContexts[0];
    if (!primarySchool?.schoolId) throw createError('No school context for this parent', 403);

    userId = user.id;
    tokenSchoolId = primarySchool.schoolId;
    tokenRole = Role.PARENT;
  } else {
    // treat identity as Student admission/assessment number
    const students = await prisma.student.findMany({
      where: { admissionNumber: identity.trim() },
      take: 2,
      select: { id: true, schoolId: true, parentId: true },
    });

    if (students.length !== 1 || !students[0].parentId) throw createError('Invalid credentials', 401);

    const parentId = students[0].parentId as string;
    tokenSchoolId = students[0].schoolId as string;

    user = await prisma.user.findFirst({
      where: { id: parentId, role: Role.PARENT, isActive: true },
      select: { id: true, name: true, email: true, passwordHash: true, role: true, phoneNumber: true },
    });

    if (!user) throw createError('Invalid credentials', 401);

    // Ensure parent has a schoolRole for this school.
    const existing = await prisma.schoolRole.findFirst({
      where: { userId: user.id, schoolId: tokenSchoolId, isActive: true },
    });
    if (!existing) {
      await prisma.schoolRole.create({
        data: { userId: user.id, schoolId: tokenSchoolId, role: Role.PARENT, isActive: true },
      });
    }

    userId = user.id;
    tokenRole = Role.PARENT;
  }

  if (!user || !userId || !tokenSchoolId) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401);

  const schoolContexts = await getUserSchools(user.id);
  const accessToken = generateAccessToken({ userId: user.id, schoolId: tokenSchoolId, role: tokenRole });
  const refreshToken = generateRefreshToken({ userId: user.id, schoolId: tokenSchoolId, role: tokenRole });

  await repo.saveRefreshToken(user.id, refreshToken, addDays(new Date(), 30));
  await repo.updateUserById(user.id, { lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: tokenRole,
      isGlobalAdmin: false,
      schools: schoolContexts.map((ctx) => ({
        schoolId: ctx.schoolId,
        schoolName: ctx.school?.name ?? null,
        role: ctx.role,
        permissions: ctx.permissions,
      })),
    },
  };
};

export const forgotPasswordOtp = async (
  userType: 'staff' | 'parent',
  identity: string
) => {
  const normalized = identity.trim();

  let user:
    | (Awaited<ReturnType<typeof repo.findUserByEmail>> & { phoneNumber?: string | null })
    | null = null;

  if (userType === 'staff') {
    if (looksLikeEmail(normalized)) {
      user = await repo.findUserByEmail(normalized.toLowerCase());
    } else if (looksLikePhone(normalized)) {
      user = await repo.findUserByPhoneNumber(normalizePhone(normalized));
    }
    if (!user || user.role === Role.PARENT) throw createError('Identity not found', 404);
  } else {
    // parent
    if (looksLikePhone(normalized)) {
      user = await repo.findUserByPhoneNumber(normalizePhone(normalized));
      if (!user || user.role !== Role.PARENT) throw createError('Identity not found', 404);
    } else {
      // admission/assessment number -> student -> parent
      const students = await prisma.student.findMany({
        where: { admissionNumber: normalized },
        take: 2,
        select: { id: true, parentId: true, schoolId: true },
      });
      if (students.length !== 1 || !students[0].parentId) throw createError('Identity not found', 404);
      const parentId = students[0].parentId as string;
      user = await prisma.user.findFirst({ where: { id: parentId, role: Role.PARENT, isActive: true } });
      if (!user) throw createError('Identity not found', 404);
    }
  }

  if (!user) throw createError('Identity not found', 404);

  const otp = generateOtp6();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await repo.updateUserById(user.id, {
    passwordResetToken: otp,
    passwordResetExpiry: expiry,
  });

  const canSms = process.env.TEXTSMS_ENABLED === 'true' || Boolean(process.env.TEXTSMS_API_URL);

  const smsPhone = user.phoneNumber ? normalizePhone(user.phoneNumber) : null;
  if (canSms && smsPhone) {
    const message = `CBC Platform OTP: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`; 
    await sendSMS(smsPhone, message);
    return;
  }

  if (user.email) {
    const subject = 'Your password reset OTP';
    const template = 'otp-reset-password';
    await sendEmail(user.email, template, { name: user.name, otp, expiresMinutes: OTP_EXPIRY_MINUTES }, subject);
    return;
  }

  throw createError('No phone/email available for OTP delivery', 400);
};

export const verifyOtp = async (userType: 'staff' | 'parent', otp: string) => {
  const user = await repo.findUserByResetToken(otp);
  if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
    throw createError('Invalid or expired OTP', 400);
  }

  if (userType === 'parent') {
    if (user.role !== Role.PARENT) throw createError('Invalid OTP for parent account', 400);
  } else {
    if (user.role === Role.PARENT) throw createError('Invalid OTP for staff account', 400);
  }
};

export const updateMe = async (userId: string, data: { name?: string; phoneNumber?: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);
  return repo.updateUserById(userId, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
  });
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw createError('Current password is incorrect', 400);
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await repo.updateUserById(userId, { passwordHash });
};
