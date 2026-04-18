import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type RefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true
    }
  });

  if (!user?.googleRefreshToken) {
    throw new Error("Google account is not connected with offline access");
  }

  const now = Date.now();
  const hasUnexpiredToken =
    !!user.googleAccessToken && !!user.googleTokenExpiry && user.googleTokenExpiry.getTime() - now > 60_000;

  if (hasUnexpiredToken) {
    return user.googleAccessToken!;
  }

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: user.googleRefreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Unable to refresh Google access token");
  }

  const data = (await response.json()) as RefreshTokenResponse;

  if (!data.access_token || !data.expires_in) {
    throw new Error("Google refresh response missing access token");
  }

  const expiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: data.access_token,
      googleTokenExpiry: expiry
    }
  });

  return data.access_token;
}

export async function googleApiGet<T>(userId: string, url: string): Promise<T> {
  const token = await getValidGoogleAccessToken(userId);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function googleApiPost<T>(userId: string, url: string, payload: unknown): Promise<T> {
  const token = await getValidGoogleAccessToken(userId);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google API POST request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
