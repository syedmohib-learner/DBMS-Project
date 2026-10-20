# Inventory and Sales Tracker for Small Shops

> **A full-stack, enterprise-grade web application with Frontend, Backend, Database, REST API, and Deployment.**  
> Aligned with IEEE-standard Software Requirements Specification (SRS), Software Design Specification (SDS), Data Flow Diagrams (DFD), and Entity-Relationship Diagram (ERD).
> 
> **Author:** Syed Mohib  
> **Institution:** University of Karachi  
> **Course:** Database Management Systems (DBMS)  
> **Version:** 1.0 (October 2026)

---

## 🏗️ Architecture & Technology Stack

The system implements a classic **three-tier client-server architecture**:

```
┌─────────────────────────────────┐
│        Presentation Tier        │
│       React 18 + Vite SPA       │
│  Tailwind CSS • Recharts • POS  │
└────────────────┬────────────────┘
                 │ HTTPS / JSON (REST API + JWT)
                 ▼
┌─────────────────────────────────┐
│        Application Tier         │
│     Node.js + Express API       │
│   Auth • Transactions • Roles   │
└────────────────┬────────────────┘
                 │ PostgreSQL Driver (pg pool)
                 ▼
┌─────────────────────────────────┐
│            Data Tier            │
│         PostgreSQL 16           │
│  Relational Tables • Locks • FK │
└─────────────────────────────────┘
```

| Layer | Technologies & Purpose |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Recharts, Axios |
| **Backend** | Node.js, Express, bcryptjs, jsonwebtoken, helmet, cors, morgan, express-validator |
| **Database** | PostgreSQL 16 (ACID Transactions, Row Locks `SELECT FOR UPDATE`, Foreign Keys, Indexes) |
| **API** | Stateless RESTful JSON API with JWT authentication and Role-Based Access Control |
| **Deployment** | Docker & Docker Compose, Nginx, Render Blueprint (`render.yaml`), Vercel config |

---

## 🌟 Key Features (Mapped to SRS & SDS)

1. **Role-Based Access Control (SRS FR-1, FR-2)**
   * **Store Owner:** Complete administrative oversight — managing products, wholesale supplier purchases, customer debts, user accounts, and financial profit analytics.
   * **Cashier:** Streamlined billing interface — item barcode/name search, sales receipt issuance, viewing product stock, receiving customer udhaar paybacks. Restricted from profit figures and record deletion.

2. **High-Speed Point of Sale (POS) Billing (SRS FR-7, FR-8, FR-10)**
   * Rapid item lookup with live stock availability indicators.
   * Quantity increment/decrement with stock limit guards.
   * Automatic stock deduction executed within an **atomic database transaction**.
   * Change due or Udhaar credit calculated in real-time.
   * **Instant printable thermal receipts** formatted with itemized subtotals, shop branding, and cashier details.

3. **Customer Udhaar (Credit) & Account Ledger (SRS FR-9, FR-11)**
   * Automatic credit balance updates when a customer pays partially or on credit.
   * Dedicated **Customer Ledger** showing chronological purchases, payments, and running balances.
   * Receipt recording for credit paybacks with automatic balance decrement.

4. **Supplier Management & Stock-In (Purchases) (SRS FR-6)**
   * Wholesale supplier directory with total purchase spend tracking.
   * Multi-item purchase receipt entry that automatically increases inventory stock and updates cost prices.

5. **Real-Time Low Stock Alerts (SRS FR-5)**
   * Automatic detection of items at or below reorder threshold.
   * Attention banner on dashboard and persistent navbar pill for proactive restocking.

6. **Financial Reports & Analytics (SRS FR-12, FR-13)**
   * Daily, weekly, and monthly sales graphs via Recharts.
   * Net profit calculations: $\text{Profit} = \sum (\text{Sale Price} - \text{Cost Price}) \times \text{Sold Quantity}$.
   * Best-selling products ranked by sales volume and profit generated.
   * One-click **CSV data export**.

---

## 🗄️ Database Schema (ERD & SDS Compliant)

The database schema (`database/schema.sql`) contains 11 normalized relational tables:

