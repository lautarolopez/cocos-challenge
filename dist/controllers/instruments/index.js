import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../models/error/index.js';
export const getInstruments = async (query) => {
    if (query && typeof query !== 'string')
        throw new HttpError('Tried to search with an invalid query. Use a string instad.', 400);
    const whereClause = query
        ? {
            where: {
                OR: [
                    { ticker: { contains: query, mode: Prisma.QueryMode.insensitive } },
                    { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                ],
            },
        }
        : undefined;
    const instruments = await prisma.instruments.findMany(whereClause);
    return instruments;
};
