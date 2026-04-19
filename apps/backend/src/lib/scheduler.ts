import cron from "node-cron";

import { prisma } from "./prisma.js";
import {
  classifyRecentGmail,
  pollClassroomAssignments,
  syncClassroomAssignmentsToCalendar
} from "../services/sync.js";

async function runSyncForAllUsers(): Promise<void> {
  console.log(`[scheduler] Starting sync run at ${new Date().toISOString()}`);

  const users = await prisma.user.findMany({
    where: {
      googleRefreshToken: { not: null }
    },
    include: {
      settings: true
    }
  });

  console.log(`[scheduler] Found ${users.length} user(s) with Google tokens`);

  for (const user of users) {
    try {
      console.log(`[scheduler] Syncing user ${user.email}`);

      const classroomEnabled = user.settings?.syncGoogleClassroom ?? false;
      const gmailEnabled = user.settings?.syncGmail ?? true;

      if (classroomEnabled) {
        const classroomResult = await pollClassroomAssignments(user.id);
        console.log(`[scheduler] Classroom poll: ${JSON.stringify(classroomResult)}`);

        const calendarResult = await syncClassroomAssignmentsToCalendar(user.id);
        console.log(`[scheduler] Calendar sync: ${JSON.stringify(calendarResult)}`);
      } else {
        console.log(`[scheduler] Classroom sync skipped for ${user.email} (disabled in settings)`);
      }

      if (gmailEnabled) {
        const gmailResult = await classifyRecentGmail(user.id);
        console.log(`[scheduler] Gmail classify: ${JSON.stringify(gmailResult)}`);
      } else {
        console.log(`[scheduler] Gmail sync skipped for ${user.email} (disabled in settings)`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[scheduler] Error syncing user ${user.email}: ${message}`);

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "scheduler.sync_error",
          details: { error: message, timestamp: new Date().toISOString() }
        }
      }).catch(() => {});
    }
  }

  console.log(`[scheduler] Sync run complete at ${new Date().toISOString()}`);
}

export function startScheduler(): void {
  cron.schedule("*/30 * * * *", () => {
    runSyncForAllUsers().catch((error) => {
      console.error("[scheduler] Unhandled error in sync run:", error);
    });
  });

  console.log("[scheduler] Background sync scheduler started (every 30 minutes)");

  setTimeout(() => {
    runSyncForAllUsers().catch((error) => {
      console.error("[scheduler] Error in startup sync:", error);
    });
  }, 5000);
}