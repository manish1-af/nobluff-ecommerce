import StorefrontSettings from "../models/StorefrontSettings.js"

import { asyncHandler } from "../utils/asyncHandler.js"

export const getStorefrontSettings = asyncHandler(async (request, response) => {
  const settings = await StorefrontSettings.findOne({ key: "default" })

    .select("categoryTiles brandImages")

    .lean()

  response.json({
    success: true,

    data: {
      categoryTiles: settings?.categoryTiles ?? null,

      brandImages: settings?.brandImages ?? null,
    },
  })
})

export const updateStorefrontSettings = asyncHandler(
  async (request, response) => {
    const changes = {}

    if (request.body.categoryTiles !== undefined)
      changes.categoryTiles = request.body.categoryTiles

    if (request.body.brandImages !== undefined)
      changes.brandImages = request.body.brandImages

    const settings = await StorefrontSettings.findOneAndUpdate(
      { key: "default" },

      { $set: changes },

      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

      .select("categoryTiles brandImages")

      .lean()

    response.json({
      success: true,

      data: {
        categoryTiles: settings.categoryTiles ?? null,

        brandImages: settings.brandImages ?? null,
      },
    })
  },
)
