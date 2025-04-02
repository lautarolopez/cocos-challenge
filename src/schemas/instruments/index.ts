import type { Request } from 'express';
import { z } from 'zod';

export const getInstrumentsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
  }),
});

export type GetInstrumentsRequest = Request<
  unknown,
  unknown,
  unknown,
  z.infer<typeof getInstrumentsSchema>['query']
>;
