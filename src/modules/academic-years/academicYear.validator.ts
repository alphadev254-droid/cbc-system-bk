// @ts-nocheck
import Joi from 'joi';

export const createYearSchema = Joi.object({
  year: Joi.string().pattern(/^\d{4}([\-\/]\d{4})?$/).required(),
});

export const createTermSchema = Joi.object({
  academicYearId: Joi.string().uuid().required(),
  termNumber: Joi.number().valid(1, 2, 3).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
});

export const setActiveTermSchema = Joi.object({
  termId: Joi.string().uuid().required(),
});
