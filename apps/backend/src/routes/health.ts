import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "uniremind-backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});
