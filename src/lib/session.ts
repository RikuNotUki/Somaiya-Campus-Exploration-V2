import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "campus_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — this is a pilot, keep students logged in

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set — see .env.example");
  return s;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** Creates a signed token containing the student id. Not encrypted — don't put secrets in it. */
export function createSessionToken(studentId: string) {
  const payload = Buffer.from(JSON.stringify({ sid: studentId, t: Date.now() })).toString(
    "base64url"
  );
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return data.sid ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(studentId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(studentId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentStudentId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}
