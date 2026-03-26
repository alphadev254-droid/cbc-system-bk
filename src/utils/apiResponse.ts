import { Response } from 'express';

export const success = (res: Response, data: unknown, message = 'Success', status = 200): Response => {
  return res.status(status).json({ success: true, message, data });
};

export const error = (res: Response, message = 'An error occurred', status = 500, errors?: unknown): Response => {
  return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
