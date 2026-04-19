import { prisma } from "../lib/prisma.js";

type GmailLabel = "DEADLINE" | "ANNOUNCEMENT" | "GENERAL";
const VALID_LABELS = new Set<GmailLabel>(["DEADLINE", "ANNOUNCEMENT", "GENERAL"]);

function getSinceDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getDashboardSummary(
  userId: string,
  windowDays = 30
) {
  const since = getSinceDate(windowDays);

  const [gmailLogs, runnerErrors] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        userId,
        action: "gmail.message_classified",
        createdAt: { gte: since }
      },
      select: { details: true },
      orderBy: { createdAt: "desc" },
      take: 1000
    }),
    prisma.activityLog.count({
      where: {
        userId,
        action: "sync.runner_error",
        createdAt: { gte: since }
      }
    })
  ]);

  const counts: Record<GmailLabel, number> = {
    DEADLINE: 0,
    ANNOUNCEMENT: 0,
    GENERAL: 0
  };

  for (const item of gmailLogs) {
    if (!item.details || typeof item.details !== "object") continue;
    const raw = (item.details as Record<string, unknown>).label;
    if (typeof raw === "string" && VALID_LABELS.has(raw as GmailLabel)) {
      counts[raw as GmailLabel] += 1;
    }
  }

  return {
    emailCategories: counts,
    highPriorityAlerts: runnerErrors,
    windowDays
  };
}

export async function getUpcomingAssignments(
  userId: string,
  limit = 10,
  windowDays = 90
) {
  const since = getSinceDate(windowDays);
  const now = Date.now();

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      action: "classroom.assignment_polled",
      createdAt: { gte: since }
    },
    select: { details: true },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  const seen = new Set<string>();
  const items: Array<{
    title: string;
    dueAt: string;
    source: string;
    courseId: string | null;
  }> = [];

  for (const entry of logs) {
    if (!entry.details || typeof entry.details !== "object") continue;

    const d = entry.details as Record<string, unknown>;
    if (typeof d.title !== "string" || typeof d.dueAt !== "string") continue;

    const dueAtMs = Date.parse(d.dueAt);
    if (Number.isNaN(dueAtMs) || dueAtMs < now) continue;

    // deduplicate by title+dueAt
    const key = `${d.title}::${d.dueAt}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      title: d.title,
      dueAt: d.dueAt,
      source: "Classroom",
      courseId: typeof d.courseId === "string" ? d.courseId : null
    });
  }

  return items
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, limit);
}