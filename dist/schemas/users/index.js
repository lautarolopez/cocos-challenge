import { z } from 'zod';
import { OrderType, OrderSide } from '../../constants/orders.js';
const commonOrderSchema = {
    instrumentId: z.number(),
    size: z.number().min(1).optional(),
    totalAmount: z.number().min(1).optional(),
    side: z.enum(Object.values(OrderSide)),
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
