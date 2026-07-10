import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita a cada IP a 100 peticiones por ventana de 15 minutos
  message: {
    error: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente después de 15 minutos.',
  },
  standardHeaders: true, // Retorna la info del límite en los headers `RateLimit-*`
  legacyHeaders: false, // Desactiva los headers `X-RateLimit-*`
});
