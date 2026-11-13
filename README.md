# Luxury Women's Fashion Affiliate Store 👗✨

An editorial, high-performance Women's Fashion Affiliate Platform inspired by the minimalist aesthetic of **MANGO** and luxury fashion editorial houses. Built with a production-grade, secure Node.js/Express TypeScript backend and a modern React 19 + Vite + Tailwind CSS frontend.

---

## 🌟 Key Features

### 🎨 Editorial Front-End (React 19 + Vite + Tailwind CSS)
- **Editorial Aesthetic**: Clean typographic hierarchy, subtle hover micro-interactions, uppercase tracking, and minimalist luxury palette inspired by MANGO.
- **Dynamic Multi-View Grid Switcher**: Fluid responsive switching across 2-column, 3-column, and 4-column layouts with adaptive viewport fallbacks for mobile and tablet devices.
- **Subcategory Faceted Filtering**: Real-time filtering by category and subcategories (*Coats, Blazers, Dresses, Knitwear, Trousers, Accessories*) with active facet counts.
- **Instant Search Experience**: Full-screen modal search with live keyword filtering, instant product thumbnail previews, and keyboard shortcuts (`ESC` to close).
- **Persistent Wishlist Drawer**: Slide-out drawer with zero layout shift, localStorage synchronization, live product count badges, and direct checkout redirect links.
- **Resilient Fallback Architecture**: Seamless offline mock catalog fallback ensuring zero empty-state regressions if the backend API is unreachable.

### 🛡️ Enterprise-Grade Security Backend (Node.js + Express + TypeScript)
- **Strict Affiliate Redirection Security**:
  - Domain & protocol whitelist enforcement (blocking open redirects, `javascript:`, data URIs, and unapproved domains).
  - Cryptographic HMAC signature validation option to prevent parameter tampering.
  - SSRF protection against private IP spaces, localhost, link-local, and AWS metadata addresses.
- **Hardened HTTP Headers**: Comprehensive Helmet integration with strict Content Security Policy (`default-src 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Referrer Policy.
- **Layered Rate Limiting**: Dedicated rate limiters for general API queries (100 req/min) and outbound affiliate redirects (30 req/min) to prevent abuse and click fraud.
- **Parameter Pollution Defense**: Built-in HTTP Parameter Pollution (`hpp`) guards and strict Zod runtime request validation.
- **Comprehensive Health Checks**: Production `/api/health` monitoring memory usage, uptime, and system health status.

---

## 🏗️ Architecture & Project Structure

```
cloths womens/
├── backend/                  # Express + TypeScript Security API
│   ├── src/
│   │   ├── config/           # Whitelist domains & environment configuration
│   │   ├── controllers/      # Catalog and Affiliate Redirect controllers
│   │   ├── data/             # Curated women's fashion catalog (products.json)
│   │   ├── middleware/       # Rate limiting, Helmet, HPP, validation, error handler
│   │   ├── routes/           # Catalog, health, and redirect routers
│   │   ├── services/         # Business logic for catalog querying & URL resolution
│   │   ├── types/            # TypeScript schemas & API contracts
│   │   ├── app.ts            # Express application factory
│   │   └── server.ts         # Server entrypoint
│   └── tests/                # Security, concurrency, redirect, and catalog tests
├── frontend/                 # React 19 + Vite + Tailwind CSS Editorial UI
│   ├── src/
│   │   ├── components/       # Header, ProductCard, ProductGrid, WishlistDrawer, etc.
│   │   ├── context/          # ViewContext (grid view mode) & WishlistContext
│   │   ├── data/             # Resilient local fallback catalog
│   │   ├── services/         # API client with automatic offline fallback
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main storefront component
│   │   └── main.tsx          # React application entrypoint
│   └── tests/                # Component unit and user integration tests
├── e2e/                      # Playwright End-to-End browser test suite
├── playwright.config.ts      # Playwright configuration
├── vitest.config.ts          # Vitest workspace configuration
├── tsconfig.json             # Root TypeScript project references
└── package.json              # Root workspace manifest
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/rabavadev/fashion-affiliate-store.git
cd fashion-affiliate-store

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 🏃 Running the Application

### 1. Start the Backend API Server
```bash
cd backend
npm run dev
# Backend runs at http://localhost:5000 (API at /api/v1/catalog)
```

### 2. Start the Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🧪 Testing & Quality Assurance

The project comes with a comprehensive multi-tier automated test suite covering unit, security, concurrency, integration, and E2E flows (114 passing tests):

```bash
# Run all unit and integration tests (backend + frontend)
npm run test

# Run backend security & redirect verification specifically
npm run test:security

# Run concurrency tests
npm run test:concurrency

# Run end-to-end browser tests with Playwright
npm run test:e2e

# Run the complete test suite
npm run test:all
```

---

## 🔒 Security Architecture Highlights

| Layer | Mechanism | Protection |
|---|---|---|
| **Affiliate Redirects** | Domain Whitelisting & Normalization | Prevents open redirect exploits, phishing, and malformed URLs |
| **Tamper Resistance** | HMAC Signature Verification (optional) | Guarantees outbound tracking link authenticity |
| **Network Security** | SSRF Defense | Blocks loopback, RFC1918 private IPs, and cloud metadata access |
| **HTTP Headers** | Helmet + Strict CSP | Blocks XSS, clickjacking (`DENY`), and MIME sniffing |
| **Traffic Shaping** | Express Rate Limit | Mitigates brute-force attacks and click fraud |
| **Input Sanitation** | Zod + HPP (HTTP Parameter Pollution) | Protects query parameters and payload boundaries |

---

## 📄 License

This project is private and proprietary. All rights reserved.
