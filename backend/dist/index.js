"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const productos_routes_1 = __importDefault(require("./routes/productos.routes"));
const proveedores_routes_1 = __importDefault(require("./routes/proveedores.routes"));
const clientes_routes_1 = __importDefault(require("./routes/clientes.routes"));
const ventas_routes_1 = __importDefault(require("./routes/ventas.routes"));
const compras_routes_1 = __importDefault(require("./routes/compras.routes"));
const kardex_routes_1 = __importDefault(require("./routes/kardex.routes"));
const gastos_routes_1 = __importDefault(require("./routes/gastos.routes"));
const abonos_routes_1 = __importDefault(require("./routes/abonos.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const logs_routes_1 = __importDefault(require("./routes/logs.routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, helmet_1.default)()); // Cabeceras de seguridad
app.use((0, morgan_1.default)('dev')); // Logger de peticiones HTTP
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: allowedOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
// Limitar peticiones a todas las rutas de /api
app.use('/api/', rateLimiter_middleware_1.apiLimiter);
// Rutas protegidas (Todos los usuarios autenticados)
app.use('/api/productos', auth_middleware_1.authMiddleware, productos_routes_1.default);
app.use('/api/clientes', auth_middleware_1.authMiddleware, clientes_routes_1.default);
app.use('/api/ventas', auth_middleware_1.authMiddleware, ventas_routes_1.default);
app.use('/api/kardex', auth_middleware_1.authMiddleware, kardex_routes_1.default);
app.use('/api/abonos', auth_middleware_1.authMiddleware, abonos_routes_1.default);
// Rutas administrativas (Solo administradores)
app.use('/api/proveedores', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, proveedores_routes_1.default);
app.use('/api/compras', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, compras_routes_1.default);
app.use('/api/gastos', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, gastos_routes_1.default);
app.use('/api/config', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, config_routes_1.default);
app.use('/api/logs', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, logs_routes_1.default);
// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Servidor backend corriendo correctamente' });
});
// Middleware de errores global (Debe ir siempre al final de las rutas)
app.use(error_middleware_1.errorMiddleware);
// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
