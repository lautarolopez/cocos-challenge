import { tryCatch } from '../../utils/promise.js';
import { getInstruments } from '../../controllers/instruments/index.js';
export const getInstrumentsHandler = async (req, res, next) => {
    const query = req.query.q;
    const { data, error } = await tryCatch(getInstruments(query));
    if (error) {
        return next(error);
    }
    const instruments = data;
    res.json(instruments);
};
