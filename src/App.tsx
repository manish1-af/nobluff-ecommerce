import {
  CSSProperties,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  ApiCartItem,
  ApiBrandImage,
  ApiOrder,
  ApiProduct,
  authApi,
  cartApi,
  orderApi,
  productApi,
  storefrontApi,
} from "./services/api"
import LoadingScreen from "./LoadingScreen"
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

type ImageTarget =
  | { type: "product"; id: string; name: string }
  | { type: "category"; id: number; name: string }
  | { type: "brand"; id: string; name: string }
  | { type: "welcomeHero"; id: string; name: string }
  | { type: "homeHero"; id: string; name: string }

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
  return labels[status] || "Pending"
}

function mapOrder(order: ApiOrder): Order {
  const address = order.shippingAddress || { line1: "", city: "", postalCode: "" }
  return {
    id: order.orderNumber || "NB000000",
    apiId: order._id || String(Date.now()),
    customer: order.customerName || "Customer",
    email: order.customerEmail || "",
    phone: order.phone || "",
    address: address.line1 || "",
    city: address.city || "",
    pin: address.postalCode || "",
    note: order.note || "",
    items: Array.isArray(order.items)
      ? order.items.map((item, index) => ({
          id: item.productId || `${order._id}-${index}`,
          cartItemId: `${order._id}-${index}`,
          name: item.name || "Product",
          category: "",
          price: Number(item.price) || 0,
          image: item.image || "",
          color: item.selectedColor || "",
          quantity: Number(item.quantity) || 1,
          size: item.selectedSize || "M",
        }))
      : [],
    total: Number(order.totalAmount) || 0,
    status: mapOrderStatus(order.status),
    createdAt: order.createdAt
      ? new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(order.createdAt))
      : "Recently",
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
  whatsapp: (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </>
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </>
  ),
  mapPin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
}

function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof iconPaths
  size?: number
  style?: CSSProperties
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
      style={style}
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

const TRACKING_STEPS = [
  { label: "Placed", subtitle: "COD requested" },
  { label: "Approved", subtitle: "Stock reserved" },
  { label: "Dispatched", subtitle: "On the way" },
  { label: "Delivered", subtitle: "Completed" },
]

function getOrderTrackingState(status: OrderStatus) {
  if (status === "Rejected") return { isRejected: true, isCancelled: false, activeIndex: -1 }
  if (status === "Cancelled") return { isRejected: false, isCancelled: true, activeIndex: -1 }

  let activeIndex = 0
  if (status === "Pending") activeIndex = 0
  else if (status === "Approved" || status === "Processing") activeIndex = 1
  else if (status === "Shipped") activeIndex = 2
  else if (status === "Delivered") activeIndex = 3

  return { isRejected: false, isCancelled: false, activeIndex }
}

