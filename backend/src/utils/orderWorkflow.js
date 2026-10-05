export const allowedTransitions = {
  pending: ["accepted", "rejected"],
  accepted: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  rejected: [],
  delivered: [],
  cancelled: [],
}

export function canTransitionOrder(from, to) {
  return allowedTransitions[from]?.includes(to) ?? false
}

export function calculateOrderTotals(items, shippingFee = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return { subtotal, shippingFee, totalAmount: subtotal + shippingFee }
}