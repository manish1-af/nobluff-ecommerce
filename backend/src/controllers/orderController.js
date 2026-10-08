import mongoose from "mongoose"
import Cart from "../models/Cart.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { calculateOrderTotals, canTransitionOrder } from "../utils/orderWorkflow.js"

function orderShippingFee() {
  const fee = Number(process.env.SHIPPING_FEE || 0)
  return Number.isFinite(fee) && fee >= 0 ? fee : 0
}

export const createOrder = asyncHandler(async (request, response) => {
  const session = await mongoose.startSession()
  let createdOrder

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId: request.user._id }).populate("items.productId").session(session)
      if (!cart?.items.length) {
        const error = new Error("Your cart is empty")
        error.status = 400
        throw error
      }

      const orderItems = []
      for (const cartItem of cart.items) {
        const product = await Product.findOne({ _id: cartItem.productId?._id, isActive: true }).session(session)
        if (!product) {
          const error = new Error("A product in your cart is no longer available")
          error.status = 409
          throw error
        }
        if (cartItem.quantity > product.stock) {
          const error = new Error(`${product.name} no longer has enough stock`)
          error.status = 409
          throw error
        }
        orderItems.push({
          productId: product._id,
          name: product.name,
          image: product.images[0]?.url || "",
          quantity: cartItem.quantity,
          selectedSize: cartItem.selectedSize,
          selectedColor: cartItem.selectedColor,
          price: product.price,
        })
      }

      const shippingFee = orderShippingFee()
      const totals = calculateOrderTotals(orderItems, shippingFee)
      ;[createdOrder] = await Order.create(
        [{
          userId: request.user._id,
          customerName: request.body.customerName || request.user.name,
          customerEmail: request.user.email,
          phone: request.body.phone,
          shippingAddress: request.body.shippingAddress,
          note: request.body.note || "",
          items: orderItems,
          ...totals,
          paymentMethod: "COD",
          status: "pending",
        }],
        { session },
      )
      cart.items = []
      await cart.save({ session })
    })
  } finally {
    await session.endSession()
  }

  response.status(201).json({ success: true, data: { order: createdOrder } })
})

export const listMyOrders = asyncHandler(async (request, response) => {
  const orders = await Order.find({ userId: request.user._id }).sort({ createdAt: -1 })
  response.json({ success: true, data: { orders } })
})

export const listAdminOrders = asyncHandler(async (request, response) => {
  const filter = {}
  if (request.query.status) filter.status = request.query.status
  const orders = await Order.find(filter).populate("userId", "name email phone").sort({ createdAt: -1 }).limit(200)
  response.json({ success: true, data: { orders } })
})

export const getAdminOrder = asyncHandler(async (request, response) => {
  const order = await Order.findById(request.params.id).populate("userId", "name email phone")
  if (!order) return response.status(404).json({ success: false, message: "Order not found" })
  response.json({ success: true, data: { order } })
})

export const acceptOrder = asyncHandler(async (request, response) => {
  const session = await mongoose.startSession()
  let updatedOrder
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: request.params.id, status: "pending" }).session(session)
      if (!order) {
        const error = new Error("Only pending orders can be accepted")
        error.status = 409
        throw error
      }
      for (const item of order.items) {
        const result = await Product.updateOne(
          { _id: item.productId, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        )
        if (!result.modifiedCount) {
          const error = new Error(`Insufficient stock for ${item.name}`)
          error.status = 409
          throw error
        }
      }
      order.status = "accepted"
      if (request.body.adminNote !== undefined) order.adminNote = request.body.adminNote
      await order.save({ session })
      updatedOrder = order
    })
  } finally {
    await session.endSession()
  }
  response.json({ success: true, data: { order: updatedOrder } })
})

export const rejectOrder = asyncHandler(async (request, response) => {
  const order = await Order.findOneAndUpdate(
    { _id: request.params.id, status: "pending" },
    { $set: { status: "rejected", ...(request.body.adminNote !== undefined ? { adminNote: request.body.adminNote } : {}) } },
    { new: true, runValidators: true },
  )
  if (!order) return response.status(409).json({ success: false, message: "Only pending orders can be rejected" })
  response.json({ success: true, data: { order } })
})

export const updateOrderStatus = asyncHandler(async (request, response) => {
  const session = await mongoose.startSession()
  let updatedOrder
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(request.params.id).session(session)
      if (!order) {
        const error = new Error("Order not found")
        error.status = 404
        throw error
      }
      const nextStatus = request.body.status
      if (!canTransitionOrder(order.status, nextStatus)) {
        const error = new Error(`Cannot move an order from ${order.status} to ${nextStatus}`)
        error.status = 409
        throw error
      }
      if (nextStatus === "cancelled") {
        for (const item of order.items) {
          await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session })
        }
      }
      order.status = nextStatus
      if (request.body.adminNote !== undefined) order.adminNote = request.body.adminNote
      await order.save({ session })
      updatedOrder = order
    })
  } finally {
    await session.endSession()
  }
  response.json({ success: true, data: { order: updatedOrder } })
})

export const cancelMyOrder = asyncHandler(async (request, response) => {
  const session = await mongoose.startSession()
  let updatedOrder
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: request.params.id,
        userId: request.user._id,
      }).session(session)

      if (!order) {
        const error = new Error("Order not found")
        error.status = 404
        throw error
      }

      if (order.status !== "pending" && order.status !== "accepted") {
        const error = new Error(`Order cannot be cancelled in '${order.status}' status`)
        error.status = 409
        throw error
      }

      if (order.status === "accepted") {
        for (const item of order.items) {
          await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session })
        }
      }

      order.status = "cancelled"
      await order.save({ session })
      updatedOrder = order
    })
  } finally {
    await session.endSession()
  }
  response.json({ success: true, data: { order: updatedOrder } })
})