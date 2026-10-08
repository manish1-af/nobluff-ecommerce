import { Router } from "express"

import { z } from "zod"

import {
  getStorefrontSettings,
  updateStorefrontSettings,
} from "../controllers/storefrontController.js"

import { requireAuth } from "../middleware/authMiddleware.js"

import { requireAdmin } from "../middleware/adminMiddleware.js"

import { validate } from "../middleware/validate.js"

const router = Router()

const settingsSchema = z
  .object({
    categoryTiles: z
      .array(
        z.object({
          id: z.number().int(),

          name: z.string().trim().min(1).max(80),

          note: z.string().trim().min(1).max(160),

          filter: z.string().trim().min(1).max(80),

          image: z.string().url().max(2048),
        }),
      )
      .max(40)
      .optional(),

    brandImages: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80),

          url: z.string().url().max(2048),
        }),
      )
      .max(20)
      .optional(),
  })
  .refine((settings) => Object.keys(settings).length > 0, {
    message: "Provide storefront settings to update",
  })

router.get("/", getStorefrontSettings)

router.put(
  "/",
  requireAuth,
  requireAdmin,
  validate(settingsSchema),
  updateStorefrontSettings,
)

export default router
