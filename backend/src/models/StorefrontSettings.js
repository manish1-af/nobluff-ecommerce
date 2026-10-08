import mongoose from "mongoose"

const categoryTileSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },

    name: { type: String, required: true, trim: true, maxlength: 80 },

    note: { type: String, required: true, trim: true, maxlength: 160 },

    filter: { type: String, required: true, trim: true, maxlength: 80 },

    image: { type: String, required: true, trim: true, maxlength: 2048 },
  },

  { _id: false },
)

const brandImageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 80 },

    url: { type: String, required: true, trim: true, maxlength: 2048 },
  },

  { _id: false },
)

const storefrontSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },

    categoryTiles: { type: [categoryTileSchema], default: undefined },

    brandImages: { type: [brandImageSchema], default: undefined },
  },

  { timestamps: true },
)

export default mongoose.model("StorefrontSettings", storefrontSettingsSchema)
