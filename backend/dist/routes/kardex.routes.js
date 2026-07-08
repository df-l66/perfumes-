"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kardex_controller_1 = require("../controllers/kardex.controller");
const router = (0, express_1.Router)();
router.get('/', kardex_controller_1.getKardex);
router.post('/ajuste', kardex_controller_1.registrarAjuste);
exports.default = router;
