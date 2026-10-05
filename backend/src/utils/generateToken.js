import jwt from "jsonwebtoken"

export function createToken(userId) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters")
  }

  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

export const authCookieName = "nobluff_session"

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production"

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  }
}

export function setAuthCookie(response, token) {
  response.cookie(authCookieName, token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookie(response) {
  response.clearCookie(authCookieName, getCookieOptions())
}
