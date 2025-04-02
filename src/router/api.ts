import { Router } from 'express';
import usersRouter from '../router/users.js';
import instrumentsRouter from '../router/instruments.js';

const router = Router();

router.use('/users', usersRouter);

router.use('/instruments', instrumentsRouter);

export default router;
