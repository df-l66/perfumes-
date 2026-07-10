import { Router } from 'express';
import { createUser, getUsers, updateUser } from '../controllers/auth.controller';

const router = Router();

router.get('/', getUsers);
router.post('/register', createUser);
router.put('/:id', updateUser);

export default router;
