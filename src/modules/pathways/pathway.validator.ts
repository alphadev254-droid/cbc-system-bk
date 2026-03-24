import Joi from 'joi';

export const createPathwaySchema = Joi.object({
  name:            Joi.string().required(),
  description:     Joi.string().optional(),
  gradeLevel:      Joi.string().valid('Grade 7', 'Grade 8', 'Grade 9').required(),
  academicYearId:  Joi.string().uuid().required(),
  subjectIds:      Joi.array().items(Joi.string().uuid()).min(1).required(),
  isCompulsoryMap: Joi.object().pattern(Joi.string().uuid(), Joi.boolean()).optional(),
});

export const updatePathwaySchema = Joi.object({
  name:        Joi.string().optional(),
  description: Joi.string().optional(),
  isActive:    Joi.boolean().optional(),
}).min(1);

export const addSubjectsSchema = Joi.object({
  subjectIds:   Joi.array().items(Joi.string().uuid()).min(1).required(),
  isCompulsory: Joi.boolean().optional().default(true),
});

export const enrollStudentSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  termId:    Joi.string().uuid().required(),
});

export const bulkEnrollSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  termId:     Joi.string().uuid().required(),
});

export const transferStudentSchema = Joi.object({
  toPathwayId: Joi.string().uuid().required(),
  toTermId:    Joi.string().uuid().required(),
});
