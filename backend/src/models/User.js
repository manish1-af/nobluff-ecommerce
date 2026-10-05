import bcrypt from "bcryptjs"
import mongoose from "mongoose"

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    line1: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 12 },
    country: { type: String, trim: true, maxlength: 80, default: "India" },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true },
)

userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12)
  }
})

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)