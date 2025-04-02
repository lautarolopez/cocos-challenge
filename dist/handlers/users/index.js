import { tryCatch } from '../../utils/promise.js';
import { getPortfolio, postOrder } from '../../controllers/users/index.js';
export const getPortfolioHandler = async (req, res, next) => {
    const id = req.user?.id;
    const { data, error } = await tryCatch(getPortfolio(id));
    if (error) {
        return next(error);
    }
    const { totalAccountValue, availableCash, assets } = data;
    res.json({
        totalAccountValue,
        availableCash,
        assets,
    });
};
export const postOrderHandler = async (req, res, next) => {
    const { data, error } = await tryCatch(postOrder({ ...req.body, user: req.user }));
    if (error) {
        return next(error);
    }
    res.json(data);
};
