import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productosRoutes from './routes/productos.routes';
import proveedoresRoutes from './routes/proveedores.routes';
import clientesRoutes from './routes/clientes.routes';
import ventasRoutes from './routes/ventas.routes';
import comprasRoutes from './routes/compras.routes';
import kardexRoutes from './routes/kardex.routes';
import gastosRoutes from './routes/gastos.routes';
import abonosRoutes from './routes/abonos.routes';
import configRoutes from './routes/config.routes';
import logsRoutes from './routes/logs.routes';
import { authMiddleware } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas protegidas
app.use('/api/productos', authMiddleware, productosRoutes);
app.use('/api/proveedores', authMiddleware, proveedoresRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/compras', authMiddleware, comprasRoutes);
app.use('/api/kardex', authMiddleware, kardexRoutes);
app.use('/api/gastos', authMiddleware, gastosRoutes);
app.use('/api/abonos', authMiddleware, abonosRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/logs', authMiddleware, logsRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor backend corriendo correctamente' });
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
