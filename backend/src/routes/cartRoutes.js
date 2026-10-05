import { Router } from "express"
import { z } from "zod"
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cartController.js"
import { requireAuth, requireCustomer } from "../middleware/authMiddleware.js"
import { validate } from "../middleware/validate.js"

const router = Router()
router.use(requireAuth, requireCustomer)
router.get("/", getCart)
router.post("/", validate(z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  selectedSize: z.string().max(40).optional(),
  selectedColor: z.string().max(60).optional(),
})), addCartItem)
router.put("/:itemId", validate(z.object({ quantity: z.coerce.number().int().min(1).max(99) })), updateCartItem)
router.delete("/:itemId", removeCartItem)
router.delete("/", clearCart)

export default router