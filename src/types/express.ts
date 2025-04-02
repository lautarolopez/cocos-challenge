import type { Request } from 'express';
import type { users as User } from '@prisma/client';

export type AuthenticatedRequest<T = unknown, U = unknown, V = unknown> = {
  user?: User;
} & Request<T, U, V>;
