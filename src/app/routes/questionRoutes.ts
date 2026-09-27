import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController.js';

const router = Router();
const questionController = new QuestionController();

router.get('/', questionController.list);

router.get('/:id', questionController.getById);

router.post('/:id/answer', questionController.answer);

export default router;
