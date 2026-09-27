import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';

const router = Router();
const userController = new UserController();

router.post('/', userController.create);
router.get('/:id', userController.getById);

export default router;
