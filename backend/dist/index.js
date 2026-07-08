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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rutas protegidas
app.use('/api/productos', auth_middleware_1.authMiddleware, productos_routes_1.default);
app.use('/api/proveedores', auth_middleware_1.authMiddleware, proveedores_routes_1.default);
app.use('/api/clientes', auth_middleware_1.authMiddleware, clientes_routes_1.default);
app.use('/api/ventas', auth_middleware_1.authMiddleware, ventas_routes_1.default);
app.use('/api/compras', auth_middleware_1.authMiddleware, compras_routes_1.default);
app.use('/api/kardex', auth_middleware_1.authMiddleware, kardex_routes_1.default);
app.use('/api/gastos', auth_middleware_1.authMiddleware, gastos_routes_1.default);
app.use('/api/abonos', auth_middleware_1.authMiddleware, abonos_routes_1.default);
app.use('/api/config', auth_middleware_1.authMiddleware, config_routes_1.default);
app.use('/api/logs', auth_middleware_1.authMiddleware, logs_routes_1.default);
// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Servidor backend corriendo correctamente' });
});
// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
