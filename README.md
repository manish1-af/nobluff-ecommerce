# No Bluff Store

React/Vite storefront with an Express and MongoDB API. Customer orders are COD requests: a request stays pending until an admin accepts or rejects it. There is no payment gateway.

## Architecture

- `src/App.tsx` retains the existing Figma storefront, auth, cart, checkout, and admin screens.
- `src/services/api.ts` is the frontend API adapter; `VITE_API_URL` points to the backend API root.
- `backend/src` contains Express routes/controllers, Mongoose models, authentication, validation, and error handling.
- MongoDB stores customer accounts, products, carts, and immutable order item snapshots.
- Product images are uploaded to Cloudinary by the authenticated admin API; MongoDB stores only image URLs and public IDs.

## Setup

1. Install frontend dependencies from the repository root with `npm install`.
2. In `backend`, install API dependencies with `npm install`.
3. Copy `backend/.env.example` to `backend/.env`, then configure MongoDB Atlas, a random JWT secret of at least 32 characters, and the frontend origin in `CLIENT_URL`.
4. For admin image uploads, configure all three Cloudinary values. Without them, URL-based product images still work and upload requests return a clear configuration error.
5. Set a development-only `SEED_ADMIN_PASSWORD` (at least 12 characters) and run `npm run seed` from `backend` to create the admin and six sample products. The seed command refuses to run in production and never overwrites existing records.

Run the API from `backend` with `npm run dev` (port 5000 by default). Run the existing Vite app from the repository root with `npm run dev` (port 8443 in Figma Make). Set `VITE_API_URL=http://localhost:5000/api` in the frontend environment when the API is not hosted at the default URL. Configure the Vite origin in `CLIENT_URL`.

## Environment

`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `PORT`, and `SHIPPING_FEE` are backend settings. Cloudinary uses `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are only used by the development seed command. The frontend receives only `VITE_API_URL`; never add backend secrets to `VITE_*` variables.

## Order Lifecycle

The customer submits a request from the server-validated cart. The API calculates item prices, subtotal, shipping fee, and total, snapshots product details, creates a `pending` COD order, and clears the cart in one MongoDB transaction. Stock is not reserved on submission. Admin acceptance atomically rechecks and decrements stock; rejection does not affect stock. Accepted orders move to `processing`, then `shipped`, then `delivered`. An accepted or processing order may be cancelled by an admin, restoring its stock atomically. MongoDB transactions require Atlas or another replica-set deployment.

## API

All JSON responses use `{ success, data }` or `{ success: false, message }`. The session is an HTTP-only cookie; the frontend sends credentialed requests. Admin privileges are loaded from the authenticated user record.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register customer |
| POST | `/api/auth/login` | Public, rate limited | Customer/admin login |
| GET | `/api/auth/me` | Authenticated | Current user |
| POST | `/api/auth/logout` | Public | Clear session cookie |
| GET | `/api/products` | Public | Active catalog, search/filter/pagination |
| GET | `/api/products/:id` | Public | Active product |
| GET | `/api/products/slug/:slug` | Public | Active product by slug |
| POST/PUT/DELETE | `/api/products` or `/api/products/:id` | Admin | Create, update, or deactivate product |
| POST | `/api/products/image-upload` | Admin | Upload image to Cloudinary (8 MB maximum) |
| GET/POST/DELETE | `/api/cart` | Customer | Read, add to, or clear cart |
| PUT/DELETE | `/api/cart/:itemId` | Customer | Change quantity or remove cart line |
| POST | `/api/orders` | Customer | Submit COD request from server cart |
| GET | `/api/orders` | Customer | Own order history |
| GET | `/api/admin/orders` | Admin | Order queue; optional `?status=pending` |
| GET | `/api/admin/orders/:id` | Admin | Order and customer details |
| PATCH | `/api/admin/orders/:id/accept` | Admin | Accept and reserve stock |
| PATCH | `/api/admin/orders/:id/reject` | Admin | Reject pending request |
| PATCH | `/api/admin/orders/:id/status` | Admin | Advance status or cancel with stock restoration |
| GET | `/api/health` | Public | API health check |

## Development Checks

Run `npm test` and `npm start` from `backend`; run `npm run build` from the repository root. To exercise database-backed flows, use a MongoDB Atlas URI or local replica set, seed a development admin, and configure Cloudinary before testing uploads. Never use production credentials in a local seed environment.