import Joi from 'joi';

export const createSchoolClassSchema = Joi.object({
  name: Joi.string().required(),
  gradeLevel: Joi.string().required(),
  academicYearId: Joi.string().uuid().allow(null),
  pathwayId: Joi.string().uuid().allow(null),
  classTeacherId: Joi.string().uuid().allow(null),
});

export const updateSchoolClassSchema = Joi.object({
  name: Joi.string(),
  gradeLevel: Joi.string(),
  academicYearId: Joi.string().uuid().allow(null),
  pathwayId: Joi.string().uuid().allow(null),
  classTeacherId: Joi.string().uuid().allow(null),
}).min(1);
