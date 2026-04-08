import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = error instanceof Error ? error.message : "Unexpected server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(500).json({
    success: false,
    error: message
  });
}
