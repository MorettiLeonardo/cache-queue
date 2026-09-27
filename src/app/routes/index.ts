import { Router } from 'express';
import questionRoutes from './questionRoutes.js';
import userRoutes from './userRoutes.js';
import participationRoutes from './participationRoutes.js';

const router = Router();

router.use('/questions', questionRoutes);
router.use('/users', userRoutes);
router.use('/participations', participationRoutes);

export default router;
