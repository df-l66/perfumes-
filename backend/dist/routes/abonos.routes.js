"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const abonos_controller_1 = require("../controllers/abonos.controller");
const router = (0, express_1.Router)();
router.get('/', abonos_controller_1.getAbonos);
router.post('/', abonos_controller_1.createAbono);
exports.default = router;
