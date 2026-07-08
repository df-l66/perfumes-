import { Router } from 'express';
import { getCompras, createCompra, anularCompra } from '../controllers/compras.controller';

const router = Router();

router.get('/', getCompras);
router.post('/', createCompra);
router.put('/:id/anular', anularCompra);

export default router;
