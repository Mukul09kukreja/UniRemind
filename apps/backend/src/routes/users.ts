import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const updateSettingsSchema = z.object({
  syncGoogleClassroom: z.boolean().optional(),
  syncWhatsApp: z.boolean().optional(),
  syncGmail: z.boolean().optional(),
  timezone: z.string().min(1).optional()
});

const usersRouter = Router();

usersRouter.patch("/me/settings", requireAuth, async (req, res, next) => {
  try {
    const body = updateSettingsSchema.parse(req.body);

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.auth!.userId },
      update: body,
      create: {
        userId: req.auth!.userId,
        ...body
      }
    });

    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

export { usersRouter };
