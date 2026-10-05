import User from "../models/User.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { clearAuthCookie, createToken, setAuthCookie } from "../utils/generateToken.js"

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role }
}

export const register = asyncHandler(async (request, response) => {
  const { name, email, password } = request.body
  const user = await User.create({ name, email, password, role: "customer" })
  setAuthCookie(response, createToken(user._id))
  response.status(201).json({ success: true, data: { user: publicUser(user) } })
})

export const login = asyncHandler(async (request, response) => {
  const user = await User.findOne({ email: request.body.email }).select("+password")
  if (!user || !(await user.comparePassword(request.body.password))) {
    return response.status(401).json({ success: false, message: "Email or password is incorrect" })
  }

  setAuthCookie(response, createToken(user._id))
  response.json({ success: true, data: { user: publicUser(user) } })
})

export const getCurrentUser = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { user: publicUser(request.user) } })
})

export function logout(request, response) {
  clearAuthCookie(response)
  response.json({ success: true, data: { message: "Signed out" } })
}