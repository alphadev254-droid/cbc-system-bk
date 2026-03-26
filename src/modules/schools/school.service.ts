// @ts-nocheck
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, Role } from '../../config/constants';
import { createError } from '../../middleware/errorHandler.middleware';
import { buildPaginationResult } from '../../utils/pagination';
import { logAction } from '../../services/audit.service';
import { prisma } from '../../config/prisma';
import * as repo from './school.repository';
import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { sendSchoolAdminCredentialsSms } from '../../services/sms.service';
import logger from '../../config/logger';

export type CreateSchoolWithAdminInput = {
  name: string;
  county: string;
  /** Accepts Prisma enum or legacy `844` from clients */
  curriculumType: string;
  logo?: string | null;
  contactPersonName: string;
  contactPhone: string;
  contactEmail: string;
};

function normalizeCurriculumType(raw: string): Prisma.SchoolCreateInput['curriculumType'] {
  if (raw === '844') return 'EIGHT_FOUR_FOUR';
  if (raw === 'CBC' || raw === 'EIGHT_FOUR_FOUR' || raw === 'BOTH') return raw;
  throw createError('Invalid curriculum type', 400);
}

function generateTempPassword(): string {
  const raw = randomBytes(12).toString('base64url');
  return `${raw}Aa1`;
}

export const createSchool = async (
  data: CreateSchoolWithAdminInput,
  creatorUserId: string,
  req: Request
) => {
  const existing = await repo.findSchoolByName(data.name);
  if (existing) throw createError('School with this name already exists', 409);

  const existingEmail = await prisma.user.findFirst({ where: { email: data.contactEmail } });
  if (existingEmail) throw createError('Contact email is already registered', 409);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  const { school } = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: data.name,
        county: data.county,
        curriculumType: normalizeCurriculumType(data.curriculumType),
        logo: data.logo ?? undefined,
        contactPersonName: data.contactPersonName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
      },
    });

    const admin = await tx.user.create({
      data: {
        name: data.contactPersonName,
        email: data.contactEmail,
        phoneNumber: data.contactPhone,
        passwordHash,
        role: Role.HEAD_TEACHER,
        schoolId: school.id,
        isActive: true,
        twoFactorEnabled: false,
      },
    });

    await tx.schoolRole.create({
      data: {
        userId: admin.id,
        schoolId: school.id,
        role: Role.HEAD_TEACHER,
        isActive: true,
      },
    });

    return { school };
  });

  await logAction(
    creatorUserId,
    school.id,
    'CREATE',
    'School',
    school.id,
    undefined,
    school as unknown as Record<string, unknown>,
    req
  );

  let smsSent = false;
  try {
    const loginUrl = process.env.APP_LOGIN_URL ?? 'http://localhost:5173/login';
    const result = await sendSchoolAdminCredentialsSms(data.contactPhone, {
      schoolName: school.name,
      adminEmail: data.contactEmail,
      tempPassword,
      loginUrl,
    });
    smsSent = !result.skipped;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`[School] SMS send failed (school and admin user were still created): ${msg}`);
  }

  if (smsSent) {
    await prisma.school.update({
      where: { id: school.id },
      data: { credentialsSentAt: new Date() },
    });
  }

  return {
    school,
    onboarding: {
      adminEmail: data.contactEmail,
      smsSent,
    },
  };
};

export const resendSchoolAdminCredentials = async (
  schoolId: string,
  actorUserId: string,
  req: Request
) => {
  const school = await repo.findSchoolById(schoolId);
  if (!school) throw createError('School not found', 404);

  if (!school.contactPhone || !school.contactEmail) {
    throw createError('School contact phone/email is missing', 400);
  }

  const headUser = await prisma.user.findFirst({
    where: { schoolId, email: school.contactEmail },
    select: { id: true },
  });
  if (!headUser) throw createError('School admin account not found', 404);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: headUser.id }, data: { passwordHash } });

  let smsSent = false;
  try {
    const loginUrl = process.env.APP_LOGIN_URL ?? 'http://localhost:5173/login';
    const result = await sendSchoolAdminCredentialsSms(school.contactPhone, {
      schoolName: school.name,
      adminEmail: school.contactEmail,
      tempPassword,
      loginUrl,
    });
    smsSent = !result.skipped;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`[School] Resend credentials SMS failed: ${msg}`);
  }

  await prisma.school.update({
    where: { id: school.id },
    data: {
      credentialsResendCount: { increment: 1 },
      credentialsSentAt: smsSent ? new Date() : undefined,
    },
  });

  await logAction(
    actorUserId,
    school.id,
    'UPDATE',
    'SchoolCredentials',
    school.id,
    undefined,
    { smsSent },
    req
  );

  return {
    schoolId: school.id,
    smsSent,
    credentialsSentAt: smsSent ? new Date().toISOString() : null,
  };
};

