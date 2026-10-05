import {
  CSSProperties,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react"
import {
  ApiCartItem,
  ApiOrder,
  ApiProduct,
  authApi,
  cartApi,
  orderApi,
  productApi,
} from "./services/api"
import logoSource from "./assets/no-bluff-logo-source.jpeg"
import founderImage from "./assets/no-bluff-founder.png"
import charlieLogo from "./assets/brands/charlie.jpeg"
import citrusLogo from "./assets/brands/citrus.jpeg"
import devisLogo from "./assets/brands/devis-jeans.png"
import sanskaramLogo from "./assets/brands/sanskaram.jpeg"
import technosportLogo from "./assets/brands/technosport.jpeg"
import zeelLogo from "./assets/brands/zeel.png"

type Product = {
  id: string
  name: string
  category: string
  price: number
  discount?: number
  image: string
  color: string
  badge?: string
  stock?: number
  sizes?: string[]
}

type CartItem = Product & { cartItemId: string; quantity: number; size: string }

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: "customer" | "admin"
}

type OrderStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"

type Order = {
  id: string
  apiId: string
  customer: string
  email: string
  phone: string
  address: string
  city: string
  pin: string
  note: string
  items: CartItem[]
  total: number
  status: OrderStatus
  createdAt: string
}

type CustomerRecord = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pin: string
  orderCount: number
  totalSpend: number
  latestOrder: string
  status: OrderStatus
}

type CategoryTile = {
  id: number
  name: string
  note: string
  filter: string
  image: string
}

type BrandLogo = {
  id: string
  name: string
  image: string
  className: string
}

function mapProduct(product: ApiProduct): Product {
  return {
    id: product._id,
    name: product.name,
    category: product.category,
    price: product.price,
    discount: product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0,
    color: product.colors[0] || "",
    image: product.images[0]?.url || "",
    stock: product.stock,
    sizes: product.sizes,
  }
}

function mapCart(items: ApiCartItem[]): CartItem[] {
  return items.filter((item) => item.productId).map((item) => ({
    ...mapProduct(item.productId),
    cartItemId: item._id,
    quantity: item.quantity,
    size: item.selectedSize,
    color: item.selectedColor || item.productId.colors[0] || "",
    price: item.price,
  }))
}

function mapOrderStatus(status: ApiOrder["status"]): OrderStatus {
  const labels: Record<ApiOrder["status"], OrderStatus> = {
    pending: "Pending",
    accepted: "Approved",
    rejected: "Rejected",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }
  return labels[status]
}

function mapOrder(order: ApiOrder): Order {
  return {
    id: order.orderNumber,
    apiId: order._id,
    customer: order.customerName,
    email: order.customerEmail,
    phone: order.phone,
    address: order.shippingAddress.line1,
    city: order.shippingAddress.city,
    pin: order.shippingAddress.postalCode,
    note: order.note,
    items: order.items.map((item, index) => ({
      id: item.productId,
      cartItemId: `${order._id}-${index}`,
      name: item.name,
      category: "",
      price: item.price,
      image: item.image,
      color: item.selectedColor,
      quantity: item.quantity,
      size: item.selectedSize,
    })),
    total: order.totalAmount,
    status: mapOrderStatus(order.status),
    createdAt: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(order.createdAt)),
  }
}

const visualCategories: CategoryTile[] = [
  {
    id: 1,
    name: "Ethnic Wear",
    note: "Festive silhouettes",
    filter: "All",
    image:
      "https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 2,
    name: "Casual Wear",
    note: "Relaxed everyday fits",
    filter: "Shirts",
    image:
      "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 3,
    name: "Activewear",
    note: "Made to move",
    filter: "All",
    image:
      "https://images.unsplash.com/photo-1648132907626-e705f96e5513?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 4,
    name: "Western Wear",
    note: "Modern statements",
    filter: "Jackets",
    image:
      "https://images.unsplash.com/photo-1540827109409-17f40944f276?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 5,
    name: "Outerwear",
    note: "Layers with presence",
    filter: "Outerwear",
    image:
      "https://images.unsplash.com/photo-1615222443417-6d76586644a9?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 6,
    name: "Accessories",
    note: "The finishing touch",
    filter: "Accessories",
    image:
      "https://images.unsplash.com/photo-1738179606965-d9a729cf3a0a?auto=format&fit=crop&w=700&q=85",
  },
]

const initialBrandLogos: BrandLogo[] = [
  { id: "citrus", name: "Citrus", image: citrusLogo, className: "brand-citrus" },
  { id: "devis", name: "Devis Jeans", image: devisLogo, className: "brand-devis" },
  { id: "technosport", name: "Technosport", image: technosportLogo, className: "brand-technosport" },
  { id: "sanskaram", name: "Sanskaram", image: sanskaramLogo, className: "brand-sanskaram" },
  { id: "charlie", name: "Charlie", image: charlieLogo, className: "brand-charlie" },
  { id: "zeel", name: "Zeel", image: zeelLogo, className: "brand-zeel" },
]

// Kept as a compatibility seed for in-flight React Refresh renders.
const brandLogos = initialBrandLogos

