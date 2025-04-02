import { STATUS_CODES } from 'http';
export const errorHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    const statusCode = err.httpStatusCode ?? 500;
    res.status(statusCode).json({
        status: STATUS_CODES[statusCode],
        message: err.message,
    });
};
