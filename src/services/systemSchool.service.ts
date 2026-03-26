// @ts-nocheck
import { prisma } from '../config/prisma';
import { CurriculumType } from '../config/constants';

const SYSTEM_SCHOOL_NAME = 'CBC Platform System School';

/**
 * Ensures there is a stable school row for platform-level users where
 * `users.schoolId` is required by the current DB schema.
 */
export const ensureSystemSchool = async () => {
  return prisma.school.upsert({
    where: { name: SYSTEM_SCHOOL_NAME },
    create: {
      name: SYSTEM_SCHOOL_NAME,
      county: 'System',
      curriculumType: CurriculumType.BOTH,
      isActive: true,
    },
    update: {},
  });
};

