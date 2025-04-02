import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/express.js';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../models/error/index.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      throw new HttpError(
        'No se ha proporcionado un token de autenticación',
        401,
      );
    }

    // Verify the auth token, cookie or session. For this example we'll assume the token is a user ID.
    const user = await prisma.users.findUnique({
      where: { id: Number(token) },
    });

    if (!user)
      throw new HttpError(
        'No se ha podido verificar el token de autenticación',
        401,
      );

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
