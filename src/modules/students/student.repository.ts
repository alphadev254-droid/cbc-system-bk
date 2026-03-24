import { Student } from '../../models';
import { StudentAttributes } from '../../models/Student.model';
import { paginate } from '../../utils/pagination';

export const findAllStudents = (schoolId: string, page: number, limit: number) =>
  Student.findAndCountAll({ where: { schoolId }, ...paginate(page, limit), order: [['fullName', 'ASC']] });

export const findStudentById = (id: string, schoolId: string) =>
  Student.findOne({ where: { id, schoolId }, include: [{ association: 'parent' }] });

export const findStudentByAdmissionNumber = (admissionNumber: string, schoolId: string) =>
  Student.findOne({ where: { admissionNumber, schoolId } });

export const createStudent = (data: Partial<StudentAttributes>) => Student.create(data as StudentAttributes);

export const updateStudent = (id: string, schoolId: string, data: Partial<StudentAttributes>) =>
  Student.update(data, { where: { id, schoolId }, returning: true });

export const bulkCreateStudents = (records: Partial<StudentAttributes>[]) =>
  Student.bulkCreate(records as StudentAttributes[], { ignoreDuplicates: true });
