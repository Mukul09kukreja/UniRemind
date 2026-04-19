import { prisma } from "../lib/prisma.js";

type GmailLabel = "DEADLINE" | "ANNOUNCEMENT" | "GENERAL";

export type UpcomingItem = {
  title: string;
  dueAt: string;
  source: "Classroom";
  courseId: string | null;
};

export type PriorityAlert = {
  id: string;
  severity: "critical" | "high" | "medium";
  message: string;
  dueAt: string | null;
};

export async function getDashboardSummary(userId: string, days: number): Promise<{
  emailCategories: Record<GmailLabel, number>;
  highPriorityAlerts: number;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [gmailLogs, runnerErrors] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        userId,
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
      take: 1000
    }),
    prisma.activityLog.count({
      where: {
        userId,
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

  return {
    emailCategories: counts,
    highPriorityAlerts: runnerErrors
  };
}

export async function getUpcomingItems(
  userId: string,
  pagination: { limit: number; offset: number }
): Promise<{ items: UpcomingItem[]; total: number }> {
  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      action: "classroom.assignment_polled"
    },
    select: {
      details: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 1000
  });

  const now = Date.now();
  const parsedItems: UpcomingItem[] = [];

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

  const sortedItems = parsedItems.sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return {
    total: sortedItems.length,
    items: sortedItems.slice(pagination.offset, pagination.offset + pagination.limit)
  };
}

export async function getPriorityAlerts(
  userId: string,
  options: { windowHours: number; limit: number }
): Promise<PriorityAlert[]> {
  const [{ items: upcomingItems }, runnerErrors] = await Promise.all([
    getUpcomingItems(userId, { limit: 50, offset: 0 }),
    prisma.activityLog.count({
      where: {
        userId,
        action: "sync.runner_error",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  const now = Date.now();
  const windowMs = options.windowHours * 60 * 60 * 1000;
  const alerts: PriorityAlert[] = [];

  for (const item of upcomingItems) {
    const dueAtMs = Date.parse(item.dueAt);
    const delta = dueAtMs - now;

    if (delta <= 6 * 60 * 60 * 1000) {
      alerts.push({
        id: `critical-${item.title}-${item.dueAt}`,
        severity: "critical",
        message: `${item.title} is due within 6 hours`,
        dueAt: item.dueAt
      });
      continue;
    }

    if (delta <= windowMs) {
      alerts.push({
        id: `high-${item.title}-${item.dueAt}`,
        severity: "high",
        message: `${item.title} is due soon`,
        dueAt: item.dueAt
      });
    }
  }

  const next24hCount = upcomingItems.filter((item) => {
    const dueAtMs = Date.parse(item.dueAt);
    return dueAtMs - now <= 24 * 60 * 60 * 1000;
  }).length;

  if (next24hCount >= 3) {
    alerts.push({
      id: "cluster-24h",
      severity: "high",
      message: `You have ${next24hCount} deadlines in the next 24 hours`,
      dueAt: null
    });
  }

  if (runnerErrors > 0) {
    alerts.push({
      id: "runner-errors",
      severity: "medium",
      message: `${runnerErrors} background sync errors in last 30 days`,
      dueAt: null
    });
  }

  return alerts.slice(0, options.limit);
}
