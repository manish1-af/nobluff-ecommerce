import test from "node:test"
import assert from "node:assert/strict"
import { calculateOrderTotals, canTransitionOrder } from "../src/utils/orderWorkflow.js"

test("order lifecycle permits only the intended COD transitions", () => {
  assert.equal(canTransitionOrder("pending", "accepted"), true)
  assert.equal(canTransitionOrder("pending", "rejected"), true)
  assert.equal(canTransitionOrder("accepted", "processing"), true)
  assert.equal(canTransitionOrder("processing", "shipped"), true)
  assert.equal(canTransitionOrder("shipped", "delivered"), true)
  assert.equal(canTransitionOrder("pending", "delivered"), false)
  assert.equal(canTransitionOrder("delivered", "cancelled"), false)
})

test("COD totals derive from validated item prices and quantities", () => {
  assert.deepEqual(
    calculateOrderTotals([{ price: 1890, quantity: 2 }, { price: 890, quantity: 1 }], 0),
    { subtotal: 4670, shippingFee: 0, totalAmount: 4670 },
  )
})