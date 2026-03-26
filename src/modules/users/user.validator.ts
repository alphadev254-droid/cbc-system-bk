// @ts-nocheck
import Joi from 'joi';
import { Role } from '../../config/constants';

export const createUserSchema = Joi.object({
  name:           Joi.string().required(),
  email:          Joi.string().email().required(),
  password:       Joi.string().min(8).required(),
  phoneNumber:    Joi.string().optional(),
  employeeNumber: Joi.string().optional(),
  role:           Joi.string().valid(...Object.values(Role)).required(),
  schoolId:       Joi.string().uuid().optional(),
});

export const updateUserSchema = Joi.object({
  name:           Joi.string(),
  email:          Joi.string().email(),
  phoneNumber:    Joi.string().optional().allow(''),
  employeeNumber: Joi.string().optional().allow(''),
  isActive:       Joi.boolean(),
}).min(1);
