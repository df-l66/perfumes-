"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ventas_controller_1 = require("../controllers/ventas.controller");
const router = (0, express_1.Router)();
router.get('/', ventas_controller_1.getVentas);
router.post('/', ventas_controller_1.createVenta);
router.put('/:id/anular', ventas_controller_1.anularVenta);
exports.default = router;
