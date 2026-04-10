import { randomUUID } from "node:crypto";

import { Router } from "express";

import { buildGoogleAuthUrl, exchangeCodeForTokens, fetchGoogleProfile } from "../lib/google-oauth.js";
import { signAuthToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const authRouter = Router();
const oauthStateStore = new Map<string, number>();

authRouter.get("/google/redirect", (_req, res) => {
  const state = randomUUID();
  oauthStateStore.set(state, Date.now());
  res.redirect(buildGoogleAuthUrl(state));
});

authRouter.get("/google", (_req, res) => {
  const state = randomUUID();
  oauthStateStore.set(state, Date.now());

  res.status(200).json({
    success: true,
    authUrl: buildGoogleAuthUrl(state)
  });
});

authRouter.get("/google/callback", async (req, res, next) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (typeof code !== "string" || typeof state !== "string") {
      res.status(400).json({ success: false, error: "Missing OAuth code or state" });

      return;
    }

    if (!oauthStateStore.has(state)) {
      res.status(400).json({ success: false, error: "Invalid OAuth state" });

      return;
    }

    oauthStateStore.delete(state);

    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokens.idToken);

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.sub,
        fullName: profile.name,
        avatarUrl: profile.picture
      },
      create: {
        email: profile.email,
        googleId: profile.sub,
        fullName: profile.name,
        avatarUrl: profile.picture,
        settings: {
          create: {}
        }
      },
      include: {
        settings: true
      }
    });

    const sessionToken = signAuthToken({
      userId: user.id,
      email: user.email
    });

    res.cookie("uniremind_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { settings: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });

      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      },
      settings: user.settings
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("uniremind_session");
  res.status(200).json({ success: true });
});

export { authRouter };
