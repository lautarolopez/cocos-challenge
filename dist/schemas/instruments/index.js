import { z } from 'zod';
export const getInstrumentsSchema = z.object({
    query: z.object({
        q: z.string().optional(),
    }),
});
