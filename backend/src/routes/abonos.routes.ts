import { Router } from 'express';
import { getAbonos, createAbono } from '../controllers/abonos.controller';

const router = Router();

router.get('/', getAbonos);
router.post('/', createAbono);

export default router;
