import { Router } from 'express';
import { ParticipationController } from '../controllers/ParticipationController.js';

const router = Router();
const participationController = new ParticipationController();

router.post('/start', participationController.start);

router.post('/:id/answer', participationController.answer);

router.post('/:id/finish', participationController.finish);

router.get('/:id', participationController.getById);

export default router;