const iconPaths: Record<string, ReactNode> = {
  bag: (
    <>
      <path d="M6.5 8.5h11l1 12h-13l1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  trash: (
    <>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  box: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4v10l-8 4-8-4V7ZM12 11v10" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.4 2.8 8.3 7 10 4.2-1.7 7-5.6 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 8h16M4 16h16" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  crown: (
    <>
      <path d="m4 8 4 4 4-7 4 7 4-4-2 10H6L4 8Z" />
      <path d="M6 21h12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />,
  logout: (
    <>
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </>
  ),
}

function Icon({
  name,
  size = 20,
}: {
  name: keyof typeof iconPaths
  size?: number
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "icon"
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="No Bluff home">
      <span className="logo-mark">
        <img src={logoSource} alt="NB No Bluff Clothing Outlet" />
      </span>
    </a>
  )
}

function WelcomePage({
  onStart,
  brands = brandLogos,
}: {
  onStart: () => void
  brands?: BrandLogo[]
}) {
  const displayedBrands = Array.isArray(brands) ? brands : brandLogos

  return (
    <main className="welcome-page founder-welcome-page">
      <section className="founder-bleed">
        <img
          className="founder-bleed-image"
          src={founderImage}
          alt="Rajat Gupta, founder of No Bluff"
        />
        <div className="founder-bleed-shade" />
        <header className="founder-bleed-header">
          <Logo />
          <span>CLOTHES THAT SPEAK · AKHNOOR</span>
        </header>
        <div className="founder-bleed-copy">
          <p className="eyebrow">THE FOUNDER’S EDIT</p>
          <h1>
            Simple by choice.
            <br />
            <em>Original by nature.</em>
          </h1>
          <p>
            Premium everyday clothing for people who value quality without the
            noise.
          </p>
          <Button onClick={onStart}>
            Enter the shop <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="founder-bleed-signature">
          <strong>Rajat Gupta</strong>
          <span>Founder · No Bluff</span>
        </div>
      </section>
      <section className="brand-marquee" aria-label="Brands available at No Bluff">
        <div className="brand-marquee-label">
          <small>OUR BRAND SHELF</small>
          <strong>Labels in store</strong>
        </div>
        <div className="brand-marquee-window">
          <div className="brand-marquee-track">
            {[...displayedBrands, ...displayedBrands].map((brand, index) => (
              <figure
                className={`brand-logo-card ${brand.className}`}
                key={`${brand.name}-${index}`}
                aria-hidden={index >= displayedBrands.length}
              >
                <img
                  src={brand.image}
                  alt={index < displayedBrands.length ? brand.name : ""}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function AuthPage({
  onBack,
  onAuthenticated,
}: {
  onBack: () => void
  onAuthenticated: (user: User) => void
}) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [error, setError] = useState("")

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email")).trim().toLowerCase()
    const password = String(data.get("password"))
    const name = String(data.get("name") || email.split("@")[0])

    setError("")
    try {
      const result = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password)
      await onAuthenticated(result.user)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in")
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <Logo />
        <div>
          <p className="eyebrow">YOUR EVERYDAY EDIT</p>
          <h1>
            Come for the fit.
            <br />
            <em>Stay for the feeling.</em>
          </h1>
        </div>
        <p>Premium brands · Better style · Same vibe</p>
      </div>
      <section className="auth-panel">
        <Button variant="ghost" className="back-button" onClick={onBack}>
          ← Back
        </Button>
        <div className="auth-box">
          <p className="eyebrow">
            {mode === "login" ? "WELCOME BACK" : "JOIN THE CLUB"}
          </p>
          <h2>{mode === "login" ? "Sign in to continue." : "Create your account."}</h2>
          <p className="auth-intro">
            {mode === "login"
              ? "Your bag, requests, and new arrivals are waiting."
              : "Save your details and make cash-on-delivery requests in seconds."}
          </p>
          <div className="auth-tabs">
            <Button
              variant="ghost"
              className={mode === "login" ? "auth-tab-active" : ""}
              onClick={() => {
                setMode("login")
                setError("")
              }}
            >
              Login
            </Button>
            <Button
              variant="ghost"
              className={mode === "signup" ? "auth-tab-active" : ""}
              onClick={() => {
                setMode("signup")
                setError("")
              }}
            >
              Sign up
            </Button>
          </div>
          <form onSubmit={handleAuth}>
            {mode === "signup" && (
              <Field label="Full name">
                <input name="name" required placeholder="Your full name" />
              </Field>
            )}
            <Field label="Email address">
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : 1}
                placeholder="At least 8 characters"
              />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <Button className="full-button" type="submit">
              {mode === "login" ? "Login" : "Create account"}
              <Icon name="arrow" size={18} />
            </Button>
          </form>
          <div className="admin-demo">
            <span>STORE ADMIN</span>
            <p>Admin access is managed by your store.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

function AdminPage({
  orders,
  products,
  categoryTiles,
  brandLogos,
  onUpdateOrder,
  onAddProduct,
  onAddCategory,
  onRemoveCategory,
  onUpdateBrand,
  onLogout,
}: {
  orders: Order[]
  products: Product[]
  categoryTiles: CategoryTile[]
  brandLogos: BrandLogo[]
  onUpdateOrder: (id: string, status: OrderStatus) => Promise<void>
  onAddProduct: (product: Product, imageFile?: File) => Promise<void>
  onAddCategory: (category: CategoryTile) => void
  onRemoveCategory: (id: number) => void
  onUpdateBrand: (id: string, image: string) => void
  onLogout: () => void
}) {
  const [activeSection, setActiveSection] = useState<
    "orders" | "products" | "customers"
  >("orders")
  const [filter, setFilter] = useState<"All" | OrderStatus>("All")
  const [productOpen, setProductOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<BrandLogo | null>(null)
  const visible =
    filter === "All" ? orders : orders.filter((order) => order.status === filter)
  const revenue = orders
    .filter((order) => order.status !== "Pending")
    .reduce((sum, order) => sum + order.total, 0)
  const customers = new Set(orders.map((order) => order.email)).size
  const customerRecords = Array.from(
    orders
      .reduce<Map<string, CustomerRecord>>((records, order) => {
        const current = records.get(order.email)
        if (current) {
          current.orderCount += 1
          current.totalSpend += order.total
        } else {
          records.set(order.email, {
            name: order.customer,
            email: order.email,
            phone: order.phone,
            address: order.address,
            city: order.city,
            pin: order.pin,
            orderCount: 1,
            totalSpend: order.total,
            latestOrder: order.id,
            status: order.status,
          })
        }
        return records
      }, new Map())
      .values(),
  )
  const sectionCopy = {
    orders: {
      title: "Order command center.",
      description: "Approve COD requests and follow every delivery.",
    },
    products: {
      title: "Catalog & storefront.",
      description: "Manage products, category tiles, and moving brand logos.",
    },
    customers: {
      title: "Customer directory.",
      description: "See every customer, their contact details, and order history.",
    },
  }[activeSection]

  function nextAction(order: Order) {
    if (order.status === "Pending") {
      return (
        <>
          <Button onClick={() => void onUpdateOrder(order.id, "Approved")}>
            Approve order <Icon name="check" size={17} />
          </Button>
          <Button variant="soft" onClick={() => void onUpdateOrder(order.id, "Rejected")}>
            Reject request
          </Button>
        </>
      )
    }
    if (order.status === "Approved") {
      return (
        <Button onClick={() => void onUpdateOrder(order.id, "Processing")}>
          Start processing <Icon name="box" size={17} />
        </Button>
      )
    }
    if (order.status === "Processing") {
      return (
        <Button onClick={() => void onUpdateOrder(order.id, "Shipped")}>
          Send for delivery <Icon name="truck" size={17} />
        </Button>
      )
    }
    if (order.status === "Shipped") {
      return (
        <Button onClick={() => void onUpdateOrder(order.id, "Delivered")}>
          Mark delivered <Icon name="box" size={17} />
        </Button>
      )
    }
    return <span className="complete-label"><Icon name="check" size={16} /> Completed</span>
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const file = data.get("file")
    await onAddProduct({
      id: "",
      name: String(data.get("name")),
      category: String(data.get("category")),
      price: Number(data.get("price")),
      discount: Number(data.get("discount")),
      color: String(data.get("color")),
      badge: "Just added",
      image:
        String(data.get("image")) ||
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",
      stock: Number(data.get("stock")),
      }, file instanceof File && file.size > 0 ? file : undefined)
    setProductOpen(false)
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onAddCategory({
      id: Date.now(),
      name: String(data.get("name")),
      note: String(data.get("note")),
      filter: String(data.get("filter")),
      image:
        String(data.get("image")) ||
        "https://images.unsplash.com/photo-1614028609503-590a6a47146a?auto=format&fit=crop&w=700&q=85",
    })
    setCategoryOpen(false)
  }

  function replaceBrandImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrand) return
    const data = new FormData(event.currentTarget)
    const file = data.get("file")
    const imageUrl = String(data.get("image") || "")

    if (file instanceof File && file.size > 0) {
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        onUpdateBrand(selectedBrand.id, String(reader.result))
        setSelectedBrand(null)
      })
      reader.readAsDataURL(file)
      return
    }

    if (imageUrl) {
      onUpdateBrand(selectedBrand.id, imageUrl)
      setSelectedBrand(null)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <div className="admin-nav">
          <Button
            variant="ghost"
            className={activeSection === "orders" ? "admin-nav-active" : ""}
            onClick={() => setActiveSection("orders")}
          >
            <Icon name="box" /> Orders
          </Button>
          <Button
            variant="ghost"
            className={activeSection === "products" ? "admin-nav-active" : ""}
            onClick={() => setActiveSection("products")}
          >
            <Icon name="bag" /> Products
          </Button>
          <Button
            variant="ghost"
            className={activeSection === "customers" ? "admin-nav-active" : ""}
            onClick={() => setActiveSection("customers")}
          >
            <Icon name="shield" /> Customers
          </Button>
        </div>
        <div className="admin-profile">
          <span>SA</span>
          <div><strong>Store Admin</strong><small>Owner access</small></div>
        </div>
        <Button variant="ghost" onClick={onLogout}>Sign out</Button>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">ADMIN ONLY</p>
            <h1>{sectionCopy.title}</h1>
            <p>{sectionCopy.description}</p>
          </div>
          <div className="admin-header-actions">
            <div className="live-pill"><i /> Store is live</div>
            {activeSection === "products" && (
              <>
                <Button variant="soft" onClick={() => setCategoryOpen(true)}>
                  <Icon name="plus" size={17} /> New category
                </Button>
                <Button onClick={() => setProductOpen(true)}>
                  <Icon name="plus" size={17} /> Add product
                </Button>
              </>
            )}
          </div>
        </header>
        <section className="stat-grid">
          <article><span>Orders</span><strong>{orders.length}</strong><small>{orders.filter((o) => o.status === "Pending").length} need approval</small></article>
          <article><span>Confirmed value</span><strong>₹{revenue.toLocaleString("en-IN")}</strong><small>Approved and in transit</small></article>
          <article><span>Customers</span><strong>{customers}</strong><small>Unique customer records</small></article>
          <article><span>Products</span><strong>{products.length}</strong><small>Live in your shop</small></article>
        </section>
        {activeSection === "products" && (
          <>
        <section className="product-manager">
          <div className="category-manager-heading">
            <div>
              <p className="eyebrow">LIVE CATALOG</p>
              <h2>Products</h2>
            </div>
            <p>{products.length} products are currently visible in the customer shop.</p>
          </div>
          <div className="admin-product-grid">
            {products.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <div className="admin-product-image">
                  <img src={product.image} alt={product.name} />
                  <span>Live</span>
                </div>
                <div>
                  <small>{product.category}</small>
                  <strong>{product.name}</strong>
                  <p>
                    {product.color} · ₹{product.price.toLocaleString("en-IN")} ·{" "}
                    {product.discount ?? 0}% off
                  </p>
                </div>
              </article>
            ))}
            <Button
              variant="ghost"
              className="new-product-card"
              onClick={() => setProductOpen(true)}
            >
              <Icon name="plus" size={24} />
              <span>Add a new product</span>
            </Button>
          </div>
        </section>
        <section className="category-manager">
          <div className="category-manager-heading">
            <div>
              <p className="eyebrow">STOREFRONT TILES</p>
              <h2>Shop categories</h2>
            </div>
            <p>Create and remove the visual category tiles customers see in the shop.</p>
          </div>
          <div className="admin-category-grid">
            {categoryTiles.map((tile) => (
              <article className="admin-category-card" key={tile.id}>
                <img src={tile.image} alt="" />
                <div>
                  <strong>{tile.name}</strong>
                  <span>{tile.note}</span>
                </div>
                <Button
                  variant="icon"
                  aria-label={`Remove ${tile.name}`}
                  onClick={() => onRemoveCategory(tile.id)}
                >
                  <Icon name="trash" size={16} />
                </Button>
              </article>
            ))}
            <Button
              variant="ghost"
              className="new-category-tile"
              onClick={() => setCategoryOpen(true)}
            >
              <Icon name="plus" size={22} />
              <span>Create a category tile</span>
            </Button>
          </div>
        </section>
        <section className="brand-manager">
          <div className="category-manager-heading">
            <div>
              <p className="eyebrow">GET STARTED STRIP</p>
              <h2>Brand images</h2>
            </div>
            <p>Replace the logos moving across the bottom of the Get Started page.</p>
          </div>
          <div className="admin-brand-grid">
            {brandLogos.map((brand) => (
              <article className={`admin-brand-card ${brand.className}`} key={brand.id}>
                <div><img src={brand.image} alt={brand.name} /></div>
                <strong>{brand.name}</strong>
                <Button variant="soft" onClick={() => setSelectedBrand(brand)}>
                  Replace image
                </Button>
              </article>
            ))}
          </div>
        </section>
          </>
        )}
        {activeSection === "customers" && (
          <section className="customer-manager">
            <div className="category-manager-heading">
              <div>
                <p className="eyebrow">CUSTOMER DATA</p>
                <h2>All customers</h2>
              </div>
              <p>{customerRecords.length} customer profiles collected from COD requests.</p>
            </div>
            <div className="customer-list">
              {customerRecords.map((customer) => (
                <article className="customer-record" key={customer.email}>
                  <div className="customer-record-head">
                    <span>
                      {customer.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <strong>{customer.name}</strong>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    </div>
                    <span className={`status status-${customer.status.toLowerCase().replace(/ /g, "-")}`}>
                      {customer.status}
                    </span>
                  </div>
                  <div className="customer-record-data">
                    <div><small>PHONE</small><a href={`tel:${customer.phone}`}>{customer.phone}</a></div>
                    <div><small>ADDRESS</small><span>{customer.address}, {customer.city} · {customer.pin}</span></div>
                    <div><small>ORDERS</small><strong>{customer.orderCount}</strong><span>Latest #{customer.latestOrder}</span></div>
                    <div><small>TOTAL VALUE</small><strong>₹{customer.totalSpend.toLocaleString("en-IN")}</strong></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeSection === "orders" && (
        <section className="orders-section">
          <div className="orders-heading">
            <div><p className="eyebrow">ORDER DESK</p><h2>Customer requests</h2></div>
            <div className="order-filters">
              {(["All", "Pending", "Approved", "Rejected", "Processing", "Shipped", "Delivered", "Cancelled"] as const).map((status) => (
                <Button key={status} variant="ghost" className={filter === status ? "filter-active" : ""} onClick={() => setFilter(status)}>{status}</Button>
              ))}
            </div>
          </div>
          <div className="order-list">
            {visible.map((order) => (
              <article className="admin-order" key={order.id}>
                <div className="order-topline">
                  <div><span className="order-id">#{order.id}</span><small>{order.createdAt}</small></div>
                  <span className={`status status-${order.status.toLowerCase().replace(/ /g, "-")}`}>{order.status}</span>
                </div>
                <div className="order-data">
                  <div className="customer-avatar">{order.customer.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                  <div><small>CUSTOMER</small><strong>{order.customer}</strong><a href={`mailto:${order.email}`}>{order.email}</a><a href={`tel:${order.phone}`}>{order.phone}</a></div>
                  <div><small>DELIVERY ADDRESS</small><strong>{order.address}</strong><span>{order.city} · {order.pin}</span>{order.note && <em>“{order.note}”</em>}</div>
                  <div><small>ORDER</small><strong>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</strong><span>{order.items.map((item) => `Size ${item.size}`).join(" · ")}</span></div>
                  <div className="order-price"><small>COD TOTAL</small><strong>₹{order.total.toLocaleString("en-IN")}</strong></div>
                </div>
                <div className="order-action">{nextAction(order)}</div>
              </article>
            ))}
          </div>
        </section>
        )}
      </main>
      {productOpen && (
        <div className="overlay centered" onMouseDown={() => setProductOpen(false)}>
          <section className="modal product-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">ADMIN CATALOG</p><h2>Register a product</h2></div>
              <Button variant="icon" aria-label="Close" onClick={() => setProductOpen(false)}><Icon name="close" /></Button>
            </div>
            <form onSubmit={addProduct}>
              <Field label="Product name"><input name="name" required placeholder="e.g. Essential Linen Shirt" /></Field>
              <div className="form-grid">
                <Field label="Category">
                  <select name="category" defaultValue="Shirts">
                    <option>Shirts</option><option>Outerwear</option><option>Knitwear</option><option>Jackets</option><option>Accessories</option><option>Trousers</option>
                  </select>
                </Field>
                <Field label="Price (₹)"><input name="price" type="number" min="1" required placeholder="1890" /></Field>
              </div>
              <div className="form-grid">
                <Field label="Color"><input name="color" required placeholder="e.g. Warm sand" /></Field>
                <Field label="Discount (%)">
                  <input name="discount" type="number" min="0" max="90" required defaultValue="10" />
                </Field>
              </div>
              <Field label="Available stock"><input name="stock" type="number" min="0" required defaultValue="10" /></Field>
              <Field label="Image URL"><input name="image" type="url" placeholder="https://... (optional)" /></Field>
              <Field label="Upload product image"><input name="file" type="file" accept="image/*" /></Field>
              <Button className="full-button" type="submit">Publish product <Icon name="arrow" size={18} /></Button>
            </form>
          </section>
        </div>
      )}
      {categoryOpen && (
        <div className="overlay centered" onMouseDown={() => setCategoryOpen(false)}>
          <section className="modal category-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">STOREFRONT EDITOR</p><h2>Create a category tile</h2></div>
              <Button variant="icon" aria-label="Close" onClick={() => setCategoryOpen(false)}><Icon name="close" /></Button>
            </div>
            <p className="modal-intro">This tile will appear in the customer’s visual category collection.</p>
            <form onSubmit={addCategory}>
              <Field label="Category name"><input name="name" required placeholder="e.g. Denim Edit" /></Field>
              <Field label="Short description"><input name="note" required placeholder="e.g. Everyday blues" /></Field>
              <Field label="Product filter">
                <select name="filter" defaultValue="All">
                  <option>All</option>
                  {Array.from(new Set(products.map((product) => product.category))).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tile image URL"><input name="image" type="url" placeholder="https://... (optional)" /></Field>
              <Button className="full-button" type="submit">Publish category tile <Icon name="arrow" size={18} /></Button>
            </form>
          </section>
        </div>
      )}
      {selectedBrand && (
        <div className="overlay centered" onMouseDown={() => setSelectedBrand(null)}>
          <section className="modal brand-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">BRAND STRIP</p><h2>Replace {selectedBrand.name}</h2></div>
              <Button variant="icon" aria-label="Close" onClick={() => setSelectedBrand(null)}><Icon name="close" /></Button>
            </div>
            <p className="modal-intro">Use a clear logo on a plain background. Uploaded files are saved on this device.</p>
            <form onSubmit={replaceBrandImage}>
              <Field label="Upload image"><input name="file" type="file" accept="image/*" /></Field>
              <div className="upload-divider"><span>OR</span></div>
              <Field label="Image URL"><input name="image" type="url" placeholder="https://..." /></Field>
              <Button className="full-button" type="submit">Update brand image <Icon name="arrow" size={18} /></Button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function ProductDetail({
  product,
  itemCount,
  onBack,
  onAdd,
  onOpenCart,
}: {
  product: Product
  itemCount: number
  onBack: () => void
  onAdd: (product: Product, size: string) => void
  onOpenCart: () => void
}) {
  const [size, setSize] = useState(product.sizes?.[0] || "M")
  const sizes = product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"]
  const reviews = [
    {
      name: "Aarav S.",
      date: "2 weeks ago",
      rating: "5.0",
      text: "The fabric feels genuinely premium and the relaxed fit sits exactly right. Easy to dress up or down.",
    },
    {
      name: "Kabir V.",
      date: "1 month ago",
      rating: "4.8",
      text: "Looks even better in person. The color is subtle, the stitching is clean, and delivery was easy.",
    },
    {
      name: "Meher K.",
      date: "1 month ago",
      rating: "5.0",
      text: "Bought it as a gift and the fit was perfect. The team also called before dispatch, which was helpful.",
    },
  ]

  return (
    <div className="product-detail-page">
      <header className="detail-header">
        <Button variant="soft" onClick={onBack}>
          ← Back to shop
        </Button>
        <Logo />
        <Button
          variant="icon"
          className="cart-button"
          aria-label={`Open bag with ${itemCount} items`}
          onClick={onOpenCart}
        >
          <Icon name="bag" />
          {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
        </Button>
      </header>

      <main className="detail-main">
        <section className="detail-product">
          <div className="detail-gallery">
            <div className="detail-image-wrap">
              <span className="detail-image-index">THE EDIT · 01</span>
              <img src={product.image} alt={product.name} />
              {product.badge && <span className="detail-badge">{product.badge}</span>}
            </div>
            <div className="detail-thumbnails" aria-label="Product views">
              <Button
                variant="ghost"
                className="detail-thumb detail-thumb-active"
                aria-label="Front view"
              >
                <img src={product.image} alt="" />
              </Button>
              <Button
                variant="ghost"
                className="detail-thumb detail-texture"
                aria-label="Fabric detail"
              >
                <span>FABRIC</span>
              </Button>
              <Button
                variant="ghost"
                className="detail-thumb detail-fit"
                aria-label="Fit detail"
              >
                <span>FIT</span>
              </Button>
            </div>
          </div>

          <div className="detail-info">
            <p className="eyebrow">{product.category.toUpperCase()} · NEW SEASON</p>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <span className="rating-score">4.9</span>
              <span className="rating-stars">★★★★★</span>
              <a href="#reviews">42 verified reviews</a>
            </div>
            <div className="detail-price">
              ₹{product.price.toLocaleString("en-IN")}
              <span>Inclusive of all taxes</span>
              {(product.discount ?? 0) > 0 && (
                <strong>{product.discount}% off</strong>
              )}
            </div>
            <p className="detail-description">
              A quietly confident layer with an easy, relaxed shape. Cut for movement
              and finished with the kind of details that make it an everyday favorite.
            </p>

            <div className="detail-choice">
              <div className="choice-heading">
                <strong>Select size</strong>
                <Button variant="ghost">Size guide</Button>
              </div>
              <div className="size-list">
                {sizes.map((item) => (
                  <Button
                    variant="ghost"
                    className={size === item ? "size-active" : ""}
                    key={item}
                    onClick={() => setSize(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <div className="detail-choice">
              <div className="choice-heading">
                <strong>Color</strong>
                <span>{product.color}</span>
              </div>
              <div className="color-choice">
                <i />
                <span>{product.color}</span>
              </div>
            </div>

            <Button
              className="detail-add-button"
              onClick={() => onAdd(product, size)}
            >
              <span>Add to bag</span>
              <strong>₹{product.price.toLocaleString("en-IN")}</strong>
              <Icon name="arrow" size={19} />
            </Button>

            <div className="detail-perks">
              <span><Icon name="truck" /> Cash on delivery</span>
              <span><Icon name="shield" /> Quality checked</span>
              <span><Icon name="box" /> Easy requests</span>
            </div>

            <div className="detail-facts">
              <article><strong>Fit & feel</strong><p>Relaxed through the body with room to layer. Soft-touch, breathable finish.</p></article>
              <article><strong>Material & care</strong><p>Premium blended fabric. Cold wash gently and dry in shade.</p></article>
              <article><strong>Delivery</strong><p>Usually dispatched in 1–2 days. We call before sending your COD order.</p></article>
            </div>
          </div>
        </section>

        <section className="reviews-section" id="reviews">
          <div className="reviews-summary">
            <p className="eyebrow">WORN & LOVED</p>
            <h2>Real words from<br />real wardrobes.</h2>
            <div><strong>4.9</strong><span>★★★★★<small>Based on 42 reviews</small></span></div>
          </div>
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.name}>
                <div className="review-top"><strong>{review.name}</strong><span>{review.rating} / 5</span></div>
                <p>{review.text}</p>
                <small>Verified purchase · {review.date}</small>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isLocked])
}

export default function App() {
  const [view, setView] = useState<"welcome" | "auth" | "shop">("welcome")
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryTiles, setCategoryTiles] = useState<CategoryTile[]>(() => {
    try {
      const saved = localStorage.getItem("no-bluff-category-tiles")
      return saved ? JSON.parse(saved) : visualCategories
    } catch {
      return visualCategories
    }
  })
  const [brandLogos, setBrandLogos] = useState<BrandLogo[]>(() => {
    try {
      const overrides = JSON.parse(
        localStorage.getItem("no-bluff-brand-overrides") || "{}",
      ) as Record<string, string>
      return initialBrandLogos.map((brand) => ({
        ...brand,
        image: overrides[brand.id] || brand.image,
      }))
    } catch {
      return initialBrandLogos
    }
  })
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [createdOrderNumber, setCreatedOrderNumber] = useState("")

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ]
  const categoryProducts =
    category === "All"
      ? products
      : products.filter((p) => p.category === category)
  const filtered = categoryProducts.filter((product) =>
    `${product.name} ${product.category} ${product.color}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setShowAllProducts(false)
  }, [category, search])

  useEffect(() => {
    let active = true
    productApi.list()
      .then(({ products: apiProducts }) => {
        if (active) setProducts(apiProducts.map(mapProduct))
      })
      .catch((error: unknown) => {
        if (active) setToast(error instanceof Error ? error.message : "Unable to load products")
      })

    authApi.me().then(async ({ user: apiUser }) => {
      if (!active) return
      const restoredUser: User = { ...apiUser }
      setUser(restoredUser)
      setView("shop")
      try {
        if (restoredUser.role === "admin") {
          const result = await orderApi.adminList()
          if (active) setOrders(result.orders.map(mapOrder))
        } else {
          const [cartResult, orderResult] = await Promise.all([cartApi.get(), orderApi.mine()])
          if (active) {
            setCart(mapCart(cartResult.cart.items))
            setCustomerOrders(orderResult.orders.map(mapOrder))
          }
        }
      } catch (error) {
        if (active) setToast(error instanceof Error ? error.message : "Unable to load account data")
      }
    }).catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  useBodyScrollLock(
    cartOpen ||
      checkoutOpen ||
      successOpen ||
      orderHistoryOpen ||
      selectedProduct !== null,
  )

  async function activateUser(apiUser: { id: string; name: string; email: string; phone: string; role: "customer" | "admin" }) {
    const nextUser: User = { ...apiUser }
    setUser(nextUser)
    setView("shop")
    try {
      if (nextUser.role === "admin") {
        const result = await orderApi.adminList()
        setOrders(result.orders.map(mapOrder))
      } else {
        const [cartResult, orderResult] = await Promise.all([cartApi.get(), orderApi.mine()])
        setCart(mapCart(cartResult.cart.items))
        setCustomerOrders(orderResult.orders.map(mapOrder))
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to load account data")
    }
  }

  async function addToCart(product: Product, size = "M") {
    try {
      const result = await cartApi.add(product.id, size, product.color)
      setCart(mapCart(result.cart.items))
      setToast(`${product.name} added to your bag`)
      setConfettiBurst((burst) => burst + 1)
      window.setTimeout(() => setConfettiBurst(0), 1800)
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to add this item")
    }
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    try {
      const result = quantity < 1
        ? await cartApi.remove(cartItemId)
        : await cartApi.update(cartItemId, quantity)
      setCart(mapCart(result.cart.items))
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to update your bag")
    }
  }

  async function removeCartItem(cartItemId: string) {
    try {
      const result = await cartApi.remove(cartItemId)
      setCart(mapCart(result.cart.items))
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to remove this item")
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const result = await orderApi.submit({
        customerName: String(data.get("name")),
        phone: String(data.get("phone")),
        note: String(data.get("note") || ""),
        shippingAddress: {
          line1: String(data.get("address")),
          city: String(data.get("city")),
          postalCode: String(data.get("pin")),
          country: "India",
        },
      })
      const createdOrder = mapOrder(result.order)
      setCreatedOrderNumber(createdOrder.id)
      setCustomerOrders((current) => [createdOrder, ...current])
      setCheckoutOpen(false)
      setCartOpen(false)
      setSuccessOpen(true)
      setCart([])
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to submit your COD request")
    }
  }

  async function updateOrder(id: string, status: OrderStatus) {
    const order = orders.find((item) => item.id === id)
    if (!order) return
    const apiStatuses: Record<OrderStatus, ApiOrder["status"]> = {
      Pending: "pending",
      Approved: "accepted",
      Rejected: "rejected",
      Processing: "processing",
      Shipped: "shipped",
      Delivered: "delivered",
      Cancelled: "cancelled",
    }
    try {
      const result = await orderApi.adminUpdate(order.apiId, apiStatuses[status])
      const updatedOrder = mapOrder(result.order)
      setOrders((current) => current.map((item) => item.apiId === updatedOrder.apiId ? updatedOrder : item))
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to update this order")
    }
  }

  async function addAdminProduct(product: Product, imageFile?: File) {
    try {
      const uploadedImage = imageFile ? await productApi.uploadImage(imageFile) : null
      const imageUrl = uploadedImage?.image.url || product.image
      const compareAtPrice = product.discount
        ? Math.round(product.price / (1 - product.discount / 100))
        : null
      const result = await productApi.create({
        name: product.name,
        category: product.category,
        price: product.price,
        compareAtPrice,
        images: [{ url: imageUrl, ...(uploadedImage ? { publicId: uploadedImage.image.publicId } : {}) }],
        sizes: product.category === "Accessories" ? ["One size"] : ["S", "M", "L", "XL"],
        colors: [product.color],
        stock: product.stock ?? 10,
        isActive: true,
      })
      setProducts((current) => [...current, mapProduct(result.product)])
      setToast("Product published to the shop")
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to publish product")
    }
  }

  function addCategoryTile(categoryTile: CategoryTile) {
    const nextTiles = [...categoryTiles, categoryTile]
    setCategoryTiles(nextTiles)
    localStorage.setItem("no-bluff-category-tiles", JSON.stringify(nextTiles))
  }

  function removeCategoryTile(id: number) {
    const nextTiles = categoryTiles.filter((tile) => tile.id !== id)
    setCategoryTiles(nextTiles)
    localStorage.setItem("no-bluff-category-tiles", JSON.stringify(nextTiles))
  }

  function updateBrandLogo(id: string, image: string) {
    setBrandLogos((current) =>
      current.map((brand) => (brand.id === id ? { ...brand, image } : brand)),
    )
    const overrides = JSON.parse(
      localStorage.getItem("no-bluff-brand-overrides") || "{}",
    ) as Record<string, string>
    localStorage.setItem(
      "no-bluff-brand-overrides",
      JSON.stringify({ ...overrides, [id]: image }),
    )
  }

  async function logout() {
    await authApi.logout().catch(() => undefined)
    setUser(null)
    setCart([])
    setOrders([])
    setCustomerOrders([])
    setView("auth")
  }

  function browseCategory(filter: string) {
    setCategory(filter)
    setMenuOpen(false)
    window.setTimeout(
      () => document.querySelector("#shop")?.scrollIntoView(),
      50,
    )
  }

  if (view === "welcome") {
    return (
      <WelcomePage
        onStart={() => setView("auth")}
        brands={brandLogos}
      />
    )
  }

  if (view === "auth" || !user) {
    return (
      <AuthPage
        onBack={() => setView("welcome")}
        onAuthenticated={(authenticatedUser) => {
          return activateUser(authenticatedUser)
        }}
      />
    )
  }

  if (user.role === "admin") {
    return (
      <AdminPage
        orders={orders}
        products={products}
        categoryTiles={categoryTiles}
        brandLogos={brandLogos}
        onUpdateOrder={updateOrder}
        onAddProduct={addAdminProduct}
        onAddCategory={addCategoryTile}
        onRemoveCategory={removeCategoryTile}
        onUpdateBrand={updateBrandLogo}
        onLogout={logout}
      />
    )
  }

  return (
    <div id="top" className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Button
            variant="icon"
            className="mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="menu" />
          </Button>
          <Logo />
          <nav
            className={menuOpen ? "nav-open" : ""}
            aria-label="Main navigation"
          >
            <a href="#categories" onClick={() => setMenuOpen(false)}>
              Men
            </a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>
              Women
            </a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>
              Kids
            </a>
            <a href="#new" onClick={() => setMenuOpen(false)}>
              New
            </a>
            <a href="#story" onClick={() => setMenuOpen(false)}>
              Studio
            </a>
          </nav>
          <div className="nav-search">
            <Icon name="search" size={19} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                if (event.target.value) setCategory("All")
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  document.querySelector("#shop")?.scrollIntoView()
                }
              }}
              aria-label="Search products"
              placeholder="Search for products, categories and colors"
            />
            {search && (
              <Button
                variant="ghost"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={15} />
              </Button>
            )}
          </div>
          <div className="header-actions">
            <Button
              variant="ghost"
              className="nav-tool"
              onClick={() => setOrderHistoryOpen(true)}
              title="Customer profile"
            >
              <Icon name="user" size={21} />
              <span>Profile</span>
            </Button>
            <Button
              variant="ghost"
              className="nav-tool"
              onClick={() => setToast("Your wishlist is ready for favorites")}
            >
              <Icon name="heart" size={21} />
              <span>Wishlist</span>
            </Button>
            <Button
              variant="ghost"
              className="nav-tool cart-button"
              aria-label={`Open bag with ${itemCount} items`}
              onClick={() => setCartOpen(true)}
            >
              <Icon name="bag" />
              <span>Bag</span>
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </Button>
            <Button
              variant="ghost"
              className="nav-tool logout-tool"
              onClick={logout}
              title="Log out"
            >
              <Icon name="logout" size={21} />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="new">
          <div className="hero-copy">
            <p className="eyebrow">NEW SEASON · 2026</p>
            <h1>
              New fit.
              <br />
              <em>Same vibe.</em>
            </h1>
            <p className="hero-description">
              Elevated everyday pieces with an easy attitude. Thoughtfully
              selected, made to be lived in.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#shop">
                Shop the drop <Icon name="arrow" size={18} />
              </a>
              <span>Free COD on orders over ₹2,500</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="sun-disc" />
            <img
              className="!m-[5%] !h-[90%] !w-[90%] rounded-[18px] md:!m-[8%] md:!h-[84%] md:!w-[84%]"
              src="https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=1200&q=90"
              alt="Model wearing the neutral Drift overshirt"
            />
            <div className="hero-note">
              <small>THE EDIT</small>
              <strong>
                Quiet forms,
                <br />
                confident fits.
              </strong>
            </div>
            <div className="hero-sticker">
              <span>01</span>
              <p>
                Premium looks
                <br />
                for every day
              </p>
            </div>
          </div>
          <div className="scribble">Opening collection</div>
        </section>

        <section className="category-showcase" id="categories">
          <div className="category-heading">
            <div>
              <p className="eyebrow">SHOP YOUR WAY</p>
              <h2>Find your kind of style.</h2>
            </div>
            <p>From everyday layers to occasion-ready looks—start with what feels like you.</p>
          </div>
          <div className="category-rail">
            {categoryTiles.map((item, index) => (
              <Button
                variant="ghost"
                className="category-card"
                key={item.name}
                onClick={() => browseCategory(item.filter)}
              >
                <span className="category-number">0{index + 1}</span>
                <span className="category-image">
                  <img src={item.image} alt="" />
                </span>
                <span className="category-copy">
                  <strong>{item.name}</strong>
                  <small>{item.note}</small>
                </span>
                <span className="category-arrow"><Icon name="arrow" size={16} /></span>
              </Button>
            ))}
          </div>
        </section>

        <section className="benefits" aria-label="Shopping benefits">
          <article>
            <span className="benefit-icon">
              <Icon name="box" />
            </span>
            <div>
              <strong>Curated quality</strong>
              <small>Chosen for feel & finish</small>
            </div>
          </article>
          <article>
            <span className="benefit-icon">
              <Icon name="truck" />
            </span>
            <div>
              <strong>Cash on delivery</strong>
              <small>Pay when it arrives</small>
            </div>
          </article>
          <article>
            <span className="benefit-icon">
              <Icon name="shield" />
            </span>
            <div>
              <strong>Easy requests</strong>
              <small>Confirmed by our team</small>
            </div>
          </article>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE EVERYDAY EDIT</p>
              <h2>Find your new favorite.</h2>
            </div>
            <p>
              Easy layers. Relaxed structure. The kind of pieces you reach for
              on repeat.
            </p>
          </div>

          <div className="filter-row" aria-label="Product categories">
            {categories.map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={category === item ? "filter-active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="product-grid">
            {(showAllProducts ? filtered : filtered.slice(0, 4)).map((product) => (
              <article className="product-card" key={product.id}>
                <div
                  className="product-image"
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.name}`}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setSelectedProduct(product)
                    }
                  }}
                >
                  <img src={product.image} alt={product.name} />
                  {product.badge && (
                    <span className="badge">{product.badge}</span>
                  )}
                </div>
                <div className="product-info">
                  <div>
                    <Button
                      variant="ghost"
                      className="product-title-button"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </Button>
                    <p>{product.color} · Relaxed fit</p>
                  </div>
                  <div className="product-price-block">
                    <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                    <small>{product.discount ?? 0}% OFF</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length > 4 && (
            <div className="show-more-row">
              <Button
                variant="soft"
                onClick={() => setShowAllProducts((visible) => !visible)}
              >
                {showAllProducts
                  ? "Show fewer"
                  : `Show more · ${filtered.length - 4} more`}
                <Icon
                  name="arrow"
                  size={17}
                />
              </Button>
            </div>
          )}
        </section>

        <section className="story-section" id="story">
          <div className="story-card">
            <p className="eyebrow">THE NO BLUFF PROMISE</p>
            <h2>
              Good style.
              <br />
              <em>No tall stories.</em>
            </h2>
            <p>
              We bring premium-feeling essentials within reach—honest quality,
              considered fits, and no unnecessary noise.
            </p>
            <a href="#shop">
              Explore the collection <Icon name="arrow" size={17} />
            </a>
          </div>
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1575863061865-8e152c7166fa?auto=format&fit=crop&w=1200&q=85"
              alt="No Bluff neutral outerwear editorial"
            />
            <span>
              NO BLUFF
              <br />
              PREMIUM EVERYDAY
            </span>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <Logo />
          <p>Premium brands. Better style. Same vibe.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <a href="#new">New arrivals</a>
          <a href="#shop">The collection</a>
          <a href="#shop">Accessories</a>
        </div>
        <div>
          <strong>Visit us</strong>
          <p>
            Near Kameshwar Mandir,
            <br />
            Besides Petrol Pump, Akhnoor
          </p>
          <a href="tel:9596683583">+91 95966 83583</a>
        </div>
        <small>© 2026 NO BLUFF. All style, no bluff.</small>
      </footer>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          itemCount={itemCount}
          onBack={() => setSelectedProduct(null)}
          onAdd={addToCart}
          onOpenCart={() => setCartOpen(true)}
        />
      )}

      {cartOpen && (
        <div className="overlay" onMouseDown={() => setCartOpen(false)}>
          <aside
            className="drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>
                  Shopping bag <span>({itemCount})</span>
                </h2>
              </div>
              <Button
                variant="icon"
                aria-label="Close bag"
                onClick={() => setCartOpen(false)}
              >
                <Icon name="close" />
              </Button>
            </div>
            <div className="cart-content">
              {cart.length === 0 ? (
                <div className="empty-state">
                  <span>
                    <Icon name="bag" size={30} />
                  </span>
                  <h3>Your bag feels light.</h3>
                  <p>
                    Add a few favorites and come back here to request delivery.
                  </p>
                  <Button variant="primary" onClick={() => setCartOpen(false)}>
                    Explore the edit
                  </Button>
                </div>
              ) : (
                cart.map((item) => (
                  <article className="cart-item" key={item.cartItemId}>
                    <img src={item.image} alt="" />
                    <div>
                      <div className="cart-item-head">
                        <div>
                          <h3>{item.name}</h3>
                          <p>
                            {item.color} · Size {item.size}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => void removeCartItem(item.cartItemId)}
                        >
                          <Icon name="trash" size={17} />
                        </Button>
                      </div>
                      <div className="cart-item-foot">
                        <div className="quantity">
                          <Button
                            variant="icon"
                            aria-label="Reduce quantity"
                            onClick={() => void updateQuantity(item.cartItemId, item.quantity - 1)}
                          >
                            <Icon name="minus" size={15} />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="icon"
                            aria-label="Increase quantity"
                            onClick={() => void updateQuantity(item.cartItemId, item.quantity + 1)}
                          >
                            <Icon name="plus" size={15} />
                          </Button>
                        </div>
                        <strong>
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
                </div>
                <p>
                  <Icon name="truck" size={17} /> Delivery charge confirmed
                  before dispatch
                </p>
                <Button
                  className="full-button"
                  onClick={() => {
                    setCartOpen(false)
                    setCheckoutOpen(true)
                  }}
                >
                  Request cash on delivery <Icon name="arrow" size={18} />
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {orderHistoryOpen && (
        <div className="overlay" onMouseDown={() => setOrderHistoryOpen(false)}>
          <aside className="drawer" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">YOUR ACCOUNT</p>
                <h2>Order requests <span>({customerOrders.length})</span></h2>
              </div>
              <Button variant="icon" aria-label="Close order history" onClick={() => setOrderHistoryOpen(false)}>
                <Icon name="close" />
              </Button>
            </div>
            <div className="cart-content">
              {customerOrders.length === 0 ? (
                <div className="empty-state">
                  <span><Icon name="box" size={30} /></span>
                  <h3>No requests yet.</h3>
                  <p>Your COD requests and their latest status will appear here.</p>
                </div>
              ) : customerOrders.map((order) => (
                <article className="cart-item" key={order.apiId}>
                  <img src={order.items[0]?.image || ""} alt="" />
                  <div>
                    <div className="cart-item-head">
                      <div>
                        <h3>Request #{order.id}</h3>
                        <p>{order.createdAt}</p>
                      </div>
                      <span className={`status status-${order.status.toLowerCase().replace(/ /g, "-")}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="cart-item-foot">
                      <span>{order.items.reduce((count, item) => count + item.quantity, 0)} item(s)</span>
                      <strong>₹{order.total.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div
          className="overlay centered"
          onMouseDown={() => setCheckoutOpen(false)}
        >
          <section
            className="modal checkout-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">CASH ON DELIVERY</p>
                <h2>Where should we send it?</h2>
              </div>
              <Button
                variant="icon"
                aria-label="Close"
                onClick={() => setCheckoutOpen(false)}
              >
                <Icon name="close" />
              </Button>
            </div>
            <form onSubmit={submitOrder}>
              <div className="form-grid">
                <Field label="Full name">
                  <input name="name" required defaultValue={user.name} placeholder="Your name" />
                </Field>
                <Field label="Phone number">
                  <input
                    name="phone"
                    required
                    type="tel"
                    defaultValue={user.phone}
                    placeholder="+91 98765 43210"
                    pattern="[+0-9 ()-]{10,}"
                  />
                </Field>
              </div>
              <Field label="Delivery address">
                <textarea
                  name="address"
                  required
                  rows={3}
                  placeholder="House, street, area and landmark"
                />
              </Field>
              <div className="form-grid">
                <Field label="City">
                  <input name="city" required placeholder="Your city" />
                </Field>
                <Field label="PIN code">
                  <input
                    name="pin"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="180001"
                  />
                </Field>
              </div>
              <Field label="Order note (optional)">
                <input
                  name="note"
                  placeholder="Preferred delivery time, landmark..."
                />
              </Field>
              <div className="order-total">
                <span>Total payable on delivery</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <Button className="full-button" type="submit">
                Submit COD request <Icon name="arrow" size={18} />
              </Button>
              <p className="secure-note">
                <Icon name="shield" size={16} /> No online payment needed. Our
                team will call to confirm.
              </p>
            </form>
          </section>
        </div>
      )}

      {successOpen && (
        <div className="overlay centered">
          <section className="modal success-modal">
            <span className="success-icon">
              <Icon name="check" size={32} />
            </span>
            <p className="eyebrow">REQUEST RECEIVED</p>
            <h2>Your new fit is almost yours.</h2>
            <p>
              We’ll call you shortly to confirm your order and delivery details.
              Pay in cash when it arrives.
            </p>
            <div className="order-number">
              Request <strong>#{createdOrderNumber}</strong>
            </div>
            <Button
              className="full-button"
              onClick={() => setSuccessOpen(false)}
            >
              Continue shopping
            </Button>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast">
          <Icon name="check" size={17} /> {toast}
        </div>
      )}
      {confettiBurst > 0 && (
        <div className="confetti-layer" key={confettiBurst} aria-hidden="true">
          {Array.from({ length: 38 }, (_, index) => (
            <i
              key={index}
              style={
                {
                  "--confetti-x": `${(index * 37) % 100}vw`,
                  "--confetti-delay": `${(index % 8) * 0.045}s`,
                  "--confetti-drift": `${((index % 9) - 4) * 13}px`,
                  "--confetti-spin": `${180 + (index % 6) * 90}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
