"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compras_controller_1 = require("../controllers/compras.controller");
const router = (0, express_1.Router)();
router.get('/', compras_controller_1.getCompras);
router.post('/', compras_controller_1.createCompra);
router.put('/:id/anular', compras_controller_1.anularCompra);
exports.default = router;
