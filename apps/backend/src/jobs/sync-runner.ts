import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { runUserSyncCycle } from "../services/sync.js";

type SyncRunnerState = {
  isEnabled: boolean;
  isRunning: boolean;
  intervalMs: number;
  batchSize: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastSummary: {
    usersProcessed: number;
    classroomAssignments: number;
    calendarEvents: number;
    gmailProcessed: number;
  } | null;
};

const state: SyncRunnerState = {
  isEnabled: env.SYNC_RUNNER_ENABLED,
  isRunning: false,
  intervalMs: env.SYNC_RUNNER_INTERVAL_MS,
  batchSize: env.SYNC_RUNNER_BATCH_SIZE,
  lastRunAt: null,
  lastSuccessAt: null,
  lastError: null,
  lastSummary: null
};

async function executeSyncCycle(): Promise<void> {
  if (!state.isEnabled || state.isRunning) {
    return;
  }

  state.isRunning = true;
  state.lastRunAt = new Date().toISOString();

  try {
    const users = await prisma.user.findMany({
      where: {
        googleRefreshToken: {
          not: null
        },
        settings: {
          isNot: null
        }
      },
      include: {
        settings: true
      },
      take: state.batchSize,
      orderBy: {
        updatedAt: "asc"
      }
    });

    const summary = {
      usersProcessed: 0,
      classroomAssignments: 0,
      calendarEvents: 0,
      gmailProcessed: 0
    };

    for (const user of users) {
      const classroomEnabled = user.settings?.syncGoogleClassroom ?? false;
      const gmailEnabled = user.settings?.syncGmail ?? false;

      if (!classroomEnabled && !gmailEnabled) {
        continue;
      }

      try {
        const result = await runUserSyncCycle(user.id, {
          classroomEnabled,
          gmailEnabled
        });

        summary.usersProcessed += 1;
        summary.classroomAssignments += result.classroomAssignments;
        summary.calendarEvents += result.calendarEvents;
        summary.gmailProcessed += result.gmailProcessed;
      } catch (error) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "sync.runner_error",
            details: {
              message: error instanceof Error ? error.message : "Unknown sync error"
            }
          }
        });
      }
    }

    state.lastSummary = summary;
    state.lastSuccessAt = new Date().toISOString();
    state.lastError = null;
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : "Unknown sync runner error";
  } finally {
    state.isRunning = false;
  }
}

export function startSyncRunner(): void {
  if (!state.isEnabled) {
    return;
  }

  void executeSyncCycle();
  setInterval(() => {
    void executeSyncCycle();
  }, state.intervalMs);
}

export function getSyncRunnerState(): SyncRunnerState {
  return state;
}
