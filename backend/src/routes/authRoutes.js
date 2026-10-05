import { Router } from "express"
import { z } from "zod"
import { getCurrentUser, login, logout, register } from "../controllers/authController.js"
import { requireAuth } from "../middleware/authMiddleware.js"
import { validate } from "../middleware/validate.js"

const router = Router()
const credentials = z.object({
  email: z.string().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
})

router.post("/register", validate(z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
})), register)
router.post("/login", validate(credentials), login)
router.get("/me", requireAuth, getCurrentUser)
router.post("/logout", logout)

export default router