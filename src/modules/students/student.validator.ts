// @ts-nocheck
import Joi from 'joi';
import { CurriculumType, Gender } from '../../config/constants';

export const createStudentSchema = Joi.object({
  admissionNumber: Joi.string().required(),
  fullName: Joi.string().required(),
  dob: Joi.date().required(),
  gender: Joi.string().valid(...Object.values(Gender)).required(),
  grade: Joi.string().required(),
  curriculumType: Joi.string().valid(...Object.values(CurriculumType)).optional(),
  parentId: Joi.string().uuid().optional(),
  parentName: Joi.string().optional(),
  parentPhone: Joi.string().optional(),
  pathwayId: Joi.string().uuid().optional(),
  termId: Joi.string().uuid().optional(),
  optionalSubjectIds: Joi.array().items(Joi.string().uuid()).optional(),
});

export const updateStudentSchema = createStudentSchema.fork(
  ['admissionNumber', 'fullName', 'dob', 'gender', 'grade', 'curriculumType'],
  (s) => s.optional()
).min(1);

export const transferStudentSchema = Joi.object({
  targetSchoolId: Joi.string().uuid().required(),
  reason: Joi.string().optional(),
});
