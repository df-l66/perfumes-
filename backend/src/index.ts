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
import authRoutes from './routes/auth.routes';
import { authMiddleware, adminMiddleware } from './middlewares/auth.middleware';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Cabeceras de seguridad
app.use(morgan('dev')); // Logger de peticiones HTTP

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());

// Limitar peticiones a todas las rutas de /api
app.use('/api/', apiLimiter);

// Rutas protegidas (Todos los usuarios autenticados)
app.use('/api/productos', authMiddleware, productosRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/kardex', authMiddleware, kardexRoutes);
app.use('/api/abonos', authMiddleware, abonosRoutes);

// Rutas administrativas (Solo administradores)
app.use('/api/proveedores', authMiddleware, adminMiddleware, proveedoresRoutes);
app.use('/api/compras', authMiddleware, adminMiddleware, comprasRoutes);
app.use('/api/gastos', authMiddleware, adminMiddleware, gastosRoutes);
app.use('/api/config', authMiddleware, adminMiddleware, configRoutes);
app.use('/api/logs', authMiddleware, adminMiddleware, logsRoutes);
app.use('/api/auth', authMiddleware, adminMiddleware, authRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor backend corriendo correctamente' });
});

// Middleware de errores global (Debe ir siempre al final de las rutas)
app.use(errorMiddleware);

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
