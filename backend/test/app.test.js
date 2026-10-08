import assert from "node:assert/strict"
import { once } from "node:events"
import test from "node:test"
import app, { isOriginAllowed } from "../src/app.js"

test("CORS allows configured frontend origins and No Bluff Vercel previews", () => {
  process.env.CLIENT_URL = "https://shop.nobluff.in, https://example.com/"

  assert.equal(isOriginAllowed("https://shop.nobluff.in"), true)
  assert.equal(isOriginAllowed("https://example.com"), true)
  assert.equal(isOriginAllowed("https://nobluff-ecommerce.vercel.app"), true)
  assert.equal(isOriginAllowed("https://nobluff-ecommerce-h54dgwitb-manish1-afs-projects.vercel.app"), true)
  assert.equal(isOriginAllowed("https://nobluff-ecommerce-preview-team.vercel.app"), true)
  assert.equal(isOriginAllowed("https://unrelated.vercel.app"), false)
})

test("API health, missing routes, and protected routes return consistent responses", async () => {
  process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters"
  const server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    const health = await fetch(`${baseUrl}/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { status: "ok" })

    const headHealth = await fetch(`${baseUrl}/health`, { method: "HEAD" })
    assert.equal(headHealth.status, 200)
    assert.equal(await headHealth.text(), "")

    const rootHealth = await fetch(`${baseUrl}/`)
    assert.equal(rootHealth.status, 200)
    assert.deepEqual(await rootHealth.json(), { status: "ok" })

    const headRoot = await fetch(`${baseUrl}/`, { method: "HEAD" })
    assert.equal(headRoot.status, 200)
    assert.equal(await headRoot.text(), "")

    const apiHealth = await fetch(`${baseUrl}/api/health`)
    assert.equal(apiHealth.status, 200)
    assert.deepEqual(await apiHealth.json(), { success: true, data: { status: "ok" } })

    const headApiHealth = await fetch(`${baseUrl}/api/health`, { method: "HEAD" })
    assert.equal(headApiHealth.status, 200)
    assert.equal(await headApiHealth.text(), "")

    const missing = await fetch(`${baseUrl}/api/not-a-route`)
    assert.equal(missing.status, 404)
    assert.deepEqual(await missing.json(), { success: false, message: "Resource not found" })

    for (const path of ["/api/cart", "/api/admin/orders"]) {
      const response = await fetch(`${baseUrl}${path}`)
      assert.equal(response.status, 401)
      assert.deepEqual(await response.json(), { success: false, message: "Authentication required" })
    }

    const protectedStorefrontUpdate = await fetch(`${baseUrl}/api/storefront`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandImages: [] }),
    })
    assert.equal(protectedStorefrontUpdate.status, 401)
    assert.deepEqual(await protectedStorefrontUpdate.json(), {
      success: false,
      message: "Authentication required",
    })

    for (const path of ["/auth/me", "/cart", "/admin/orders"]) {
      const response = await fetch(`${baseUrl}${path}`)
      assert.equal(response.status, 401)
      assert.deepEqual(await response.json(), { success: false, message: "Authentication required" })
    }

    const invalidSession = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: "Bearer abc.def.ghi" },
    })
    assert.equal(invalidSession.status, 401)
    assert.deepEqual(await invalidSession.json(), { success: false, message: "Invalid or expired session" })

    const invalidRegistration = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A User", email: "user@example.com", password: "short" }),
    })
    assert.equal(invalidRegistration.status, 400)
    assert.equal((await invalidRegistration.json()).success, false)
  } finally {
    server.closeAllConnections()
    server.close()
    await once(server, "close")
  }
})
