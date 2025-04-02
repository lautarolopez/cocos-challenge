import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        params: req.params,
        body: req.body,
        query: req.query,
      });
      next();
    } catch (e) {
      res.status(400).send((e as ZodError).errors);
    }
  };
