import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

type GmailLabel = "DEADLINE" | "ANNOUNCEMENT" | "GENERAL";

const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [gmailLogs, runnerErrors] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId: req.auth!.userId,
          action: "gmail.message_classified",
          createdAt: {
            gte: since
          }
        },
        select: {
          details: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 500
      }),
      prisma.activityLog.count({
        where: {
          userId: req.auth!.userId,
          action: "sync.runner_error",
          createdAt: {
            gte: since
          }
        }
      })
    ]);

    const counts: Record<GmailLabel, number> = {
      DEADLINE: 0,
      ANNOUNCEMENT: 0,
      GENERAL: 0
    };

    for (const item of gmailLogs) {
      const label: GmailLabel | undefined =
        typeof item.details === "object" && item.details && "label" in item.details
          ? (item.details.label as GmailLabel | undefined)
          : undefined;

      if (label === "DEADLINE" || label === "ANNOUNCEMENT" || label === "GENERAL") {
        counts[label] += 1;
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        emailCategories: counts,
        highPriorityAlerts: runnerErrors
      }
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/upcoming", requireAuth, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        userId: req.auth!.userId,
        action: "classroom.assignment_polled"
      },
      select: {
        details: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 500
    });

    const now = Date.now();
    const parsedItems: Array<{ title: string; dueAt: string; source: string; courseId: string | null }> = [];

    for (const entry of logs as Array<{ details: unknown }>) {
      if (!entry.details || typeof entry.details !== "object") {
        continue;
      }

      const details = entry.details as {
        title?: unknown;
        dueAt?: unknown;
        courseId?: unknown;
      };

      if (typeof details.title !== "string" || typeof details.dueAt !== "string") {
        continue;
      }

      const dueAtMs = Date.parse(details.dueAt);
      if (Number.isNaN(dueAtMs) || dueAtMs < now) {
        continue;
      }

      parsedItems.push({
        title: details.title,
        dueAt: details.dueAt,
        source: "Classroom",
        courseId: typeof details.courseId === "string" ? details.courseId : null
      });
    }

    const items = parsedItems.sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 10);

    res.status(200).json({
      success: true,
      upcoming: items
    });
  } catch (error) {
    next(error);
  }
});

export { dashboardRouter };
