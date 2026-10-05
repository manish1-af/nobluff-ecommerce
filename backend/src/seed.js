import "dotenv/config"
import mongoose from "mongoose"
import { connectDatabase } from "./config/db.js"
import Product from "./models/Product.js"
import User from "./models/User.js"

const products = [
  { name: "Drift Overshirt", slug: "drift-overshirt", category: "Shirts", price: 1890, compareAtPrice: 2363, colors: ["Clay"], sizes: ["S", "M", "L", "XL"], stock: 12, images: [{ url: "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=900&q=85" }] },
  { name: "Studio Trench", slug: "studio-trench", category: "Outerwear", price: 3290, compareAtPrice: 3871, colors: ["Oat"], sizes: ["S", "M", "L", "XL"], stock: 8, images: [{ url: "https://images.unsplash.com/photo-1619603364904-c0498317e145?auto=format&fit=crop&w=900&q=85" }] },
  { name: "Quiet Knit", slug: "quiet-knit", category: "Knitwear", price: 1590, compareAtPrice: 2120, colors: ["Stone"], sizes: ["S", "M", "L", "XL"], stock: 10, images: [{ url: "https://images.unsplash.com/photo-1719417657786-032541528328?auto=format&fit=crop&w=900&q=85" }] },
  { name: "After Hours Coat", slug: "after-hours-coat", category: "Outerwear", price: 3890, compareAtPrice: 4322, colors: ["Charcoal"], sizes: ["S", "M", "L", "XL"], stock: 5, images: [{ url: "https://images.unsplash.com/photo-1719418271955-79273259772d?auto=format&fit=crop&w=900&q=85" }] },
  { name: "Sunday Blazer", slug: "sunday-blazer", category: "Jackets", price: 2790, compareAtPrice: 3402, colors: ["Cocoa"], sizes: ["S", "M", "L", "XL"], stock: 7, images: [{ url: "https://images.unsplash.com/photo-1575863061865-8e152c7166fa?auto=format&fit=crop&w=900&q=85" }] },
  { name: "Soft Form Scarf", slug: "soft-form-scarf", category: "Accessories", price: 890, compareAtPrice: 1011, colors: ["Sand"], sizes: ["One size"], stock: 20, images: [{ url: "https://images.unsplash.com/photo-1738179606965-d9a729cf3a0a?auto=format&fit=crop&w=900&q=85" }] },
]

try {
  if (process.env.NODE_ENV === "production") throw new Error("The development seed is disabled in production")
  if (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD to a development-only password of at least 12 characters")
  }
  await connectDatabase()
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@nobluff.in").toLowerCase()
  if (!(await User.exists({ email: adminEmail }))) {
    await User.create({
      name: "Store Admin",
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: "admin",
    })
  }
  for (const product of products) {
    await Product.updateOne({ slug: product.slug }, { $setOnInsert: product }, { upsert: true })
  }
  console.info("Development admin and sample products are ready")
} finally {
  await mongoose.disconnect()
}