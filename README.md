# 🌸 CANDELA — Premium Feminine Fragrance Store

A luxury e-commerce ordering website for CANDELA, built with Next.js 14, Framer Motion, and Prisma.

## 🚀 Quick Start

Open a terminal in this folder (`candela-store`) and run:

```bash
# 1. Set up the database (creates dev.db with all products & admin)
npm run db:push
npm run db:seed

# 2. Start the development server
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 🔐 Admin Dashboard

- **URL**: http://localhost:3000/admin
- **Email**: `admin@candela.store`
- **Password**: `candela2024`

> ⚠️ Change your admin password in the Settings page after first login.

---

## 📁 Project Structure

```
candela-store/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage (immersive)
│   ├── shop/               # Product catalog
│   ├── product/[id]/       # Product detail
│   ├── order/              # Order form
│   ├── track/              # Order tracker
│   ├── about/              # About page
│   ├── contact/            # Contact page
│   └── admin/              # Admin dashboard (protected)
│       ├── page.tsx        # Overview
│       ├── orders/         # Order management
│       ├── products/       # Product CRUD
│       ├── customers/      # Customer list
│       ├── messages/       # Customer chat
│       ├── analytics/      # Store analytics
│       └── settings/       # Store configuration
├── components/
│   ├── store/              # Customer-facing components
│   └── admin/              # Admin dashboard components
├── lib/                    # Utilities (db, auth, utils)
├── store/                  # Zustand state management
├── prisma/                 # Database schema & seed
└── public/
    └── images/
        ├── logo.jpg        # Candela brand logo
        └── products/       # All 28 product images
```

---

## 🛒 How the Store Works

1. **Customer** browses products → adds to bag → fills order form
2. **Order** is saved to database → customer receives order number
3. **Owner** sees order in admin dashboard → updates status → customer can track it
4. No online payment — Candela contacts the customer directly

---

## 👑 Admin Features

| Feature | Description |
|---|---|
| **Orders** | View all orders, filter by status, update order status |
| **Products** | Add/edit/delete products, toggle stock & featured |
| **Customers** | View all customers and their order history |
| **Messages** | Chat with customers in real-time |
| **Analytics** | Real order/revenue stats, top products |
| **Settings** | Configure phone, social media, delivery note |

---

## 🌸 Tech Stack

- **Next.js 14** — Full-stack framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling with custom Candela design tokens
- **Framer Motion** — Premium animations
- **Prisma + SQLite** — Database
- **NextAuth.js** — Admin authentication
- **Zustand** — State management

---

## 🔄 Deployment

For public deployment, we recommend **Vercel**:

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Set environment variables:
   - `DATABASE_URL` (use PostgreSQL for production)
   - `NEXTAUTH_SECRET` (any random string)
   - `NEXTAUTH_URL` (your domain)
4. Deploy!
