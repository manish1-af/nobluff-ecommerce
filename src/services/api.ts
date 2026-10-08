function normalizeApiBase(value: string | undefined) {
  const base = (value || "http://localhost:5000/api").replace(/\/$/, "")
  return new URL(base).pathname === "/" ? `${base}/api` : base
}

const apiBase = normalizeApiBase(import.meta.env.VITE_API_URL)

type ApiEnvelope<T> = { success: true; data: T } | { success: false; message: string }

export type ApiUser = {
  id: string
  name: string
  email: string
  phone: string
  role: "customer" | "admin"
}

export type ApiProduct = {
  _id: string
  slug: string
  name: string
  description: string
  price: number
  compareAtPrice: number | null
  images: { url: string; publicId?: string }[]
  category: string
  sizes: string[]
  colors: string[]
  stock: number
  isActive: boolean
}

export type ApiCategoryTile = {
  id: number
  name: string
  note: string
  filter: string
  image: string
}

export type ApiBrandImage = {
  id: string
  url: string
}

export type ApiCartItem = {
  _id: string
  productId: ApiProduct
  quantity: number
  selectedSize: string
  selectedColor: string
  price: number
}

export type ApiOrder = {
  _id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  items: {
    productId: string
    name: string
    image: string
    quantity: number
    selectedSize: string
    selectedColor: string
    price: number
  }[]
  shippingAddress: { line1: string; city: string; postalCode: string; country: string }
  phone: string
  note: string
  subtotal: number
  shippingFee: number
  totalAmount: number
  status: "pending" | "accepted" | "rejected" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  adminNote: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })
  const envelope = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.success ? "The request failed" : envelope.message)
  }
  return envelope.data
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: ApiUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<{ user: ApiUser }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  me: () => request<{ user: ApiUser }>("/auth/me"),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
}

export const productApi = {
  list: () => request<{ products: ApiProduct[]; pagination: { page: number; limit: number; total: number; pages: number } }>("/products?limit=60"),
  create: (product: Record<string, unknown>) =>
    request<{ product: ApiProduct }>("/products", { method: "POST", body: JSON.stringify(product) }),
  update: (id: string, product: Record<string, unknown>) =>
    request<{ product: ApiProduct }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) }),
  uploadImage: async (file: File) => {
    const form = new FormData()
    form.append("image", file)
    return request<{ image: { url: string; publicId: string } }>("/products/image-upload", { method: "POST", body: form })
  },
}

export const storefrontApi = {
  get: () => request<{
    categoryTiles: ApiCategoryTile[] | null
    brandImages: ApiBrandImage[] | null
    welcomeHeroImage?: string | null
  }>("/storefront"),
  update: (settings: {
    categoryTiles?: ApiCategoryTile[]
    brandImages?: ApiBrandImage[]
    welcomeHeroImage?: string
  }) => request<{
    categoryTiles: ApiCategoryTile[] | null
    brandImages: ApiBrandImage[] | null
    welcomeHeroImage?: string | null
  }>("/storefront", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),
}

export const cartApi = {
  get: () => request<{ cart: { items: ApiCartItem[] } }>("/cart"),
  add: (productId: string, selectedSize: string, selectedColor: string) =>
    request<{ cart: { items: ApiCartItem[] } }>("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1, selectedSize, selectedColor }),
    }),
  update: (itemId: string, quantity: number) =>
    request<{ cart: { items: ApiCartItem[] } }>(`/cart/${itemId}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  remove: (itemId: string) =>
    request<{ cart: { items: ApiCartItem[] } }>(`/cart/${itemId}`, { method: "DELETE" }),
  clear: () => request<{ cart: { items: ApiCartItem[] } }>("/cart", { method: "DELETE" }),
}

export const orderApi = {
  submit: (details: {
    customerName: string
    phone: string
    note: string
    shippingAddress: { line1: string; city: string; postalCode: string; country: string }
  }) => request<{ order: ApiOrder }>("/orders", { method: "POST", body: JSON.stringify(details) }),
  mine: () => request<{ orders: ApiOrder[] }>("/orders"),
  adminList: () => request<{ orders: ApiOrder[] }>("/admin/orders"),
  adminUpdate: (id: string, status: ApiOrder["status"]) => {
    if (status === "accepted" || status === "rejected") {
      const action = status === "accepted" ? "accept" : "reject"
      return request<{ order: ApiOrder }>(`/admin/orders/${id}/${action}`, { method: "PATCH", body: JSON.stringify({}) })
    }
    return request<{ order: ApiOrder }>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  },
}
