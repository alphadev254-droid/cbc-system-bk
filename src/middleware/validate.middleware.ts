import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { error } from '../utils/apiResponse';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: Joi.ObjectSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error: err } = schema.validate(req[target], { abortEarly: false });
    if (err) {
      const messages = err.details.map((d) => d.message);
      error(res, 'Validation failed', 422, messages);
      return;
    }
    next();
  };
