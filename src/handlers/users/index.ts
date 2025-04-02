import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types/express.ts';
import type { PostOrderRequest } from '../../schemas/users/index.ts';
import { tryCatch } from '../../utils/promise.js';
import { getPortfolio, postOrder } from '../../controllers/users/index.js';

export const getPortfolioHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?.id;
  const { data, error } = await tryCatch(getPortfolio(id));

  if (error) {
    return next(error);
  }

  const { totalAccountValue, availableCash, assets } = data;

  res.json({
    totalAccountValue,
    availableCash,
    assets,
  });
};

export const postOrderHandler = async (
  req: PostOrderRequest,
  res: Response,
  next: NextFunction,
) => {
  const { data, error } = await tryCatch(
    postOrder({ ...req.body, user: req.user }),
  );

  if (error) {
    return next(error);
  }

  res.json(data);
};
