import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import adminRoutes from "./routes/adminRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"

const app = express()
const defaultClientOrigins = [
  "http://localhost:8443",
  "http://localhost:5173",
  "http://127.0.0.1:8443",
  "http://127.0.0.1:5173",
  "https://nobluff-ecommerce-h54dgwitb-manish1-afs-projects.vercel.app",
]

function getAllowedOrigins() {
  const configuredOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
  ]
    .filter(Boolean)
    .flatMap((origins) => origins.split(","))
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)

  return new Set([...defaultClientOrigins, ...configuredOrigins])
}

function isVercelPreviewOrigin(origin) {
  try {
    const { hostname, protocol } = new URL(origin)
    return protocol === "https:" && hostname.startsWith("nobluff-ecommerce-") && hostname.endsWith(".vercel.app")
  } catch {
    return false
  }
}

export function isOriginAllowed(origin) {
  if (!origin) return true
  const normalizedOrigin = origin.replace(/\/$/, "")
  return getAllowedOrigins().has(normalizedOrigin) || isVercelPreviewOrigin(normalizedOrigin)
}

app.disable("x-powered-by")
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true)
    callback(new Error("Origin is not allowed by CORS"))
  },
  credentials: true,
}))
app.use(express.json({ limit: "32kb" }))
app.use(cookieParser())

app.get("/api/health", (request, response) => {
  response.json({ success: true, data: { status: "ok" } })
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Try again later." },
})
app.use("/api/auth/login", authLimiter)
app.use("/api/auth/register", authLimiter)
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admin", adminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
