import Joi from 'joi';
import { Role } from '../../config/constants';

export const createUserSchema = Joi.object({
  name:     Joi.string().required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role:     Joi.string().valid(...Object.values(Role)).required(),
  schoolId: Joi.string().uuid().required(),
});

export const updateUserSchema = Joi.object({
  name:     Joi.string(),
  email:    Joi.string().email(),
  isActive: Joi.boolean(),
}).min(1);
