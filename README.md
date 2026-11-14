# Luxury Women's Fashion Affiliate Store & CRM Platform 👗✨

An editorial, high-performance Women's Fashion Affiliate Platform inspired by the minimalist aesthetic of **MANGO** and luxury fashion editorial houses. Built with a production-grade, secure Node.js/Express TypeScript backend with a persistent SQLite database engine, a comprehensive administrative CRM portal, and a modern React 19 + Vite + Tailwind CSS frontend.

---

## 🌟 Key Features

### 🏢 Real Persistent Database Engine & Admin CRM (NEW)
- **Zero-Daemon Persistent SQL Engine**: Powered by `better-sqlite3` with WAL mode enabled (`PRAGMA journal_mode = WAL;`) and relational foreign key constraints.
- **Relational Schemas & Indexing**:
  - `products`: id, slug, title, subtitle, category, subcategory, tags (JSON), price, original_price, currency, primary/secondary images, gallery (JSON), colors (JSON), sizes (JSON), in_stock, rating, review_count, retailer, affiliate_url, partner, description, composition, timestamps.
  - `retailers`: id, name, affiliate_network, is_active, created_at.
  - `affiliate_clicks`: id, product_id, retailer_name, destination_url, ip_hash (privacy-preserving SHA-256), user_agent, referrer, clicked_at.
  - `whitelist_domains`: id, domain, is_active, created_at.
  - `admins`: id, username, password_hash (bcrypt), created_at.
- **Auto-Migration & Database Seeder**: Automatically initializes schema and populates catalog items, authorized retailers, whitelisted domains, and default admin user on first launch.
- **Full Administrative CRM Dashboard (`/admin`)**:
  - **Metrics Bar**: Real-time stats on Total Products, Total Affiliate Clicks, Active Retailers, and Whitelisted Domains.
  - **Product Catalog Management**: Paginated data table, keyword search, subcategory filter, stock filter, direct affiliate redirect test links, edit modal, delete confirmations, and "+ Create New Product" form with Zod runtime validation.
  - **Affiliate Analytics & Click Stream**: Outbound click tracking audit trail, top converting garments, and referral distribution by retailer.
  - **Dynamic Whitelist Management**: View approved domains and add new partner retail domains directly from the UI without touching code.
  - **Secure Authentication**: Bcrypt-hashed credentials, JWT Bearer tokens, HttpOnly cookie support, and protected CRM routes.

### 🎨 Editorial Front-End (React 19 + Vite + Tailwind CSS)
- **Editorial Aesthetic**: Clean typographic hierarchy, subtle hover micro-interactions, uppercase tracking, and minimalist luxury palette inspired by MANGO.
- **Dynamic Multi-View Grid Switcher**: Fluid responsive switching across 2-column, 3-column, and 4-column layouts with adaptive viewport fallbacks for mobile and tablet devices.
- **Subcategory Faceted Filtering**: Real-time filtering by category and subcategories (*Dresses, Jumpsuits, Party, Wedding Guest, Office, Long, Midi, Short, Knitwear*) with dynamic database facet counts.
- **Instant Search Experience**: Full-screen modal search with live keyword filtering, instant product thumbnail previews, and keyboard shortcuts (`ESC` to close).
- **Persistent Wishlist Drawer**: Slide-out drawer with zero layout shift, localStorage synchronization, live product count badges, and direct checkout redirect links.
- **Instant CRM Synchronization**: Any product created, updated, or deleted in the CRM immediately reflects in the live storefront.

### 🛡️ Enterprise-Grade Security Backend (Node.js + Express + TypeScript)
- **Strict Outbound Redirect Security**:
  - SQLite-backed domain whitelist enforcement (blocking open redirects, protocol-relative links, `javascript:`, data URIs, and unapproved domains).
  - Anti-caching headers (`no-store, no-cache, must-revalidate`) and security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
  - SSRF protection against private IP spaces, localhost, link-local, IPv6, and AWS metadata addresses.
- **Hardened HTTP Headers**: Comprehensive Helmet integration with strict Content Security Policy (`default-src 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **Layered Rate Limiting**: Dedicated rate limiters for general API queries (100 req/min) and outbound affiliate redirects (30 req/min).
- **Parameter Pollution & Body Guards**: Built-in HTTP Parameter Pollution (`hpp`) guards, 10kb body payload limits, and strict Zod validation.

---

## 🏗️ Architecture & Project Structure

```
cloths womens/
├── backend/                  # Express + TypeScript Security API & SQLite DB
│   ├── data/                 # SQLite persistent database storage (store.db)
│   ├── src/
│   │   ├── config/           # Whitelist domains & environment configuration
│   │   ├── controllers/      # Catalog, Admin CRM, and Affiliate Redirect controllers
│   │   ├── db/               # SQLite connection, schema initialization & seeder
│   │   ├── middleware/       # Admin auth, Rate limiting, Helmet, HPP, Zod validation
│   │   ├── routes/           # Catalog, Admin CRM, health, and redirect routers
│   │   ├── services/         # Catalog SQL service, redirect validation & click tracking
│   │   ├── types/            # TypeScript schemas & API contracts
│   │   ├── app.ts            # Express application factory
│   │   └── server.ts         # Server entrypoint
│   └── tests/                # Admin CRM, Security, concurrency, redirect, & catalog tests
├── frontend/                 # React 19 + Vite + Tailwind CSS Editorial UI
│   ├── src/
│   │   ├── components/       # Header, ProductCard, ProductGrid, WishlistDrawer, etc.
│   │   │   └── admin/        # AdminLogin, AdminDashboard, ProductModal
│   │   ├── context/          # ViewContext (grid view mode) & WishlistContext
│   │   ├── services/         # Storefront & Admin CRM API clients
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Storefront & CRM router orchestration
│   │   └── main.tsx          # React application entrypoint
│   └── tests/                # Frontend component, CRM, and integration tests
├── e2e/                      # Playwright End-to-End browser test suite
├── playwright.config.ts      # Playwright configuration
├── vitest.config.ts          # Vitest workspace configuration
├── tsconfig.json             # Root TypeScript project references
└── package.json              # Root workspace manifest
```

---

## 🔑 Administrative Credentials (Default)

The database automatically seeds an initial administrator:
- **Username**: `admin`
- **Password**: `AdminPassword123!`
- **Access Route**: Click **CRM** in the top navigation or visit `/admin`

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation
```bash
# Install root workspace dependencies
npm install

# Install backend & frontend dependencies
npm --prefix backend install
npm --prefix frontend install
```

### Running the Application

Run the backend and frontend simultaneously:
```bash
# Terminal 1: Start Backend (Port 4000)
npm --prefix backend run dev

# Terminal 2: Start Frontend (Port 5173)
npm --prefix frontend run dev
```

Visit `http://localhost:5173` for the public editorial storefront, or click **CRM** in the top right to access the Admin CRM portal.

---

## 🧪 Testing & Verification

The repository includes a comprehensive 4-tier automated test suite:

```bash
# Run all tests (Backend + Frontend + Playwright E2E)
npm run test:all

# Run backend test suite (80 tests including Admin CRM, security, concurrency)
npm run test:backend

# Run frontend test suite (54 tests including Admin components, wishlist, catalog)
npm run test:frontend

# Run Playwright End-to-End browser tests (6 scenarios)
npm run test:e2e
```
