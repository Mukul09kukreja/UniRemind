import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ALLOWED_ORIGIN: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.string().url("GOOGLE_REDIRECT_URI must be a valid URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsedEnv.data;

export function getAuthEnv(): {
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
} {
  const missing: string[] = [];

  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.GOOGLE_REDIRECT_URI) missing.push("GOOGLE_REDIRECT_URI");
  if (!env.JWT_SECRET) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Authentication configuration is incomplete. Missing env vars: ${missing.join(", ")}`
    );
  }

  const googleClientId = env.GOOGLE_CLIENT_ID as string;
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET as string;
  const googleRedirectUri = env.GOOGLE_REDIRECT_URI as string;
  const jwtSecret = env.JWT_SECRET as string;

  const redirectUriResult = z.string().url().safeParse(googleRedirectUri);

  if (!redirectUriResult.success) {
    throw new Error("GOOGLE_REDIRECT_URI must be a valid URL");
  }

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  return {
    googleClientId,
    googleClientSecret,
    googleRedirectUri,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN
  };
}
