import { Router } from "express"
import { z } from "zod"
import {
  acceptOrder,
  getAdminOrder,
  listAdminOrders,
  rejectOrder,
  updateOrderStatus,
} from "../controllers/orderController.js"
import { requireAuth } from "../middleware/authMiddleware.js"
import { requireAdmin } from "../middleware/adminMiddleware.js"
import { validate } from "../middleware/validate.js"

const router = Router()
router.use(requireAuth, requireAdmin)
router.get("/orders", listAdminOrders)
router.get("/orders/:id", getAdminOrder)
router.patch("/orders/:id/accept", validate(z.object({ adminNote: z.string().max(1000).optional() })), acceptOrder)
router.patch("/orders/:id/reject", validate(z.object({ adminNote: z.string().max(1000).optional() })), rejectOrder)
router.patch("/orders/:id/status", validate(z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  adminNote: z.string().max(1000).optional(),
})), updateOrderStatus)

export default router