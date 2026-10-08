import StorefrontSettings from "../models/StorefrontSettings.js"

import { asyncHandler } from "../utils/asyncHandler.js"

export const getStorefrontSettings = asyncHandler(async (request, response) => {
  const settings = await StorefrontSettings.findOne({ key: "default" })
    .select("categoryTiles brandImages welcomeHeroImage homeHeroImage")
    .lean()

  response.json({
    success: true,
    data: {
      categoryTiles: settings?.categoryTiles ?? null,
      brandImages: settings?.brandImages ?? null,
      welcomeHeroImage: settings?.welcomeHeroImage ?? null,
      homeHeroImage: settings?.homeHeroImage ?? null,
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

    if (request.body.welcomeHeroImage !== undefined)
      changes.welcomeHeroImage = request.body.welcomeHeroImage

    if (request.body.homeHeroImage !== undefined)
      changes.homeHeroImage = request.body.homeHeroImage

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
      .select("categoryTiles brandImages welcomeHeroImage homeHeroImage")
      .lean()

    response.json({
      success: true,
      data: {
        categoryTiles: settings.categoryTiles ?? null,
        brandImages: settings.brandImages ?? null,
        welcomeHeroImage: settings.welcomeHeroImage ?? null,
        homeHeroImage: settings.homeHeroImage ?? null,
      },
    })
  },
)
