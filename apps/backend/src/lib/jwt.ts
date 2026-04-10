import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function parseExpiresIn(expiresIn: string): number {
  const numeric = Number.parseInt(expiresIn, 10);

  if (expiresIn.endsWith("d")) {
    return numeric * 24 * 60 * 60;
  }

  if (expiresIn.endsWith("h")) {
    return numeric * 60 * 60;
  }

  if (expiresIn.endsWith("m")) {
    return numeric * 60;
  }

  return Number.isNaN(numeric) ? 7 * 24 * 60 * 60 : numeric;
}

export function signAuthToken(payload: Omit<AuthTokenPayload, "exp">): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + parseExpiresIn(env.JWT_EXPIRES_IN);
  const fullPayload: AuthTokenPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = createHmac("sha256", env.JWT_SECRET).update(data).digest("base64url");

  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed token");
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", env.JWT_SECRET).update(data).digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AuthTokenPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}
