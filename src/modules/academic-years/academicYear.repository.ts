import { AcademicYear, Term } from '../../models';

export const findAllAcademicYears = (schoolId: string) =>
  AcademicYear.findAll({
    where: { schoolId },
    include: [{ association: 'terms' }],
    order: [['year', 'DESC']],
  });

export const findAcademicYearById = (id: string, schoolId: string) =>
  AcademicYear.findOne({
    where: { id, schoolId },
    include: [{ association: 'terms' }],
  });

export const createAcademicYear = (schoolId: string, year: string) =>
  AcademicYear.create({ schoolId, year });

export const setAcademicYearActive = async (id: string, schoolId: string) => {
  await AcademicYear.update({ isActive: false }, { where: { schoolId } });
  return AcademicYear.update({ isActive: true }, { where: { id, schoolId } });
};

export const createTerm = (data: {
  academicYearId: string;
  schoolId: string;
  termNumber: 1 | 2 | 3;
  startDate: Date;
  endDate: Date;
}) => Term.create(data);

export const findTermById = (id: string, schoolId: string) =>
  Term.findOne({ where: { id, schoolId } });

export const setTermActive = async (id: string, schoolId: string) => {
  await Term.update({ isActive: false }, { where: { schoolId } });
  return Term.update({ isActive: true }, { where: { id, schoolId } });
};
