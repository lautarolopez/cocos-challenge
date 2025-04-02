import { prisma } from '../../../src/config/prisma.ts';
import {
  OrderType,
  OrderSide,
  OrderStatus,
} from '../../../src/constants/orders.ts';
import { HttpError } from '../../../src/models/error/index.ts';
import { postOrder } from '../../../src/controllers/users/postOrder.ts';

jest.mock('../../../src/config/prisma', () => {
  return {
    prisma: {
      instruments: {
        findUnique: jest.fn(),
      },
      marketdata: {
        findFirst: jest.fn(),
      },
      orders: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };
});

describe('Users Controller - postOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw error if instrument is not found', async () => {
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(null);

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: 1,
      size: 10,
      totalAmount: undefined,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      price: undefined,
    };

    await expect(postOrder(payload)).rejects.toThrow(HttpError);
    expect(prisma.instruments.findUnique).toHaveBeenCalledWith({
      where: { id: payload.instrumentId },
    });
  });

  test('should create a MARKET order successfully using provided size', async () => {
    const instrument = {
      id: 2,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.marketdata.findFirst as jest.Mock).mockResolvedValue({
      close: 105,
    });
    (prisma.orders.create as jest.Mock).mockResolvedValue({
      id: 10,
      instrumentid: instrument.id,
      userid: 1,
      size: 10,
      price: 105,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      status: OrderStatus.FILLED,
      datetime: new Date(),
    });
    (prisma.orders.findMany as jest.Mock).mockResolvedValue([
      { price: 2000, size: 1, side: OrderSide.CASH_IN },
    ]);

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: 10,
      totalAmount: undefined,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      price: undefined,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: payload.size,
        price: 105,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.FILLED,
        datetime: expect.any(Date),
      },
    });
  });

  test('should create a MARKET order successfully using totalAmount to calculate size', async () => {
    const instrument = {
      id: 3,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.marketdata.findFirst as jest.Mock).mockResolvedValue({
      close: 105,
    });
    (prisma.orders.create as jest.Mock).mockImplementation((data) => {
      return Promise.resolve({
        id: 11,
        instrumentid: data.instrumentid,
        userid: data.userid,
        size: data.size,
        price: data.price,
        type: data.type,
        side: data.side,
        status:
          data.type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.NEW,
        datetime: new Date(),
      });
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: undefined,
      totalAmount: 1050,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      price: undefined,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: 10,
        price: 105,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.FILLED,
        datetime: expect.any(Date),
      },
    });
  });

  test('should reject a MARKET order if computed size is zero', async () => {
    const instrument = {
      id: 4,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.marketdata.findFirst as jest.Mock).mockResolvedValue({
      close: 105,
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: undefined,
      totalAmount: 50,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      price: undefined,
    };

    await expect(postOrder(payload)).rejects.toThrow(HttpError);
  });

  test('should create a LIMIT order successfully using provided size', async () => {
    const instrument = {
      id: 5,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.orders.findMany as jest.Mock).mockResolvedValue([
      { price: 2000, size: 1, side: OrderSide.CASH_IN },
    ]);
    (prisma.orders.create as jest.Mock).mockResolvedValue({
      id: 12,
      instrumentid: instrument.id,
      userid: 1,
      size: 10,
      price: 100,
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      status: OrderStatus.NEW,
      datetime: new Date(),
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: 10,
      totalAmount: undefined,
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      price: 100,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: payload.size,
        price: payload.price,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.NEW,
        datetime: expect.any(Date),
      },
    });
  });

  test('should create a LIMIT order successfully using totalAmount to calculate size', async () => {
    const instrument = {
      id: 6,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.orders.findMany as jest.Mock).mockResolvedValue([
      { price: 2000, size: 1, side: OrderSide.CASH_IN },
    ]);
    (prisma.orders.create as jest.Mock).mockImplementation((data) => {
      return Promise.resolve({
        id: 13,
        instrumentid: data.instrumentid,
        userid: data.userid,
        size: data.size,
        price: data.price,
        type: data.type,
        side: data.side,
        status:
          data.type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.NEW,
        datetime: new Date(),
      });
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: undefined,
      totalAmount: 1050,
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      price: 105,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: 10,
        price: payload.price,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.NEW,
        datetime: expect.any(Date),
      },
    });
  });

  test('should reject a BUY order if insufficient balance (unsufficient balance test)', async () => {
    const instrument = {
      id: 7,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.marketdata.findFirst as jest.Mock).mockResolvedValue({
      close: 105,
    });
    (prisma.orders.findMany as jest.Mock).mockResolvedValue([
      { price: 2000, size: 1, side: OrderSide.CASH_IN },
    ]);
    (prisma.orders.create as jest.Mock).mockResolvedValue({
      id: 14,
      instrumentid: instrument.id,
      userid: 1,
      size: 10,
      price: 105,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      status: OrderStatus.REJECTED,
      datetime: new Date(),
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: 100,
      totalAmount: undefined,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      price: undefined,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: payload.size,
        price: 105,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.REJECTED,
        datetime: expect.any(Date),
      },
    });
  });

  test('should reject a SELL order if insufficient shares (unsufficient shares test)', async () => {
    const instrument = {
      id: 8,
      ticker: 'TEST',
      name: 'Test Instrument',
      type: 'ACCIONES',
    };
    (prisma.instruments.findUnique as jest.Mock).mockResolvedValue(instrument);
    (prisma.marketdata.findFirst as jest.Mock).mockResolvedValue({
      close: 105,
    });
    (prisma.orders.findMany as jest.Mock).mockResolvedValue([
      { size: 10, side: OrderSide.BUY },
    ]);

    (prisma.orders.create as jest.Mock).mockResolvedValue({
      id: 15,
      instrumentid: instrument.id,
      userid: 1,
      size: 15,
      price: 105,
      type: OrderType.MARKET,
      side: OrderSide.SELL,
      status: OrderStatus.REJECTED,
      datetime: new Date(),
    });

    const payload = {
      user: { id: 1, email: 'test@test.test', accountnumber: '123456789' },
      instrumentId: instrument.id,
      size: 15,
      totalAmount: undefined,
      type: OrderType.MARKET,
      side: OrderSide.SELL,
      price: undefined,
    };

    await postOrder(payload);

    expect(prisma.orders.create).toHaveBeenCalledWith({
      data: {
        instrumentid: instrument.id,
        userid: payload.user.id,
        size: payload.size,
        price: 105,
        type: payload.type,
        side: payload.side,
        status: OrderStatus.REJECTED,
        datetime: expect.any(Date),
      },
    });
  });
});