1. `roles` (`role_id`, `role_name`)
2. `users` (`user_id`, `name`, `username`, `password_hash`, `role_id`, `is_active`, `created_at`)
3. `categories` (`category_id`, `category_name`, `description`, `created_at`)
4. `suppliers` (`supplier_id`, `supplier_name`, `contact_person`, `phone_number`, `email`, `address`)
5. `products` (`product_id`, `product_name`, `category_id`, `supplier_id`, `cost_price`, `sale_price`, `current_stock_level`, `reorder_level`, `is_active`)
6. `customers` (`customer_id`, `customer_name`, `phone_number`, `email`, `current_credit_balance`)
7. `purchases` (`purchase_id`, `supplier_id`, `user_id`, `purchase_date`, `total_cost`, `notes`)
8. `purchase_items` (`purchase_item_id`, `purchase_id`, `product_id`, `quantity_received`, `unit_cost`, `subtotal`)
9. `sales` (`sale_id`, `customer_id`, `user_id`, `sale_date`, `total_amount`, `paid_amount`, `payment_method`, `status`, `notes`)
10. `sales_items` (`sales_item_id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `unit_cost`, `subtotal`)
11. `payments` (`payment_id`, `customer_id`, `user_id`, `amount`, `payment_date`, `notes`)

---

## 📡 REST API Reference

All protected endpoints require the HTTP header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication & Users
* `POST /api/auth/login` — Public: verify credentials and receive JWT
* `GET /api/auth/me` — Authenticated: get profile of current user
* `GET /api/auth/users` — Owner: list staff accounts
* `POST /api/auth/users` — Owner: create staff account
* `PUT /api/auth/users/:id` — Owner: activate/deactivate account or reset password

### Products & Inventory
* `GET /api/products` — Both: list products with search and category filters
* `GET /api/products/low-stock` — Both: list items at or below reorder level
* `GET /api/products/:id` — Both: get product details
* `POST /api/products` — Owner: create product
* `PUT /api/products/:id` — Owner: update product
* `DELETE /api/products/:id` — Owner: safe deactivation / delete

### Point of Sale & Billing
* `POST /api/sales` — Both: create sale transaction (atomic stock lock & credit update)
* `GET /api/sales` — Both: list sales with filters
* `GET /api/sales/:id` — Both: get detailed sale & receipt info
* `PATCH /api/sales/:id/void` — Owner: void sale, restore inventory, reverse credit

### Customers & Udhaar
* `GET /api/customers` — Both: list customers with credit balances
* `POST /api/customers` — Both: register new customer
* `POST /api/customers/:id/payments` — Both: record udhaar debt payment
* `GET /api/customers/:id/ledger` — Both: chronological audit ledger of sales and payments

### Suppliers & Purchases
* `GET /api/suppliers` — Owner: supplier directory
* `POST /api/suppliers` — Owner: add supplier
* `GET /api/purchases` — Owner: purchase orders list
* `POST /api/purchases` — Owner: record stock-in delivery from supplier

### Reports & Analytics
* `GET /api/reports/summary` — Both: dashboard statistics (profit masked for Cashier)
* `GET /api/reports/sales?period=daily|weekly|monthly` — Owner: sales trends
* `GET /api/reports/profit` — Owner: net profit analysis
* `GET /api/reports/top-products` — Owner: bestseller rankings

---

## 🚀 Quick Start (Local Setup)

The browser sends requests to the Express API; the API writes to the PostgreSQL
database configured for the **server**. To use Supabase while running locally,
configure the server's `DATABASE_URL`—a frontend environment variable does not
select the database.

### 1. Configure the Database

Edit `server/.env` and choose one database setup:

**Supabase PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
JWT_SECRET=replace-with-a-long-random-secret
```

Copy the PostgreSQL **URI** from Supabase **Project Settings → Database →
Connection string** and replace the placeholders. Do not use the Supabase
`https://...supabase.co` project URL. If your database password contains
reserved URI characters, URL-encode them. Apply `database/supabase_setup.sql`
in the Supabase SQL Editor only when setting up an empty database; it drops
existing tables.

**Local PostgreSQL instead:**
```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_sales_tracker
JWT_SECRET=replace-with-a-long-random-secret
```

When `DATABASE_URL` is set, it takes precedence over the local `DB_*` settings.

### 2. Initialize a New Local Database (if needed)

Only run this for a new local database: the schema script drops and recreates
the app's tables.
```bash
npm --prefix server run db:init
```

### 3. Launch Development Servers
* **Option A (One-click Windows Batch):**  
  Double-click **`run-app.bat`** in the project root.
* **Option B (Manual Terminal):**
  ```bash
  # Terminal 1: Backend
  cd server
  npm run dev

  # Terminal 2: Frontend
  cd client
  npm run dev
  ```

Open your browser at **`http://localhost:5173`**.
The Vite development server proxies `/api` requests to the API on port 5000.
After changing `server/.env`, restart the backend so it loads the new database
connection.

---

## 👥 Demo Logins

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Store Owner** | `owner` | `admin123` | Full access (Billing, Stock, Profit Reports, Purchases, Users) |
| **Store Cashier** | `cashier` | `admin123` | Counter Billing, Receipts, Product Availability, Customer Payments |

*(Quick demo buttons are also provided directly on the login screen for instant testing).*

---

## ☁️ Cloud Deployment (Vercel + Supabase)

The application is pre-configured and optimized for 1-click cloud deployment:
1. **Database:** Execute [`database/supabase_setup.sql`](file:///c:/Users/SYED%20MOHIB/Documents/DBMS/database/supabase_setup.sql) in [Supabase](https://supabase.com) SQL Editor.
2. **Web App:** Connect repository to [Vercel](https://vercel.com).
3. **Environment Variables:** Provide only `DATABASE_URL` (from Supabase) and `JWT_SECRET`.

See **[DEPLOYMENT.md](file:///c:/Users/SYED%20MOHIB/Documents/DBMS/DEPLOYMENT.md)** for complete step-by-step instructions.

---

## 🐳 Docker Deployment

To launch the complete application with Docker Compose:
```bash
docker-compose up --build
```
Access the application at `http://localhost`. See [DEPLOYMENT.md](file:///c:/Users/SYED%20MOHIB/Documents/DBMS/DEPLOYMENT.md) for Render, Railway, and Vercel guides.
