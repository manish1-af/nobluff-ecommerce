import { Router } from "express"
import { z } from "zod"
import { cancelMyOrder, createOrder, listMyOrders } from "../controllers/orderController.js"
import { requireAuth, requireCustomer } from "../middleware/authMiddleware.js"
import { validate } from "../middleware/validate.js"

const router = Router()
router.use(requireAuth, requireCustomer)
router.get("/", listMyOrders)
router.patch("/:id/cancel", cancelMyOrder)
router.post("/", validate(z.object({
  customerName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(30),
  note: z.string().max(500).optional(),
  shippingAddress: z.object({
    line1: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().min(4).max(12),
    country: z.string().trim().min(2).max(80).default("India"),
  }),
})), createOrder)

export default router