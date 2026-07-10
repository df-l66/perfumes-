"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita a cada IP a 100 peticiones por ventana de 15 minutos
    message: {
        error: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente después de 15 minutos.',
    },
    standardHeaders: true, // Retorna la info del límite en los headers `RateLimit-*`
    legacyHeaders: false, // Desactiva los headers `X-RateLimit-*`
});
