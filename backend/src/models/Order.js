import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, trim: true, default: "" },
    selectedColor: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const shippingAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    country: { type: String, required: true, trim: true, maxlength: 80, default: "India" },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "Order cannot be empty"] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true },
)

orderSchema.pre("validate", function assignOrderNumber() {
  if (!this.orderNumber) {
    this.orderNumber = `NB${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
  }
})

orderSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model("Order", orderSchema)