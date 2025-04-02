import { Router } from 'express';
import { validate } from '../middleware/validation.js';
import { getInstrumentsSchema } from '../schemas/instruments/index.js';
import { getInstrumentsHandler } from '../handlers/instruments/index.js';

const router = Router();

router.get('/', validate(getInstrumentsSchema), getInstrumentsHandler);

export default router;