export const getSchools = async (page = 1, limit = 10) => {
  const [rows, count] = await repo.findAllSchools(page, limit);
  return buildPaginationResult(rows, count, page, limit);
};

export const getSchool = async (id: string) => {
  const school = await repo.findSchoolById(id);
  if (!school) throw createError('School not found', 404);
  return school;
};

export const getGradingCriteria = async (schoolId: string) => {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { gradingCriteria: true } });
  if (!school) throw createError('School not found', 404);
  return (school.gradingCriteria as unknown[]) ?? [];
};

export const saveGradingCriteria = async (schoolId: string, criteria: unknown[]) => {
  return prisma.school.update({ where: { id: schoolId }, data: { gradingCriteria: criteria } });
};

export const getSchoolDashboard = async (schoolId: string) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      county: true,
      curriculumType: true,
      isActive: true,
      contactPersonName: true,
      contactPhone: true,
      contactEmail: true,
      credentialsSentAt: true,
      credentialsResendCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!school) throw createError('School not found', 404);

  const subscriptions = await prisma.subscription.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
    take: 10,
    include: { tier: true },
  });

  const invoices = await prisma.feeRecord.findMany({
    where: { student: { schoolId } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      feeType: true,
      term: true,
      student: { select: { id: true, admissionNumber: true, fullName: true } },
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, method: true, paidAt: true, reference: true },
      },
    },
  });

  const payments = await prisma.payment.findMany({
    where: { student: { schoolId } },
    orderBy: { paidAt: 'desc' },
    take: 10,
    include: {
      student: { select: { id: true, admissionNumber: true, fullName: true } },
      feeRecord: {
        select: {
          id: true,
          dueDate: true,
          status: true,
          amount: true,
          feeType: { select: { id: true, name: true } },
        },
      },
    },
  });

  return { school, subscriptions, invoices, payments };
};

export const updateSchool = async (
  id: string,
  data: Prisma.SchoolUpdateInput,
  userId: string,
  req: Request
) => {
  const school = await getSchool(id);
  const updated = await repo.updateSchool(id, data);
  await logAction(
    userId,
    id,
    'UPDATE',
    'School',
    id,
    school as unknown as Record<string, unknown>,
    data as unknown as Record<string, unknown>,
    req
  );
  return updated;
};

export const deleteSchool = async (id: string, userId: string, req: Request) => {
  await getSchool(id);
  await prisma.$transaction([
    prisma.teacherSubject.deleteMany({ where: { schoolId: id } }),
    prisma.schoolClass.deleteMany({ where: { schoolId: id } }),
    prisma.studentPathway.deleteMany({ where: { pathway: { schoolId: id } } }),
    prisma.pathwaySubject.deleteMany({ where: { pathway: { schoolId: id } } }),
    prisma.pathway.deleteMany({ where: { schoolId: id } }),
    prisma.mark.deleteMany({ where: { subject: { schoolId: id } } }),
    prisma.payment.deleteMany({ where: { student: { schoolId: id } } }),
    prisma.feeRecord.deleteMany({ where: { student: { schoolId: id } } }),
    prisma.feeType.deleteMany({ where: { schoolId: id } }),
    prisma.examType.deleteMany({ where: { schoolId: id } }),
    prisma.term.deleteMany({ where: { academicYear: { schoolId: id } } }),
    prisma.academicYear.deleteMany({ where: { schoolId: id } }),
    prisma.notification.deleteMany({ where: { schoolId: id } }),
    prisma.subject.deleteMany({ where: { schoolId: id } }),
    prisma.student.deleteMany({ where: { schoolId: id } }),
    prisma.schoolRole.deleteMany({ where: { schoolId: id } }),
    prisma.subscription.deleteMany({ where: { schoolId: id } }),
    prisma.auditLog.deleteMany({ where: { schoolId: id } }),
    prisma.user.updateMany({ where: { schoolId: id }, data: { schoolId: null } }),
  ]);
  await repo.deleteSchool(id);
  await logAction(userId, '', 'DELETE', 'School', id, undefined, undefined, req).catch(() => {});
};
