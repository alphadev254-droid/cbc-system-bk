import Joi from 'joi';

export const createPathwaySchema = Joi.object({
  name:            Joi.string().required(),
  description:     Joi.string().optional(),
  subjectIds:      Joi.array().items(Joi.string().uuid()).min(0).default([]),
  isCompulsoryMap: Joi.object().pattern(Joi.string().uuid(), Joi.boolean()).optional(),
});

export const updatePathwaySchema = Joi.object({
  name:        Joi.string().optional(),
  description: Joi.string().optional(),
  isActive:    Joi.boolean().optional(),
}).min(1);

export const addSubjectsSchema = Joi.object({
  subjects: Joi.array().items(
    Joi.object({
      subjectId:   Joi.string().uuid().required(),
      isCompulsory: Joi.boolean().default(true),
    })
  ).min(1).required(),
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
