export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            params: req.params,
            body: req.body,
            query: req.query,
        });
        next();
    }
    catch (e) {
        res.status(400).send(e.errors);
    }
};
