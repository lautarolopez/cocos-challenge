import { Router } from 'express';
import { validate } from '../middleware/validation.js';
import { postOrderSchema } from '../schemas/users/index.js';
import { getPortfolioHandler, postOrderHandler, } from '../handlers/users/index.js';
import { authenticate } from '../middleware/authentication.js';
const router = Router();
router.get('/portfolio', authenticate, getPortfolioHandler);
router.post('/orders', authenticate, validate(postOrderSchema), postOrderHandler);
export default router;
