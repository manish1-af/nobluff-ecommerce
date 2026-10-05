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
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:8443")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable("x-powered-by")
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
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