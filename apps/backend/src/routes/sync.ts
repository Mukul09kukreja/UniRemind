import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import {
  classifyRecentGmail,
  pollClassroomAssignments,
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

export { syncRouter };
