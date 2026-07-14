# Meltaro Artisan Bakery & Café — MERN Stack

Full-stack production-ready MERN application.

```
meltaro/
├── backend/     Express + MongoDB Atlas + JWT auth
└── frontend/    React + Vite + Tailwind CSS
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install

# Copy env template and fill in your values
cp .env.example .env
# Required: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
# Optional: GEMINI_API_KEY (for Mello AI chatbot)

# Seed the database (menu items, categories, reviews, site content, admin user)
npm run seed

# Start development server (hot reload)
npm run dev
# → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_PROXY_TARGET defaults to http://localhost:5000 — change if needed

npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so the frontend
just calls `fetch('/api/menu')` without worrying about CORS or ports.

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/menu` | All menu items |
| GET | `/api/menu/:id` | Single menu item |
| GET | `/api/categories` | Homepage category tiles |
| GET | `/api/reviews` | Customer testimonials |
| GET | `/api/content` | Hero images, Instagram photos, contact info |
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/:id` | Order status lookup |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/newsletter` | Newsletter signup |
| POST | `/api/chat` | Mello chatbot |

### Admin Endpoints (Bearer JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |
| GET | `/api/auth/me` | Verify token / get current admin |
| GET | `/api/admin/orders` | All orders (newest first) |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| POST | `/api/admin/menu` | Create menu item |
| PUT | `/api/admin/menu/:id` | Update menu item |
| DELETE | `/api/admin/menu/:id` | Delete menu item |
| GET | `/api/admin/contact` | All contact messages |
| PATCH | `/api/admin/contact/:id/read` | Mark message as read |
| GET | `/api/admin/newsletter` | All newsletter subscribers |

### Order Statuses
`pending` → `confirmed` → `preparing` → `ready` → `completed` / `cancelled`

### Order Modes
`pickup` (free) · `delivery` ($5.99) · `carhop` ($2.50)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Min 16-char secret for signing tokens |
| `PORT` | | Default `5000` |
| `NODE_ENV` | | `development` or `production` |
| `CORS_ORIGIN` | | Comma-separated allowed origins |
| `JWT_EXPIRES_IN` | | Default `7d` |
| `ADMIN_EMAIL` | | Seeded admin account email |
| `ADMIN_PASSWORD` | | Seeded admin account password |
| `GEMINI_API_KEY` | | Powers Mello chatbot (optional) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full backend URL in production (empty in dev — proxy handles it) |
| `VITE_API_PROXY_TARGET` | Where Vite proxies `/api/*` in dev. Default `http://localhost:5000` |

---

## Production Deployment

### Backend
```bash
cd backend
npm run build      # tsc → dist/
npm start          # node dist/server.js
```

### Frontend
```bash
cd frontend
VITE_API_URL=https://your-backend-domain.com npm run build
# Serve dist/ via Nginx, Vercel, Netlify, etc.
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Database | MongoDB Atlas + Mongoose |
| Backend | Node.js + Express + TypeScript |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Security | Helmet + CORS + express-rate-limit |
| AI Chatbot | Google Gemini API |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
