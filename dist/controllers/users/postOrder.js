import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../models/error/index.js';
import { OrderSide, OrderStatus, OrderType } from '../../constants/orders.js';
export const postOrder = async ({ user, instrumentId, size, totalAmount, type, side, price, }) => {
    const instrument = await prisma.instruments.findUnique({
        where: { id: instrumentId },
    });
    if (!instrument) {
        throw new HttpError('Instrumento no encontrado', 404);
    }
    const effectivePrice = await getEffectivePrice(type, instrumentId, price);
    const finalOrderSize = !size && totalAmount
        ? Math.floor(Number(totalAmount) / effectivePrice)
        : (size ?? 0);
    if (finalOrderSize < 1) {
        throw new HttpError('El monto total es insuficiente para adquirir al menos 1 acción', 400);
    }
    const orderCreationStatus = await getOrderCreationStatus({
        instrumentId,
        side: side,
        userId: Number(user?.id),
        effectivePrice,
        finalOrderSize,
        type,
    });
    // Crear la orden en la tabla orders
    const newOrder = await prisma.orders.create({
        data: {
            instrumentid: instrumentId,
            userid: Number(user?.id),
            size: finalOrderSize,
            price: effectivePrice,
            type,
            side,
            status: orderCreationStatus,
            datetime: new Date(),
        },
    });
    return newOrder;
};
const getEffectivePrice = async (type, instrumentId, price) => {
    if (type === OrderType.LIMIT && price)
        return price;
    const latestMarketdata = await prisma.marketdata.findFirst({
        where: { instrumentid: instrumentId },
        orderBy: { date: 'desc' },
    });
    if (!latestMarketdata || !latestMarketdata.close) {
        throw new HttpError('No hay datos de mercado para este instrumento', 400);
    }
    return Number(latestMarketdata.close);
};
const getOrderCreationStatus = async ({ instrumentId, side, userId, effectivePrice, finalOrderSize, type, }) => {
    switch (side) {
        case OrderSide.CASH_IN: {
            // We're assumig that CASH IN and CASH OUT are executed immediately
            // We're assuming that CASH IN doesn't have any restriction
            return OrderStatus.FILLED;
        }
        case OrderSide.CASH_OUT: {
            const sufficientFunds = await checkAgainstCash(userId, effectivePrice * finalOrderSize);
            if (!sufficientFunds) {
                return OrderStatus.REJECTED;
            }
            return OrderStatus.FILLED;
        }
        case OrderSide.BUY: {
            const sufficientFunds = await checkAgainstCash(userId, effectivePrice * finalOrderSize);
            if (!sufficientFunds) {
                return OrderStatus.REJECTED;
            }
            return type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.NEW;
        }
        case OrderSide.SELL: {
            const sufficientShares = await checkAgainstShares(userId, instrumentId, finalOrderSize);
            if (!sufficientShares) {
                return OrderStatus.REJECTED;
            }
            return type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.NEW;
        }
    }
};
const checkAgainstCash = async (userId, cost) => {
    const filledOrders = await prisma.orders.findMany({
        where: {
            userid: userId,
            status: OrderStatus.FILLED,
        },
        include: {
            instruments: {
                include: {
                    marketdata: {
                        orderBy: { date: 'desc' },
                        take: 1, // only the latest market data
                    },
                },
            },
        },
    });
    const totalCash = filledOrders.reduce((acc, order) => {
        const orderValue = Number(order.price ?? 0) * Number(order.size ?? 0);
        if (order.side === OrderSide.CASH_IN || order.side === OrderSide.BUY) {
            return acc + orderValue;
        }
        if (order.side === OrderSide.CASH_OUT || order.side === OrderSide.SELL) {
            return acc - orderValue;
        }
        return acc;
    }, 0);
    return totalCash >= cost;
};
const checkAgainstShares = async (userId, instrumentId, size) => {
    const filledOrders = await prisma.orders.findMany({
        where: {
            userid: userId,
            instrumentid: instrumentId,
            status: OrderStatus.FILLED,
        },
    });
    const totalShares = filledOrders.reduce((acc, order) => {
        if (order.side === OrderSide.SELL) {
            return acc - (order.size ?? 0);
        }
        return acc + (order.size ?? 0);
    }, 0);
    return totalShares >= size;
};