function OrderTrackingStepper({ status }: { status: OrderStatus }) {
  const { isRejected, isCancelled, activeIndex } = getOrderTrackingState(status)

  if (isRejected) {
    return (
      <div className="order-alert-box order-alert-rejected" role="alert">
        <Icon name="alertTriangle" size={18} />
        <div>
          <strong>Order Declined by Store</strong>
          <p style={{ margin: "2px 0 0", fontSize: "10px", opacity: 0.9 }}>
            We could not verify the delivery address or stock for this request. Please reach out via WhatsApp for assistance.
          </p>
        </div>
      </div>
    )
  }

  if (isCancelled) {
    return (
      <div className="order-alert-box order-alert-cancelled" role="alert">
        <Icon name="close" size={18} />
        <div>
          <strong>Order Cancelled</strong>
          <p style={{ margin: "2px 0 0", fontSize: "10px", opacity: 0.9 }}>
            This Cash on Delivery request was cancelled.
          </p>
        </div>
      </div>
    )
  }

  const fillPercent = (activeIndex / (TRACKING_STEPS.length - 1)) * 100

  return (
    <div className="order-tracking-box">
      <div className="tracking-title">
        <span>Order Progress</span>
        <span>
          Step {activeIndex + 1} of {TRACKING_STEPS.length}
        </span>
      </div>
      <div className="stepper-track">
        <div className="step-line">
          <div className="step-line-fill" style={{ width: `${fillPercent}%` }} />
        </div>
        {TRACKING_STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex || (activeIndex === 3 && idx === 3)
          const isActive = idx === activeIndex && activeIndex !== 3
          return (
            <div
              key={step.label}
              className={`step-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
            >
              <div className="step-icon-wrap">
                {isCompleted ? <Icon name="check" size={14} /> : <span>{idx + 1}</span>}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConfirmModal({
  isOpen,
  title,
  subtitle,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onClose,
}: {
  isOpen: boolean
  title: string
  subtitle?: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: "primary" | "danger" | "soft"
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="overlay centered confirm-overlay" onMouseDown={() => !isLoading && onClose()}>
      <section className="modal confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <span className={`confirm-icon ${variant === "danger" ? "confirm-icon-danger" : ""}`}>
            <Icon name={variant === "danger" ? "trash" : "shield"} size={22} />
          </span>
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="confirm-subtitle">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="confirm-body">{children}</div>}
        <div className="confirm-actions">
          <Button variant="ghost" disabled={isLoading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            className={variant === "danger" ? "btn-danger" : ""}
            disabled={isLoading}
            onClick={() => void onConfirm()}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}

function CustomerProfileDrawer({
  isOpen,
  user,
  orders,
  onClose,
  onRequestCancelOrder,
  onLogoutClick,
  onOpenPrivacyPolicy,
}: {
  isOpen: boolean
  user: User | null
  orders: Order[]
  onClose: () => void
  onRequestCancelOrder: (order: Order) => void
  onLogoutClick: () => void
  onOpenPrivacyPolicy?: () => void
}) {
  const [profileTab, setProfileTab] = useState<"orders" | "account">("orders")
  if (!isOpen || !user) return null

  const initials = (user.name || "NB")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer profile-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h2>
              Customer Profile <span>({orders.length} orders)</span>
            </h2>
          </div>
          <Button variant="icon" aria-label="Close profile" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>

        <div className="profile-content">
          <section className="profile-user-card">
            <div className="profile-avatar">{initials || "NB"}</div>
            <div className="profile-user-details">
              <h3>{user.name}</h3>
              <div className="profile-user-meta">
                <span><Icon name="mail" size={13} /> {user.email}</span>
                {user.phone && <span><Icon name="phone" size={13} /> {user.phone}</span>}
              </div>
              <span className="profile-member-badge">
                <Icon name="shield" size={12} /> NO BLUFF Member
              </span>
            </div>
          </section>

          <div className="profile-tabs">
            <Button
              variant="ghost"
              className={profileTab === "orders" ? "profile-tab-active" : ""}
              onClick={() => setProfileTab("orders")}
            >
              My Orders & Tracking ({orders.length})
            </Button>
            <Button
              variant="ghost"
              className={profileTab === "account" ? "profile-tab-active" : ""}
              onClick={() => setProfileTab("account")}
            >
              Account Info
            </Button>
          </div>

          {profileTab === "orders" ? (
            orders.length === 0 ? (
              <div className="empty-state">
                <span><Icon name="box" size={32} /></span>
                <h3>No requests yet.</h3>
                <p>Your Cash on Delivery orders and their live tracking status will appear here.</p>
                <Button variant="primary" onClick={onClose}>
                  Explore the Collection
                </Button>
              </div>
            ) : (
              <div className="customer-orders-list">
                {orders.map((order) => {
                  const canCancel = order.status === "Pending" || order.status === "Approved"
                  const whatsappMessage = encodeURIComponent(
                    `Hello NO BLUFF, I would like an update on my COD Order #${order.id} (${order.customer}, ₹${order.total}).`,
                  )
                  return (
                    <article className="customer-order-card" key={order.apiId || order.id}>
                      <div className="order-card-header">
                        <div>
                          <h4>Request #{order.id}</h4>
                          <small>{order.createdAt}</small>
                        </div>
                        <span className={`status status-${order.status.toLowerCase().replace(/ /g, "-")}`}>
                          {order.status}
                        </span>
                      </div>

                      <OrderTrackingStepper status={order.status} />

                      <div className="order-items-preview">
                        {order.items.map((item) => (
                          <div className="order-item-row" key={item.cartItemId}>
                            <img src={item.image || "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=300&q=80"} alt={item.name} />
                            <div className="order-item-meta">
                              <strong>{item.name}</strong>
                              <span>
                                {item.color} · Size {item.size} · Qty {item.quantity}
                              </span>
                            </div>
                            <span className="order-item-price">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-foot">
                        <div className="order-total-row">
                          <span>Payable on Delivery</span>
                          <strong>₹{order.total.toLocaleString("en-IN")}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.4 }}>
                          <Icon name="mapPin" size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {order.address}, {order.city} · {order.pin}
                        </div>
                        <div className="order-actions-row">
                          <a
                            href={`https://wa.me/919596683583?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp"
                          >
                            <Icon name="whatsapp" size={14} />
                            WhatsApp Support
                          </a>
                          {canCancel && (
                            <Button
                              variant="ghost"
                              className="btn-cancel-order"
                              onClick={() => onRequestCancelOrder(order)}
                            >
                              <Icon name="close" size={13} /> Cancel request
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          ) : (
            <div className="profile-account-section">
              <div className="account-info-card">
                <small>Full Name</small>
                <strong>{user.name}</strong>
              </div>
              <div className="account-info-card">
                <small>Registered Email</small>
                <strong>{user.email}</strong>
              </div>
              <div className="account-info-card">
                <small>Contact Phone</small>
                <strong>{user.phone || "Not set"}</strong>
              </div>
              <div className="account-info-card">
                <small>Preferred Payment</small>
                <strong>Cash On Delivery (Verified)</strong>
              </div>
              {onOpenPrivacyPolicy && (
                <div
                  className="account-info-card"
                  style={{ cursor: "pointer", border: "1px solid rgba(169, 104, 70, 0.25)" }}
                  onClick={onOpenPrivacyPolicy}
                >
                  <small>Legal & Transparency</small>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                    <strong>Privacy Policy & Data Security</strong>
                    <span style={{ fontSize: "11px", color: "var(--clay)", fontWeight: 700 }}>Read →</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-footer">
          <Button variant="ghost" className="full-button" onClick={onLogoutClick}>
            <Icon name="logout" size={17} /> Sign out of account
          </Button>
        </div>
      </aside>
    </div>
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
  heroImage,
}: {
  onStart: () => void
  brands?: BrandLogo[]
  heroImage?: string
}) {
  const displayedBrands = Array.isArray(brands) ? brands : brandLogos
  const displayedHero = heroImage || founderImage

  return (
    <main className="welcome-page founder-welcome-page">
      <section className="founder-bleed">
        <img
          className="founder-bleed-image"
          src={displayedHero}
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
  onAuthenticated: (user: User) => Promise<void>
}) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [error, setError] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email")).trim().toLowerCase()
    const password = String(data.get("password"))
    const name = String(data.get("name") || email.split("@")[0])

    setError("")
    setIsAuthenticating(true)
    try {
      const result = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password)
      await onAuthenticated(result.user)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in")
      setIsAuthenticating(false)
    }
  }

  if (isAuthenticating) {
    return <LoadingScreen />
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
  welcomeHeroImage,
  homeHeroImage,
  onUpdateOrder,
  onAddProduct,
  onAddCategory,
  onRemoveCategory,
  onUpdateProductImage,
  onUpdateCategoryImage,
  onUpdateBrand,
  onUpdateWelcomeHero,
  onUpdateHomeHero,
  onLogout,
}: {
  orders: Order[]
  products: Product[]
  categoryTiles: CategoryTile[]
  brandLogos: BrandLogo[]
  welcomeHeroImage?: string
  homeHeroImage?: string
  onUpdateOrder: (id: string, status: OrderStatus) => Promise<void>
  onAddProduct: (product: Product, imageFile?: File) => Promise<boolean>
  onAddCategory: (category: CategoryTile) => Promise<boolean>
  onRemoveCategory: (id: number) => Promise<boolean>
  onUpdateProductImage: (id: string, image: string, imageFile?: File) => Promise<boolean>
  onUpdateCategoryImage: (id: number, image: string, imageFile?: File) => Promise<boolean>
  onUpdateBrand: (id: string, image: string, imageFile?: File) => Promise<boolean>
  onUpdateWelcomeHero: (image: string, imageFile?: File) => Promise<boolean>
  onUpdateHomeHero: (image: string, imageFile?: File) => Promise<boolean>
  onLogout: () => void
}) {
  const [activeSection, setActiveSection] = useState<
    "orders" | "products" | "customers"
  >("orders")
  const [filter, setFilter] = useState<"All" | OrderStatus>("All")
  const [productOpen, setProductOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [imageTarget, setImageTarget] = useState<ImageTarget | null>(null)
  const [imageError, setImageError] = useState("")
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [productError, setProductError] = useState("")
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState("")
  const [adminConfirmation, setAdminConfirmation] = useState<string | null>(null)

  useEffect(() => {
    if (!adminConfirmation) return
    const timer = window.setTimeout(() => setAdminConfirmation(null), 4500)
    return () => window.clearTimeout(timer)
  }, [adminConfirmation])

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
    setProductError("")
    setIsSavingProduct(true)
    const data = new FormData(event.currentTarget)
    const file = data.get("file")
    try {
      const name = String(data.get("name"))
      const saved = await onAddProduct({
        id: "",
        name,
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
      if (saved) {
        setProductOpen(false)
        setAdminConfirmation(`Product "${name}" published successfully!`)
      } else {
        setProductError("Failed to publish product. Please check your image or network connection.")
      }
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "Failed to publish product.")
    } finally {
      setIsSavingProduct(false)
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCategoryError("")
    setIsSavingCategory(true)
    const data = new FormData(event.currentTarget)
    try {
      const name = String(data.get("name"))
      const saved = await onAddCategory({
        id: Date.now(),
        name,
        note: String(data.get("note")),
        filter: String(data.get("filter")),
        image:
          String(data.get("image")) ||
          "https://images.unsplash.com/photo-1614028609503-590a6a47146a?auto=format&fit=crop&w=700&q=85",
      })
      if (saved) {
        setCategoryOpen(false)
        setAdminConfirmation(`Category tile "${name}" created successfully!`)
      } else {
        setCategoryError("Failed to create category tile. Please check connection.")
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to create category tile.")
    } finally {
      setIsSavingCategory(false)
    }
  }

  async function replaceImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!imageTarget) return
    const data = new FormData(event.currentTarget)
    const file = data.get("file")
    const imageUrl = String(data.get("image") || "").trim()
    const imageFile = file instanceof File && file.size > 0 ? file : undefined
    if (!imageFile && !imageUrl) {
      setImageError("Choose an image or enter an image URL.")
      return
    }

    setImageError("")
    setIsSavingImage(true)
    try {
      if (imageTarget.type === "product") {
        await onUpdateProductImage(imageTarget.id, imageUrl, imageFile)
      } else if (imageTarget.type === "category") {
        await onUpdateCategoryImage(imageTarget.id, imageUrl, imageFile)
      } else if (imageTarget.type === "welcomeHero") {
        await onUpdateWelcomeHero(imageUrl, imageFile)
      } else if (imageTarget.type === "homeHero") {
        await onUpdateHomeHero(imageUrl, imageFile)
      } else {
        await onUpdateBrand(imageTarget.id, imageUrl, imageFile)
      }
      setAdminConfirmation(`Image for ${imageTarget.name} updated successfully!`)
      setImageTarget(null)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to save image. Please verify your connection or image format.")
    } finally {
      setIsSavingImage(false)
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
        {adminConfirmation && (
          <div className="admin-success-banner" role="status">
            <Icon name="check" size={18} />
            <span>{adminConfirmation}</span>
            <Button
              variant="ghost"
              aria-label="Dismiss banner"
              onClick={() => setAdminConfirmation(null)}
            >
              <Icon name="close" size={14} />
            </Button>
          </div>
        )}
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
                <div className="admin-product-details">
                  <small>{product.category}</small>
                  <strong>{product.name}</strong>
                  <p>
                    {product.color} · ₹{product.price.toLocaleString("en-IN")} ·{" "}
                    {product.discount ?? 0}% off
                  </p>
                  <Button
                    variant="soft"
                    onClick={() => {
                      setImageError("")
                      setImageTarget({ type: "product", id: product.id, name: product.name })
                    }}
                  >
                    Change image
                  </Button>
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
            <p>Manage category tiles and images shown to customers in the shop.</p>
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
                  variant="soft"
                  className="category-image-edit"
                  onClick={() => {
                    setImageError("")
                    setImageTarget({ type: "category", id: tile.id, name: tile.name })
                  }}
                >
                  Change image
                </Button>
                <Button
                  variant="icon"
                  className="category-remove"
                  aria-label={`Remove ${tile.name}`}
                  onClick={() => void onRemoveCategory(tile.id)}
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
              <p className="eyebrow">STOREFRONT VISUALS & STRIP</p>
              <h2>Hero visuals & brand strip</h2>
            </div>
            <p>Customize the customer home hero image ("Quiet forms, confident fits"), the Founder hero image, and moving brand logos.</p>
          </div>
          <div className="admin-brand-grid">
            <article className="admin-brand-card">
              <div>
                <img
                  src={
                    homeHeroImage ||
                    "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=1200&q=90"
                  }
                  alt="Customer Home hero"
                />
              </div>
              <strong>Home Hero (Quiet Forms)</strong>
              <Button
                variant="soft"
                onClick={() => {
                  setImageError("")
                  setImageTarget({
                    type: "homeHero",
                    id: "homeHero",
                    name: "Customer Home Hero Image (Quiet forms)",
                  })
                }}
              >
                Replace image
              </Button>
            </article>
            <article className="admin-brand-card">
              <div><img src={welcomeHeroImage || founderImage} alt="Welcome page hero" /></div>
              <strong>Founder Hero</strong>
              <Button
                variant="soft"
                onClick={() => {
                  setImageError("")
                  setImageTarget({ type: "welcomeHero", id: "welcomeHero", name: "Get Started Hero Image" })
                }}
              >
                Replace image
              </Button>
            </article>
            {brandLogos.map((brand) => (
              <article className={`admin-brand-card ${brand.className}`} key={brand.id}>
                <div><img src={brand.image} alt={brand.name} /></div>
                <strong>{brand.name}</strong>
                <Button
                  variant="soft"
                  onClick={() => {
                    setImageError("")
                    setImageTarget({ type: "brand", id: brand.id, name: brand.name })
                  }}
                >
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
        <div className="overlay centered" onMouseDown={() => !isSavingProduct && setProductOpen(false)}>
          <section className="modal product-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">ADMIN CATALOG</p><h2>Register a product</h2></div>
              <Button variant="icon" aria-label="Close" disabled={isSavingProduct} onClick={() => setProductOpen(false)}><Icon name="close" /></Button>
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
              {productError && <p className="form-error" role="alert">{productError}</p>}
              <Button className="full-button" type="submit" disabled={isSavingProduct}>
                {isSavingProduct ? "Publishing product..." : "Publish product"}
                {!isSavingProduct && <Icon name="arrow" size={18} />}
              </Button>
            </form>
          </section>
        </div>
      )}
      {categoryOpen && (
        <div className="overlay centered" onMouseDown={() => !isSavingCategory && setCategoryOpen(false)}>
          <section className="modal category-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">STOREFRONT EDITOR</p><h2>Create a category tile</h2></div>
              <Button variant="icon" aria-label="Close" disabled={isSavingCategory} onClick={() => setCategoryOpen(false)}><Icon name="close" /></Button>
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
              {categoryError && <p className="form-error" role="alert">{categoryError}</p>}
              <Button className="full-button" type="submit" disabled={isSavingCategory}>
                {isSavingCategory ? "Publishing category tile..." : "Publish category tile"}
                {!isSavingCategory && <Icon name="arrow" size={18} />}
              </Button>
            </form>
          </section>
        </div>
      )}
      {imageTarget && (
        <div className="overlay centered" onMouseDown={() => setImageTarget(null)}>
          <section className="modal brand-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">STOREFRONT IMAGE</p>
                <h2>Update {imageTarget.name}</h2>
              </div>
              <Button variant="icon" aria-label="Close" onClick={() => setImageTarget(null)}><Icon name="close" /></Button>
            </div>
            <p className="modal-intro">Changes are saved to the storefront and appear for all visitors.</p>
            <form onSubmit={replaceImage}>
              <Field label="Upload image"><input name="file" type="file" accept="image/*" /></Field>
              <div className="upload-divider"><span>OR</span></div>
              <Field label="Image URL"><input name="image" type="text" placeholder="https://... or paste any image link" /></Field>
              {imageError && <p className="form-error" role="alert">{imageError}</p>}
              <Button className="full-button" type="submit" disabled={isSavingImage}>
                {isSavingImage ? "Saving image..." : "Save image"}
                {!isSavingImage && <Icon name="arrow" size={18} />}
              </Button>
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

function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <div className="product-detail-page privacy-policy-page">
      <header className="detail-header">
        <Button variant="soft" onClick={onBack}>
          ← Back to shop
        </Button>
        <Logo />
        <div className="detail-header-spacer" />
      </header>

      <main className="privacy-shell">
        <div className="privacy-header">
          <p className="eyebrow">NO BLUFF · LEGAL & TRUST</p>
          <h1>Privacy Policy</h1>
          <p className="privacy-subtitle">
            Last updated: October 2026. How we protect your data, handle Cash on Delivery (COD) orders, and honor your privacy.
          </p>
        </div>

        <div className="privacy-content">
          <section className="privacy-card">
            <h2>1. Our Privacy Philosophy</h2>
            <p>
              At <strong>NO BLUFF</strong> ("we", "our", or "us"), our brand is built on honesty and clarity:
              <em> All style, no bluff</em>. We believe that securing your personal information and being completely transparent
              about how your data is used is fundamental to building lasting relationships with our customers.
            </p>
          </section>

          <section className="privacy-card">
            <h2>2. Information We Collect</h2>
            <p>We only collect information necessary to fulfill your orders and give you a seamless shopping experience:</p>
            <ul>
              <li>
                <strong>Customer Profile:</strong> Your name, email address, phone number, and securely encrypted password.
              </li>
              <li>
                <strong>Shipping & Delivery Details:</strong> Full delivery address, city, state, postal PIN code, and optional delivery notes for our courier partners.
              </li>
              <li>
                <strong>Shopping Activity:</strong> Bag selections, order history, tracking statuses, and product interactions.
              </li>
              <li>
                <strong>Device & Session Data:</strong> Technical browser details and session tokens used solely to keep you signed in and preserve your cart.
              </li>
            </ul>
          </section>

          <section className="privacy-card">
            <h2>3. How We Use Your Information</h2>
            <p>Your details are used strictly to run our store and deliver your clothes safely:</p>
            <ul>
              <li>To confirm and dispatch Cash on Delivery (COD) orders to your doorstep.</li>
              <li>To contact you via phone call or WhatsApp prior to dispatch for order verification.</li>
              <li>To provide real-time order tracking from approval to delivery.</li>
              <li>To securely save your delivery preferences so future checkouts are effortless.</li>
              <li>To respond to your inquiries regarding sizing, styling, order adjustments, or cancellations.</li>
            </ul>
          </section>

          <section className="privacy-card">
            <h2>4. Cash on Delivery (COD) Orders & Verification</h2>
            <p>
              Because NO BLUFF offers payment on delivery, our dispatch desk may reach out to verify your phone number
              and address before sending packages. We will <strong>never</strong> ask for bank passwords, UPI PINs, OTPs,
              or payment credentials over the phone.
            </p>
          </section>

          <section className="privacy-card">
            <h2>5. Data Security & Storage Protocols</h2>
            <p>We take active technical measures to safeguard your personal data:</p>
            <ul>
              <li>All user passwords are encrypted using bcrypt hashing before storage.</li>
              <li>Website communications are encrypted end-to-end via secure HTTPS (SSL/TLS).</li>
              <li>Storefront imagery and visual assets are securely hosted on Cloudinary's encrypted global CDN.</li>
              <li>Customer and order data are stored in restricted-access MongoDB Atlas cloud clusters.</li>
            </ul>
          </section>

          <section className="privacy-card">
            <h2>6. Third-Party Sharing</h2>
            <p>
              We do <strong>not</strong> sell, rent, trade, or monetize your personal data to advertisers or third parties.
              Information is shared only with logistics and courier services strictly required to transport your package
              to your doorstep.
            </p>
          </section>

          <section className="privacy-card">
            <h2>7. Cookies & Local Storage</h2>
            <p>
              We use minimal cookies and browser local storage to save your checkout preferences
              (such as saved delivery address) and maintain your login session. You can clear cookies in your
              browser settings at any time without restricting your ability to explore the store.
            </p>
          </section>

          <section className="privacy-card">
            <h2>8. Your Rights & Data Choices</h2>
            <p>You have full autonomy over your account and personal details:</p>
            <ul>
              <li>You can view and verify your account details inside your Customer Profile.</li>
              <li>You can cancel pending COD requests directly through your order tracking dashboard before dispatch.</li>
              <li>You can request permanent deletion of your account and order history by reaching out to our support team.</li>
            </ul>
          </section>

          <section className="privacy-card">
            <h2>9. Store Location & Contact Information</h2>
            <p>If you have any questions or requests regarding your privacy, we are always here to help:</p>
            <div className="privacy-contact-box">
              <div>
                <strong>Store Location:</strong>
                <span>Near Kameshwar Mandir, Besides Petrol Pump, Akhnoor, Jammu & Kashmir</span>
              </div>
              <div>
                <strong>Founder / Support:</strong>
                <span>Rajat Gupta</span>
              </div>
              <div>
                <strong>Phone / WhatsApp:</strong>
                <a href="tel:9596683583">+91 95966 83583</a>
              </div>
              <div>
                <strong>Email:</strong>
                <a href="mailto:support@nobluff.in">support@nobluff.in</a>
              </div>
            </div>
          </section>
        </div>

        <div className="privacy-footer-action">
          <Button variant="primary" onClick={onBack}>
            Return to shop <Icon name="arrow" size={18} />
          </Button>
        </div>
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressImageFile(file: File, maxDimension = 1920, quality = 0.88): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, width, height)
      try {
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg"
        resolve(canvas.toDataURL(mime, quality))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function resolveImageSource(imageUrl: string, imageFile?: File): Promise<string> {
  if (imageFile) {
    try {
      const uploaded = await productApi.uploadImage(imageFile)
      if (uploaded?.image?.url) return uploaded.image.url
    } catch (uploadError) {
      console.warn("Cloudinary upload failed, compressing and saving image locally:", uploadError)
      return await compressImageFile(imageFile)
    }
  }
  let url = imageUrl.trim()
  if (url && !/^https?:\/\//i.test(url) && !url.startsWith("data:") && !url.startsWith("/")) {
    url = `https://${url}`
  }
  return url
}

export default function App() {
  const [view, setView] = useState<"welcome" | "auth" | "shop">("welcome")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryTiles, setCategoryTiles] = useState<CategoryTile[]>(visualCategories)
  const [brandImageOverrides, setBrandImageOverrides] = useState<Record<string, string>>({})
  const [welcomeHeroImage, setWelcomeHeroImage] = useState<string>("")
  const [homeHeroImage, setHomeHeroImage] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<
    | { type: "logout" }
    | {
        type: "checkout"
        data: {
          name: string
          phone: string
          address: string
          city: string
          pin: string
          note: string
        }
      }
    | {
        type: "cancel_order"
        orderApiId: string
        orderNumber: string
      }
    | null
  >(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [createdOrderNumber, setCreatedOrderNumber] = useState("")

  const savedAddress = useMemo(() => {
    try {
      const stored = localStorage.getItem("nobluff_saved_address")
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return null
  }, [])

  const brandLogos = initialBrandLogos.map((brand) => ({
    ...brand,
    image: brandImageOverrides[brand.id] || brand.image,
  }))
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
    const productsLoaded = productApi.list()
      .then(({ products: apiProducts }) => {
        if (active) setProducts(apiProducts.map(mapProduct))
      })
      .catch((error: unknown) => {
        if (active) setToast(error instanceof Error ? error.message : "Unable to load products")
      })

    const storefrontLoaded = storefrontApi.get()
      .then((settings) => {
        if (!active) return
        if (settings.categoryTiles) setCategoryTiles(settings.categoryTiles)
        if (settings.brandImages) {
          setBrandImageOverrides(Object.fromEntries(
            settings.brandImages.map(({ id, url }) => [id, url]),
          ))
        }
        if (settings.welcomeHeroImage) {
          setWelcomeHeroImage(settings.welcomeHeroImage)
        }
        if (settings.homeHeroImage) {
          setHomeHeroImage(settings.homeHeroImage)
        }
      })
      .catch((error: unknown) => {
        if (active) setToast(error instanceof Error ? error.message : "Unable to load storefront settings")
      })

    const sessionLoaded = authApi.me().then(async ({ user: apiUser }) => {
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
    })
      .catch(() => undefined)

    void Promise.all([productsLoaded, storefrontLoaded, sessionLoaded]).then(() => {
      if (active) setIsInitialLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  useBodyScrollLock(
    cartOpen ||
      checkoutOpen ||
      successOpen ||
      profileOpen ||
      privacyPolicyOpen ||
      confirmModal !== null ||
      selectedProduct !== null,
  )

  async function activateUser(apiUser: { id: string; name: string; email: string; phone: string; role: "customer" | "admin" }) {
    const nextUser: User = { ...apiUser }
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
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
    setUser(nextUser)
    setView("shop")
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

  function handleCheckoutFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const orderData = {
      name: String(data.get("name")),
      phone: String(data.get("phone")),
      note: String(data.get("note") || ""),
      address: String(data.get("address")),
      city: String(data.get("city")),
      pin: String(data.get("pin")),
    }
    try {
      localStorage.setItem("nobluff_saved_address", JSON.stringify(orderData))
    } catch {
      // ignore
    }
    setConfirmModal({
      type: "checkout",
      data: orderData,
    })
  }

  async function executeConfirmedCheckout(orderData: {
    name: string
    phone: string
    note: string
    address: string
    city: string
    pin: string
  }) {
    setIsSubmittingOrder(true)
    try {
      const result = await orderApi.submit({
        customerName: orderData.name,
        phone: orderData.phone,
        note: orderData.note,
        shippingAddress: {
          line1: orderData.address,
          city: orderData.city,
          postalCode: orderData.pin,
          country: "India",
        },
      })
      const createdOrder = mapOrder(result.order)
      setCreatedOrderNumber(createdOrder.id)
      setCustomerOrders((current) => [createdOrder, ...current])
      setConfirmModal(null)
      setCheckoutOpen(false)
      setCartOpen(false)
      setSuccessOpen(true)
      setCart([])
      setToast("Order request received successfully!")
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to submit your COD request")
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  async function cancelCustomerOrder(orderApiId: string) {
    setIsCancellingOrder(true)
    try {
      const result = await orderApi.cancel(orderApiId)
      const updated = mapOrder(result.order)
      setCustomerOrders((current) =>
        current.map((order) => (order.apiId === orderApiId ? updated : order)),
      )
      setToast(`Order #${updated.id} request cancelled.`)
      setConfirmModal(null)
      return true
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to cancel order")
      return false
    } finally {
      setIsCancellingOrder(false)
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

  async function addAdminProduct(product: Product, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = (await resolveImageSource(product.image, imageFile)) || product.image
      const compareAtPrice = product.discount
        ? Math.round(product.price / (1 - product.discount / 100))
        : null
      const result = await productApi.create({
        name: product.name,
        category: product.category,
        price: product.price,
        compareAtPrice,
        images: [{ url: imageUrl }],
        sizes: product.category === "Accessories" ? ["One size"] : ["S", "M", "L", "XL"],
        colors: [product.color],
        stock: product.stock ?? 10,
        isActive: true,
      })
      setProducts((current) => [...current, mapProduct(result.product)])
      setToast("Product published to the shop")
      return true
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to publish product")
      return false
    }
  }

  async function updateProductImage(id: string, image: string, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = await resolveImageSource(image, imageFile)
      if (!imageUrl) throw new Error("Please select an image file or enter an image URL.")
      const result = await productApi.update(id, {
        images: [{ url: imageUrl }],
      })
      setProducts((current) => current.map((product) =>
        product.id === id ? mapProduct(result.product) : product,
      ))
      setToast("Product image updated for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product image"
      setToast(message)
      throw new Error(message)
    }
  }

  async function addCategoryTile(categoryTile: CategoryTile): Promise<boolean> {
    const nextTiles = [...categoryTiles, categoryTile]
    try {
      await storefrontApi.update({ categoryTiles: nextTiles })
      setCategoryTiles(nextTiles)
      setToast("Category tile published for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to publish category tile"
      setToast(message)
      throw new Error(message)
    }
  }

  async function removeCategoryTile(id: number): Promise<boolean> {
    const nextTiles = categoryTiles.filter((tile) => tile.id !== id)
    try {
      await storefrontApi.update({ categoryTiles: nextTiles })
      setCategoryTiles(nextTiles)
      setToast("Category tile removed from the storefront")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove category tile"
      setToast(message)
      throw new Error(message)
    }
  }

  async function updateCategoryImage(id: number, image: string, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = await resolveImageSource(image, imageFile)
      if (!imageUrl) throw new Error("Please select an image file or enter an image URL.")
      const nextTiles = categoryTiles.map((tile) =>
        tile.id === id ? { ...tile, image: imageUrl } : tile,
      )
      await storefrontApi.update({ categoryTiles: nextTiles })
      setCategoryTiles(nextTiles)
      setToast("Category image updated for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update category image"
      setToast(message)
      throw new Error(message)
    }
  }

  async function updateBrandLogo(id: string, image: string, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = await resolveImageSource(image, imageFile)
      if (!imageUrl) throw new Error("Please select an image file or enter an image URL.")
      const nextOverrides = { ...brandImageOverrides, [id]: imageUrl }
      const brandImages: ApiBrandImage[] = Object.entries(nextOverrides).map(([brandId, url]) => ({
        id: brandId,
        url,
      }))
      await storefrontApi.update({ brandImages })
      setBrandImageOverrides(nextOverrides)
      setToast("Brand image updated for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update brand image"
      setToast(message)
      throw new Error(message)
    }
  }

  async function updateWelcomeHero(image: string, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = await resolveImageSource(image, imageFile)
      if (!imageUrl) throw new Error("Please select an image file or enter an image URL.")
      await storefrontApi.update({ welcomeHeroImage: imageUrl })
      setWelcomeHeroImage(imageUrl)
      setToast("Get Started hero image updated for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update welcome hero image"
      setToast(message)
      throw new Error(message)
    }
  }

  async function updateHomeHero(image: string, imageFile?: File): Promise<boolean> {
    try {
      const imageUrl = await resolveImageSource(image, imageFile)
      if (!imageUrl) throw new Error("Please select an image file or enter an image URL.")
      await storefrontApi.update({ homeHeroImage: imageUrl })
      setHomeHeroImage(imageUrl)
      setToast("Customer home hero image updated for all visitors")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update customer home hero image"
      setToast(message)
      throw new Error(message)
    }
  }

  async function logout() {
    await authApi.logout().catch(() => undefined)
    setUser(null)
    setCart([])
    setOrders([])
    setCustomerOrders([])
    setProfileOpen(false)
    setConfirmModal(null)
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

  if (isInitialLoading) {
    return <LoadingScreen />
  }

  if (view === "welcome") {
    return (
      <WelcomePage
        onStart={() => setView("auth")}
        brands={brandLogos}
        heroImage={welcomeHeroImage}
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
        welcomeHeroImage={welcomeHeroImage}
        homeHeroImage={homeHeroImage}
        onUpdateOrder={updateOrder}
        onAddProduct={addAdminProduct}
        onAddCategory={addCategoryTile}
        onRemoveCategory={removeCategoryTile}
        onUpdateProductImage={updateProductImage}
        onUpdateCategoryImage={updateCategoryImage}
        onUpdateBrand={updateBrandLogo}
        onUpdateWelcomeHero={updateWelcomeHero}
        onUpdateHomeHero={updateHomeHero}
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
              className="nav-tool profile-button"
              onClick={() => setProfileOpen(true)}
              title="Customer profile"
              aria-label="Customer profile"
            >
              <Icon name="user" size={21} />
              <span>{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
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
              src={
                homeHeroImage ||
                "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=1200&q=90"
              }
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
          <strong>Trust & Legal</strong>
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => setPrivacyPolicyOpen(true)}
          >
            Privacy Policy
          </button>
          <a href="#story">Our Studio</a>
          <a href="tel:9596683583">Direct Support</a>
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
        <small>
          © 2026 NO BLUFF. All style, no bluff. ·{" "}
          <button
            type="button"
            className="footer-link-inline"
            onClick={() => setPrivacyPolicyOpen(true)}
          >
            Privacy Policy
          </button>
        </small>
      </footer>

      {privacyPolicyOpen && (
        <PrivacyPolicyPage onBack={() => setPrivacyPolicyOpen(false)} />
      )}

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

      <CustomerProfileDrawer
        isOpen={profileOpen}
        user={user}
        orders={customerOrders}
        onClose={() => setProfileOpen(false)}
        onRequestCancelOrder={(order) =>
          setConfirmModal({
            type: "cancel_order",
            orderApiId: order.apiId,
            orderNumber: order.id,
          })
        }
        onLogoutClick={() => setConfirmModal({ type: "logout" })}
        onOpenPrivacyPolicy={() => {
          setProfileOpen(false)
          setPrivacyPolicyOpen(true)
        }}
      />

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
            <form onSubmit={handleCheckoutFormSubmit}>
              <div className="form-grid">
                <Field label="Full name">
                  <input
                    name="name"
                    required
                    defaultValue={savedAddress?.name || user.name}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    name="phone"
                    required
                    type="tel"
                    defaultValue={savedAddress?.phone || user.phone}
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
                  defaultValue={savedAddress?.address || ""}
                  placeholder="House, street, area and landmark"
                />
              </Field>
              <div className="form-grid">
                <Field label="City">
                  <input
                    name="city"
                    required
                    defaultValue={savedAddress?.city || ""}
                    placeholder="Your city"
                  />
                </Field>
                <Field label="PIN code">
                  <input
                    name="pin"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    defaultValue={savedAddress?.pin || ""}
                    placeholder="180001"
                  />
                </Field>
              </div>
              <Field label="Order note (optional)">
                <input
                  name="note"
                  defaultValue={savedAddress?.note || ""}
                  placeholder="Preferred delivery time, landmark..."
                />
              </Field>
              <div className="order-total">
                <span>Total payable on delivery</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <Button className="full-button" type="submit">
                Review and confirm COD request <Icon name="arrow" size={18} />
              </Button>
              <p className="secure-note">
                <Icon name="shield" size={16} /> No online payment needed. Our
                team will call to confirm. View{" "}
                <button
                  type="button"
                  className="footer-link-inline"
                  onClick={() => {
                    setCheckoutOpen(false)
                    setPrivacyPolicyOpen(true)
                  }}
                >
                  Privacy Policy
                </button>
                .
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

      {confirmModal && confirmModal.type === "logout" && (
        <ConfirmModal
          isOpen={true}
          title="Sign out of NO BLUFF?"
          subtitle="You will need to sign in again to view saved selections and track your orders."
          confirmLabel="Sign out"
          variant="danger"
          onConfirm={logout}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {confirmModal && confirmModal.type === "checkout" && (
        <ConfirmModal
          isOpen={true}
          title="Confirm Cash on Delivery Request"
          subtitle="Please double-check your delivery details and order total before dispatch."
          confirmLabel="Confirm & Place COD Request"
          cancelLabel="Edit details"
          variant="primary"
          isLoading={isSubmittingOrder}
          onConfirm={() => executeConfirmedCheckout(confirmModal.data)}
          onClose={() => setConfirmModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Recipient:</span>
              <strong>
                {confirmModal.data.name} ({confirmModal.data.phone})
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Delivery Address:</span>
              <span style={{ textAlign: "right", maxWidth: "60%" }}>
                {confirmModal.data.address}, {confirmModal.data.city} ·{" "}
                {confirmModal.data.pin}
              </span>
            </div>
            {confirmModal.data.note && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Note:</span>
                <em>“{confirmModal.data.note}”</em>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "8px",
                borderTop: "1px solid var(--line)",
              }}
            >
              <span>Total Payable on Delivery:</span>
              <strong style={{ fontSize: "16px", color: "var(--ink)" }}>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </ConfirmModal>
      )}

      {confirmModal && confirmModal.type === "cancel_order" && (
        <ConfirmModal
          isOpen={true}
          title={`Cancel Request #${confirmModal.orderNumber}?`}
          subtitle="Are you sure you want to cancel this order request? Your reserved items will be released."
          confirmLabel="Yes, Cancel Request"
          cancelLabel="Keep Order"
          variant="danger"
          isLoading={isCancellingOrder}
          onConfirm={() => cancelCustomerOrder(confirmModal.orderApiId)}
          onClose={() => setConfirmModal(null)}
        />
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
