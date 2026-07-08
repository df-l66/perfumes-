"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gastos_controller_1 = require("../controllers/gastos.controller");
const router = (0, express_1.Router)();
router.get('/', gastos_controller_1.getGastos);
router.post('/', gastos_controller_1.createGasto);
router.delete('/:id', gastos_controller_1.deleteGasto);
exports.default = router;
