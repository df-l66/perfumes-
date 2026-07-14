import { Router } from 'express';
import {
  getMateriasPrimas,
  getMateriaPrimaById,
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
  registrarMovimiento,
  getMovimientos
} from '../controllers/materias_primas.controller';

const router = Router();

// Rutas de catálogo de materias primas
router.get('/', getMateriasPrimas);
router.post('/', createMateriaPrima);
// Rutas de movimientos (ingresos/compras y ajustes)
router.post('/movimientos', registrarMovimiento);
router.get('/movimientos/historial', getMovimientos);

router.get('/:id', getMateriaPrimaById);
router.put('/:id', updateMateriaPrima);
router.delete('/:id', deleteMateriaPrima);

export default router;
