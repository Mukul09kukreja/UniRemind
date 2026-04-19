import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth.js";
import { getDashboardSummary, getUpcomingAssignments } from "../services/dashboard.js";

const dashboardRouter = Router();

const summaryQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).optional().default(30)
});

const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  windowDays: z.coerce.number().int().min(1).max(365).optional().default(90)
});

dashboardRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const query = summaryQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ success: false, error: "Invalid query params" });
      return;
    }

    const summary = await getDashboardSummary(
      req.auth!.userId,
      query.data.windowDays
    );

    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/upcoming", requireAuth, async (req, res, next) => {
  try {
    const query = upcomingQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ success: false, error: "Invalid query params" });
      return;
    }

    const upcoming = await getUpcomingAssignments(
      req.auth!.userId,
      query.data.limit,
      query.data.windowDays
    );

    res.status(200).json({ success: true, upcoming });
  } catch (error) {
    next(error);
  }
});

export { dashboardRouter };