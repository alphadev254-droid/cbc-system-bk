// @ts-nocheck
import Joi from 'joi';
import { Role } from '../../config/constants';

export const assignMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  role:   Joi.string().valid(...Object.values(Role)).required(),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(Role)).required(),
});
