import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth.js";
import { getDashboardSummary, getPriorityAlerts, getUpcomingItems } from "../services/dashboard.js";

const summaryQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(90).default(30)
});

const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0)
});

const alertsQuerySchema = z.object({
  windowHours: z.coerce.number().int().positive().max(72).default(48),
  limit: z.coerce.number().int().positive().max(20).default(5)
});

const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const summary = await getDashboardSummary(req.auth!.userId, query.days);

    res.status(200).json({
      success: true,
      summary,
      meta: {
        days: query.days
      }
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/upcoming", requireAuth, async (req, res, next) => {
  try {
    const query = upcomingQuerySchema.parse(req.query);
    const result = await getUpcomingItems(req.auth!.userId, query);

    res.status(200).json({
      success: true,
      upcoming: result.items,
      meta: {
        limit: query.limit,
        offset: query.offset,
        total: result.total
      }
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/alerts", requireAuth, async (req, res, next) => {
  try {
    const query = alertsQuerySchema.parse(req.query);
    const alerts = await getPriorityAlerts(req.auth!.userId, query);

    res.status(200).json({
      success: true,
      alerts,
      meta: query
    });
  } catch (error) {
    next(error);
  }
});

export { dashboardRouter };
