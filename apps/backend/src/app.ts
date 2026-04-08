import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "UniRemind API is running",
    healthCheck: "/api/health"
  });
});

app.use("/api/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
