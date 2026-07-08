import { Router } from 'express';
import { getVentas, createVenta, anularVenta } from '../controllers/ventas.controller';

const router = Router();

router.get('/', getVentas);
router.post('/', createVenta);
router.put('/:id/anular', anularVenta);

export default router;
