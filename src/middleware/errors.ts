import type { NextFunction, Request, Response } from 'express';
import type { HttpError } from '../models/error/index.js';
import { STATUS_CODES } from 'http';

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err.stack);
  const statusCode = err.httpStatusCode ?? 500;
  res.status(statusCode).json({
    status: STATUS_CODES[statusCode],
    message: err.message,
  });
};
