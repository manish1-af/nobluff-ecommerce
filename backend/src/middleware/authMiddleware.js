import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { authCookieName } from "../utils/generateToken.js"

export async function requireAuth(request, response, next) {
  try {
    const headerToken = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice(7)
      : null
    const token = request.cookies?.[authCookieName] || headerToken
    if (!token || !process.env.JWT_SECRET) {
      return response.status(401).json({ success: false, message: "Authentication required" })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select("name email phone role")
    if (!user) {
      return response.status(401).json({ success: false, message: "Session is no longer valid" })
    }

    request.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({ success: false, message: "Invalid or expired session" })
    }
    next(error)
  }
}

export function requireCustomer(request, response, next) {
  if (request.user?.role !== "customer") {
    return response.status(403).json({ success: false, message: "Customer access required" })
  }
  next()
}