import { Router } from 'express';
import { adminMiddleware } from '../middlewares/auth.middleware';
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

// Rutas de catálogo de materias primas (Lectura libre para usuarios autenticados)
router.get('/', getMateriasPrimas);
router.get('/movimientos/historial', getMovimientos);
router.get('/:id', getMateriaPrimaById);

// Escritura restringida a administradores
router.post('/', adminMiddleware, createMateriaPrima);
router.post('/movimientos', adminMiddleware, registrarMovimiento);
router.put('/:id', adminMiddleware, updateMateriaPrima);
router.delete('/:id', adminMiddleware, deleteMateriaPrima);

export default router;
