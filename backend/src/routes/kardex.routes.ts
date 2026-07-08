import { Router } from 'express';
import { getKardex, registrarAjuste } from '../controllers/kardex.controller';

const router = Router();

router.get('/', getKardex);
router.post('/ajuste', registrarAjuste);

export default router;
