import Cart from "../models/Cart.js"
import Product from "../models/Product.js"
import { asyncHandler } from "../utils/asyncHandler.js"

async function populatedCart(userId) {
  let cart = await Cart.findOne({ userId }).populate("items.productId")
  if (!cart) cart = await Cart.create({ userId, items: [] })
  return cart
}

export const getCart = asyncHandler(async (request, response) => {
  const cart = await populatedCart(request.user._id)
  let changed = false
  for (const item of [...cart.items]) {
    const product = item.productId
    if (!product || !product.isActive) {
      item.deleteOne()
      changed = true
    } else if (item.price !== product.price) {
      item.price = product.price
      changed = true
    }
  }
  if (changed) await cart.save()
  await cart.populate("items.productId")
  response.json({ success: true, data: { cart } })
})

export const addCartItem = asyncHandler(async (request, response) => {
  const { productId, quantity, selectedSize = "", selectedColor = "" } = request.body
  const product = await Product.findOne({ _id: productId, isActive: true })
  if (!product) return response.status(404).json({ success: false, message: "Product is unavailable" })

  if (product.stock < quantity) {
    return response.status(409).json({ success: false, message: "Requested quantity exceeds available stock" })
  }
  if (selectedSize && product.sizes.length && !product.sizes.includes(selectedSize)) {
    return response.status(400).json({ success: false, message: "Selected size is not available" })
  }
  if (selectedColor && product.colors.length && !product.colors.includes(selectedColor)) {
    return response.status(400).json({ success: false, message: "Selected color is not available" })
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: request.user._id },
    { $setOnInsert: { userId: request.user._id }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true },
  )
  const existing = cart.items.find((item) =>
    String(item.productId) === String(product._id) &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor,
  )
  const resultingQuantity = quantity + (existing?.quantity || 0)
  if (resultingQuantity > product.stock) {
    return response.status(409).json({ success: false, message: "Requested quantity exceeds available stock" })
  }
  if (existing) {
    existing.quantity = resultingQuantity
    existing.price = product.price
  } else {
    cart.items.push({ productId: product._id, quantity, selectedSize, selectedColor, price: product.price })
  }
  await cart.save()
  await cart.populate("items.productId")
  response.status(200).json({ success: true, data: { cart } })
})

export const updateCartItem = asyncHandler(async (request, response) => {
  const cart = await Cart.findOne({ userId: request.user._id })
  const item = cart?.items.id(request.params.itemId)
  if (!item) return response.status(404).json({ success: false, message: "Cart item not found" })
  const product = await Product.findOne({ _id: item.productId, isActive: true })
  if (!product) return response.status(404).json({ success: false, message: "Product is unavailable" })
  if (request.body.quantity > product.stock) {
    return response.status(409).json({ success: false, message: "Requested quantity exceeds available stock" })
  }
  item.quantity = request.body.quantity
  item.price = product.price
  await cart.save()
  await cart.populate("items.productId")
  response.json({ success: true, data: { cart } })
})

export const removeCartItem = asyncHandler(async (request, response) => {
  const cart = await Cart.findOne({ userId: request.user._id })
  const item = cart?.items.id(request.params.itemId)
  if (!item) return response.status(404).json({ success: false, message: "Cart item not found" })
  item.deleteOne()
  await cart.save()
  await cart.populate("items.productId")
  response.json({ success: true, data: { cart } })
})

export const clearCart = asyncHandler(async (request, response) => {
  const cart = await Cart.findOneAndUpdate(
    { userId: request.user._id },
    { $set: { items: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  response.json({ success: true, data: { cart } })
})