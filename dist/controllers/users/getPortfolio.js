import { prisma } from '../../config/prisma.js';
import { OrderSide, OrderStatus } from '../../constants/orders.js';
import { HttpError } from '../../models/error/index.js';
const DEFAULT_POSITION = {
    quantity: 0,
    netCost: 0,
    buyAmount: 0,
    sellAmount: 0,
};
export const getPortfolio = async (id) => {
    if (!id)
        throw new HttpError('User ID is required', 400);
    const userid = Number(id);
    const filledOrders = await prisma.orders.findMany({
        where: {
            userid,
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
    const ARS_INSTRUMENT = await prisma.instruments.findFirst({
        where: {
            ticker: 'ARS',
        },
        include: {
            marketdata: {
                orderBy: { date: 'desc' },
                take: 1, // only the latest market data
            },
        },
    });
    const ARS_PRICE = Number(ARS_INSTRUMENT?.marketdata[0]?.close ?? 1);
    let cashIn = 0;
    let cashOut = 0;
    let tradeCashFlow = 0;
    const positions = {};
    for (const order of filledOrders) {
        if (!order.size)
            continue;
        switch (order.side) {
            case OrderSide.CASH_IN: {
                cashIn += order.size * Number(order.price);
                break;
            }
            case OrderSide.CASH_OUT: {
                cashOut += order.size * Number(order.price);
                break;
            }
            case OrderSide.BUY: {
                if (!order.instruments)
                    break;
                const instrumentId = order.instruments.id;
                if (!positions[instrumentId]) {
                    positions[instrumentId] = {
                        ...DEFAULT_POSITION,
                        instrument: order.instruments,
                    };
                }
                positions[instrumentId].quantity += order.size;
                positions[instrumentId].netCost += order.size * Number(order.price);
                positions[instrumentId].buyAmount += order.size * Number(order.price);
                tradeCashFlow -= order.size * Number(order.price);
                break;
            }
            case OrderSide.SELL: {
                if (!order.instruments)
                    break;
                const instrumentId = order.instruments.id;
                if (!positions[instrumentId]) {
                    positions[instrumentId] = {
                        ...DEFAULT_POSITION,
                        instrument: order.instruments,
                    };
                }
                positions[instrumentId].quantity -= order.size;
                positions[instrumentId].netCost -= order.size * Number(order.price);
                positions[instrumentId].sellAmount += order.size * Number(order.price);
                tradeCashFlow += order.size * Number(order.price);
                break;
            }
        }
    }
    const availableCash = cashIn - cashOut + tradeCashFlow;
    const assets = Object.values(positions)
        .map((pos) => {
        const instrument = pos.instrument;
        if (!instrument.marketdata || instrument.marketdata.length === 0)
            return null;
        const latestMarketData = instrument.marketdata[0];
        const currentPrice = Number(latestMarketData?.close);
        const positionValue = pos.quantity * currentPrice;
        let averageCost = 0;
        let yieldPercentage = 0;
        if (pos.quantity > 0) {
            averageCost = pos.netCost / pos.quantity;
            yieldPercentage = ((currentPrice - averageCost) / averageCost) * 100;
        }
        else if (pos.quantity < 0) {
            const avgSellPrice = pos.sellAmount / Math.abs(pos.quantity);
            averageCost = avgSellPrice;
            yieldPercentage = ((averageCost - currentPrice) / averageCost) * 100;
        }
        return {
            instrumentid: instrument.id,
            ticker: instrument.ticker,
            name: instrument.name,
            quantity: pos.quantity,
            positionValue,
            yield: yieldPercentage,
        };
    })
        .filter((asset) => asset !== null);
    const totalPositionsValue = assets.reduce((sum, asset) => sum + asset.positionValue, 0) * ARS_PRICE;
    const totalAccountValue = (availableCash + totalPositionsValue) * ARS_PRICE;
    return {
        totalAccountValue,
        availableCash,
        assets,
    };
};
