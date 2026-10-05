import Product from "../models/Product.js"
import { isCloudinaryConfigured, uploadProductImage } from "../config/cloudinary.js"
import { asyncHandler } from "../utils/asyncHandler.js"

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function prepareProduct(body) {
  const payload = { ...body }
  if (payload.image && !payload.images) payload.images = [{ url: payload.image }]
  delete payload.image
  if (payload.name && !payload.slug) payload.slug = slugify(payload.name)
  return payload
}

export const listProducts = asyncHandler(async (request, response) => {
  const page = Math.max(1, Number(request.query.page) || 1)
  const limit = Math.min(60, Math.max(1, Number(request.query.limit) || 24))
  const filter = { isActive: true }
  if (request.query.category) filter.category = String(request.query.category)
  if (request.query.size) filter.sizes = String(request.query.size)
  if (request.query.color) filter.colors = String(request.query.color)
  if (request.query.minPrice || request.query.maxPrice) {
    filter.price = {}
    if (request.query.minPrice) filter.price.$gte = Math.max(0, Number(request.query.minPrice) || 0)
    if (request.query.maxPrice) filter.price.$lte = Math.max(0, Number(request.query.maxPrice) || 0)
  }
  if (request.query.search) {
    const escaped = String(request.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    filter.$or = [{ name: new RegExp(escaped, "i") }, { description: new RegExp(escaped, "i") }]
  }

  const sortFields = { price: "price", name: "name", newest: "createdAt" }
  const sortField = sortFields[String(request.query.sort)] || "createdAt"
  const direction = request.query.direction === "asc" ? 1 : -1
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ [sortField]: direction }).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ])
  response.json({ success: true, data: { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
})

export const getProduct = asyncHandler(async (request, response) => {
  const product = await Product.findOne({ _id: request.params.id, isActive: true })
  if (!product) return response.status(404).json({ success: false, message: "Product not found" })
  response.json({ success: true, data: { product } })
})

export const getProductBySlug = asyncHandler(async (request, response) => {
  const product = await Product.findOne({ slug: request.params.slug, isActive: true })
  if (!product) return response.status(404).json({ success: false, message: "Product not found" })
  response.json({ success: true, data: { product } })
})

export const createProduct = asyncHandler(async (request, response) => {
  const product = await Product.create(prepareProduct(request.body))
  response.status(201).json({ success: true, data: { product } })
})

export const updateProduct = asyncHandler(async (request, response) => {
  const changes = prepareProduct(request.body)
  if (changes.name && !changes.slug) changes.slug = slugify(changes.name)
  const product = await Product.findByIdAndUpdate(request.params.id, changes, {
    new: true,
    runValidators: true,
  })
  if (!product) return response.status(404).json({ success: false, message: "Product not found" })
  response.json({ success: true, data: { product } })
})

export const deleteProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(request.params.id, { isActive: false }, { new: true })
  if (!product) return response.status(404).json({ success: false, message: "Product not found" })
  response.json({ success: true, data: { product } })
})

export const uploadImage = asyncHandler(async (request, response) => {
  if (!isCloudinaryConfigured()) {
    return response.status(503).json({ success: false, message: "Image uploads are not configured" })
  }
  if (!request.file) return response.status(400).json({ success: false, message: "Choose an image to upload" })
  const image = await uploadProductImage(request.file.buffer)
  response.status(201).json({ success: true, data: { image } })
})