import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  // Errores de validación con Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación',
      detalles: err.issues,
    });
    return;
  }

  // Si el error tiene un status code definido, lo usamos (ej. creados intencionalmente)
  if (err.statusCode) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor. Por favor, intenta más tarde.',
  });
};
