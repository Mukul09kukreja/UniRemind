import { Router } from "express";

import { getSyncRunnerState } from "../jobs/sync-runner.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  classifyRecentGmail,
  pollClassroomAssignments,
  runUserSyncCycle,
  syncClassroomAssignmentsToCalendar
} from "../services/sync.js";

const syncRouter = Router();

syncRouter.post("/classroom/poll", requireAuth, async (req, res, next) => {
  try {
    const result = await pollClassroomAssignments(req.auth!.userId);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

syncRouter.post("/calendar/classroom", requireAuth, async (req, res, next) => {
  try {
    const result = await syncClassroomAssignmentsToCalendar(req.auth!.userId);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

syncRouter.post("/gmail/classify", requireAuth, async (req, res, next) => {
  try {
    const result = await classifyRecentGmail(req.auth!.userId);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

syncRouter.post("/run-now", requireAuth, async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.auth!.userId }
    });

    const result = await runUserSyncCycle(req.auth!.userId, {
      classroomEnabled: settings?.syncGoogleClassroom ?? true,
      gmailEnabled: settings?.syncGmail ?? true
    });

    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

syncRouter.get("/runner/status", requireAuth, (_req, res) => {
  res.status(200).json({ success: true, runner: getSyncRunnerState() });
});

export { syncRouter };
