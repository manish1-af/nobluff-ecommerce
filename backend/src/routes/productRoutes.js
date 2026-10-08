import { Router } from "express"
import multer from "multer"
import { z } from "zod"
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductBySlug,
  listProducts,
  updateProduct,
  uploadImage,
} from "../controllers/productController.js"
import { requireAuth } from "../middleware/authMiddleware.js"
import { requireAdmin } from "../middleware/adminMiddleware.js"
import { validate } from "../middleware/validate.js"

const router = Router()
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(request, file, callback) {
    if (
      file.mimetype.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|avif|svg|bmp|tiff|heic|heif|ico)$/i.test(file.originalname)
    ) {
      callback(null, true)
    } else {
      callback(new Error("Please upload a valid image file (JPEG, PNG, WebP, GIF, SVG, etc.)"))
    }
  },
})
const imageValidator = z
  .string()
  .trim()
  .min(1)
  .max(10000000)
  .transform((val) => {
    if (val.startsWith("data:") || val.startsWith("/") || val.startsWith("blob:")) return val
    if (!/^https?:\/\//i.test(val)) return `https://${val}`
    return val
  })

const imageSchema = z.array(z.object({ url: imageValidator, publicId: z.string().max(300).optional() })).max(10).optional()
const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  images: imageSchema,
  image: imageValidator.optional(),
  category: z.string().trim().min(1).max(80),
  sizes: z.array(z.string().max(40)).max(30).optional(),
  colors: z.array(z.string().max(60)).max(30).optional(),
  stock: z.coerce.number().int().min(0).max(100000),
  sku: z.string().trim().max(80).optional(),
  isActive: z.boolean().optional(),
})

router.get("/", listProducts)
router.get("/slug/:slug", getProductBySlug)
router.get("/:id", getProduct)
router.post("/image-upload", requireAuth, requireAdmin, imageUpload.single("image"), uploadImage)
router.post("/", requireAuth, requireAdmin, validate(productSchema), createProduct)
router.put("/:id", requireAuth, requireAdmin, validate(productSchema.partial()), updateProduct)
router.delete("/:id", requireAuth, requireAdmin, deleteProduct)

export default router