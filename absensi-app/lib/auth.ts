
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 8 * 60 * 60;

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;

  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_PASSWORD belum diatur atau terlalu pendek.");
  }

  return secret;
}

export function verifyAdminPassword(password: string) {
  const expected = Buffer.from(getSecret());
  const received = Buffer.from(password);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

function sign(value: string) {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createAdminSession() {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function isAdminAuthenticated(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) return false;

    const [payload, signature] = token.split(".");

    if (!payload || !signature) return false;

    const expectedSignature = Buffer.from(sign(payload));
    const receivedSignature = Buffer.from(signature);

    if (
      expectedSignature.length !== receivedSignature.length ||
      !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return (
      session.role === "admin" &&
      typeof session.exp === "number" &&
      session.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_DURATION,
};
