import { Router } from 'express';
import { createCliente } from '../controllers/clientes.controller';

const router = Router();

// Endpoint público para registro de clientes
router.post('/registro-cliente', createCliente);

export default router;
