import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../lib/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;

  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith("uniremind_session="))
    ?.split("=")[1];

  const token = bearer ?? cookieToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication required"
    });

    return;
  }

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";

    if (message.startsWith("Authentication configuration is incomplete") || message.includes("JWT_SECRET")) {
      res.status(503).json({
        success: false,
        error: "Authentication service is not configured on the server"
      });

      return;
    }

    res.status(401).json({
      success: false,
      error: "Invalid or expired token"
    });
  }
}
