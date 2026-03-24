import { sequelize } from '../../config/database';
import { Pathway, PathwaySubject, StudentPathway, Subject, Student, Mark } from '../../models';
import { PathwayEnrollmentStatus } from '../../config/constants';
import { StudentSubjectsResult } from '../../types';

// ─── Pathway CRUD ─────────────────────────────────────────────────────────────

export const findAllPathways = (
  schoolId: string,
  filters: { gradeLevel?: string; academicYearId?: string; isActive?: boolean }
) => {
  const where: Record<string, unknown> = { schoolId };
  if (filters.gradeLevel)     where['gradeLevel']     = filters.gradeLevel;
  if (filters.academicYearId) where['academicYearId'] = filters.academicYearId;
  if (filters.isActive !== undefined) where['isActive'] = filters.isActive;

  return Pathway.findAll({
    where,
    include: [{
      model: Subject,
      as: 'subjects',
      through: { attributes: ['isCompulsory'] },
      attributes: ['id', 'name', 'gradeLevel'],
    }],
    order: [['name', 'ASC']],
  });
};

export const findPathwayById = (id: string, schoolId: string) =>
  Pathway.findOne({
    where: { id, schoolId },
    include: [
      {
        model: Subject,
        as: 'subjects',
        through: { attributes: ['isCompulsory'] },
        attributes: ['id', 'name', 'gradeLevel', 'curriculumType'],
      },
      { model: StudentPathway, as: 'studentEnrollments', attributes: ['id', 'status'] },
    ],
  });

export const createPathway = (data: {
  schoolId: string;
  academicYearId: string;
  name: string;
  description?: string;
  gradeLevel: string;
}) => Pathway.create(data);

export const updatePathway = (id: string, schoolId: string, data: Partial<{ name: string; description: string; isActive: boolean }>) =>
  Pathway.update(data, { where: { id, schoolId }, returning: true });

export const softDeletePathway = (id: string, schoolId: string) =>
  Pathway.destroy({ where: { id, schoolId } });

// ─── PathwaySubject ───────────────────────────────────────────────────────────

export const addSubjectsToPathway = (
  pathwayId: string,
  subjects: Array<{ subjectId: string; isCompulsory: boolean }>
) =>
  PathwaySubject.bulkCreate(
    subjects.map((s) => ({ pathwayId, subjectId: s.subjectId, isCompulsory: s.isCompulsory })),
    { ignoreDuplicates: true }
  );

export const removeSubjectFromPathway = (pathwayId: string, subjectId: string) =>
  PathwaySubject.destroy({ where: { pathwayId, subjectId } });

export const findPathwaySubject = (pathwayId: string, subjectId: string) =>
  PathwaySubject.findOne({ where: { pathwayId, subjectId } });

// ─── StudentPathway ───────────────────────────────────────────────────────────

export const enrollStudent = (data: { studentId: string; pathwayId: string; termId: string }) =>
  StudentPathway.create({ ...data, status: PathwayEnrollmentStatus.ACTIVE });

export const bulkEnrollStudents = async (
  studentIds: string[],
  pathwayId: string,
  termId: string
): Promise<number> => {
  const records = studentIds.map((studentId) => ({
    studentId,
    pathwayId,
    termId,
    status: PathwayEnrollmentStatus.ACTIVE,
    enrolledAt: new Date(),
  }));
  const created = await StudentPathway.bulkCreate(records, { ignoreDuplicates: true });
  return created.length;
};

export const getStudentActivePathway = (studentId: string, termId: string) =>
  StudentPathway.findOne({
    where: { studentId, termId, status: PathwayEnrollmentStatus.ACTIVE },
    include: [{
      model: Pathway,
      as: 'pathway',
      include: [{
        model: Subject,
        as: 'subjects',
        through: { attributes: ['isCompulsory'] },
      }],
    }],
  });

export const getStudentSubjects = async (
  studentId: string,
  termId: string,
  schoolId: string
): Promise<StudentSubjectsResult> => {
  const enrollment = await StudentPathway.findOne({
    where: { studentId, termId, status: PathwayEnrollmentStatus.ACTIVE },
    include: [{
      model: Pathway,
      as: 'pathway',
      where: { schoolId },
      include: [{
        model: Subject,
        as: 'subjects',
        through: { attributes: ['isCompulsory'] },
        attributes: ['id', 'name'],
      }],
    }],
  });

  if (!enrollment) {
    return { pathwayId: null, pathwayName: null, subjects: [] };
  }

  const pathway = (enrollment as unknown as { pathway: { id: string; name: string; subjects: Array<{ id: string; name: string; PathwaySubject: { isCompulsory: boolean } }> } }).pathway;

  return {
    pathwayId:   pathway.id,
    pathwayName: pathway.name,
    subjects: pathway.subjects.map((s) => ({
      id:           s.id,
      name:         s.name,
      isCompulsory: s.PathwaySubject.isCompulsory,
    })),
  };
};

export const getStudentsInPathway = (pathwayId: string, termId: string) =>
  StudentPathway.findAll({
    where: { pathwayId, termId, status: PathwayEnrollmentStatus.ACTIVE },
    include: [{ model: Student, as: undefined, attributes: ['id', 'fullName', 'admissionNumber', 'grade'] }],
  });

export const countActiveEnrollments = (pathwayId: string): Promise<number> =>
  StudentPathway.count({ where: { pathwayId, status: PathwayEnrollmentStatus.ACTIVE } });

export const findStudentEnrollmentForTerm = (studentId: string, termId: string) =>
  StudentPathway.findOne({ where: { studentId, termId, status: PathwayEnrollmentStatus.ACTIVE } });

export const transferStudent = async (
  studentId: string,
  currentTermId: string,
  toPathwayId: string,
  toTermId: string
): Promise<void> => {
  await sequelize.transaction(async (t) => {
    // Mark current enrollment as TRANSFERRED
    await StudentPathway.update(
      { status: PathwayEnrollmentStatus.TRANSFERRED },
      { where: { studentId, termId: currentTermId, status: PathwayEnrollmentStatus.ACTIVE }, transaction: t }
    );
    // Create new enrollment
    await StudentPathway.create(
      { studentId, pathwayId: toPathwayId, termId: toTermId, status: PathwayEnrollmentStatus.ACTIVE },
      { transaction: t }
    );
  });
};

// Used by exam service to check if subject has marks before removal
export const findMarksForSubjectInPathway = (pathwayId: string, subjectId: string) =>
  Mark.findOne({
    include: [{
      model: StudentPathway,
      as: undefined,
      where: { pathwayId, status: PathwayEnrollmentStatus.ACTIVE },
      attributes: [],
      required: true,
    }],
    where: { subjectId },
  });
