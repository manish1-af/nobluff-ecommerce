import mongoose from "mongoose"

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: "" },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: null },
    images: { type: [imageSchema], default: [] },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

productSchema.index({ isActive: 1, category: 1 })
productSchema.index({ name: "text", description: "text" })

export default mongoose.model("Product", productSchema)