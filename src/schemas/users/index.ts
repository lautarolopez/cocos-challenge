import type { AuthenticatedRequest } from '../../types/express.js';
import type { users as User } from '@prisma/client';
import { z } from 'zod';
import { OrderType, OrderSide } from '../../constants/orders.js';

const commonOrderSchema = {
  instrumentId: z.number(),
  size: z.number().min(1).optional(),
  totalAmount: z.number().min(1).optional(),
  side: z.enum(Object.values(OrderSide) as [string, ...string[]]),
};

export const postOrderSchema = z.object({
  body: z
    .discriminatedUnion('type', [
      z.object({
        ...commonOrderSchema,
        type: z.literal(OrderType.MARKET),
        price: z.undefined().optional(),
      }),
      z.object({
        ...commonOrderSchema,
        type: z.literal(OrderType.LIMIT),
        price: z.number(),
      }),
    ])
    .refine((data) => {
      const sizeProvided = data.size !== undefined;
      const totalAmountProvided = data.totalAmount !== undefined;
      return sizeProvided !== totalAmountProvided;
    }),
});

export type PostOrderRequest = AuthenticatedRequest<
  unknown,
  unknown,
  z.infer<typeof postOrderSchema>['body']
>;

export type PostOrderPayload = z.infer<typeof postOrderSchema>['body'] & {
  user?: User;
};
