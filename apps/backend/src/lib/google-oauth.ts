import { env } from "../config/env.js";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.readonly"
];

export type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state
  });

  return `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{ idToken: string; accessToken: string }> {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code"
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Google token exchange failed");
  }

  const data = (await response.json()) as { id_token?: string; access_token?: string };

  if (!data.id_token || !data.access_token) {
    throw new Error("Google token payload missing id_token or access_token");
  }

  return {
    idToken: data.id_token,
    accessToken: data.access_token
  };
}

export async function fetchGoogleProfile(idToken: string): Promise<GoogleProfile> {
  const params = new URLSearchParams({
    id_token: idToken
  });

  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to verify Google ID token");
  }

  const data = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
  };

  if (data.aud !== env.GOOGLE_CLIENT_ID || !data.sub || !data.email) {
    throw new Error("Invalid Google token audience or missing profile data");
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture
  };
}
