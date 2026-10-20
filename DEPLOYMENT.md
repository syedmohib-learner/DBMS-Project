# Deployment Guide — Inventory and Sales Tracker for Small Shops

This guide details production deployment paths, optimized for **Vercel** serverless hosting and **Supabase** cloud PostgreSQL.

---

## 🌟 1. Recommended: Vercel (Full-Stack) + Supabase (Cloud PostgreSQL)

This architecture deploys both the **Vite React Frontend** and the **Express REST API Serverless Backend** as a single, unified project on Vercel with zero CORS issues, backed by a high-performance managed **Supabase PostgreSQL** database.

### Step 1: Set Up Supabase Database (2 Minutes)

1. Sign up / Log in to [Supabase](https://supabase.com/).
2. Click **New Project** and name it `inventory-sales-tracker`. Set a strong database password (keep this password handy!).
3. Once the database is provisioned, go to the **SQL Editor** in the left navigation sidebar.
4. Click **New Query**.
5. Open [`database/supabase_setup.sql`](database/supabase_setup.sql) from this repository, copy its entire contents, and paste it into the Supabase SQL Editor.
6. Click **Run** (green button).
   * It will create all 11 tables (`roles`, `users`, `categories`, `suppliers`, `products`, `customers`, `purchases`, `purchase_items`, `sales`, `sales_items`, `payments`).
   * It will apply all performance indexes.
   * It will insert seed data (Owner & Cashier users, 5 retail categories, 3 suppliers, 12 products with low stock triggers, 4 customers with credit balances, sample purchases and POS sales).
   * It will align all auto-increment sequences.
   * It will output a verification table showing all entity counts.

7. Now retrieve your connection string:
   * Go to **Project Settings** (gear icon) $\to$ **Database**.
   * Under **Connection string**, select **URI**.
   * Choose either:
     * **Direct connection** (Port `5432`):
       ```
       postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
       ```
     * **Connection Pooling** (Port `6543`, recommended for high concurrency):
       ```
       postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres
       ```
   * Replace `[YOUR-PASSWORD]` with your actual database password.

---

### Step 2: Deploy to Vercel (1-Click Monorepo)

1. Push your repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** $\to$ **Project**.
3. Import your GitHub repository (`DBMS` / `inventory-and-sales-tracker`).
4. In the configuration screen:
   * **Framework Preset**: Leave as default or select **Other / Vite**.
   * **Root Directory**: `./` (leave default repository root).
   * **Build Command**: `npm run build` (pre-configured in `vercel.json`).
   * **Output Directory**: `client/dist` (pre-configured in `vercel.json`).
5. Open **Environment Variables** and add only these **two** simple variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` | Your Supabase connection string |
| `JWT_SECRET` | `supersecret_inventory_jwt_key_2026_xyz` | Any secure random secret for JWT sessions |

6. Click **Deploy**.

Vercel will automatically:
- Build the React Vite frontend and serve it on Vercel's global CDN with SPA deep-linking.
- Mount the Express backend as a high-performance serverless function under `/api/*` via `api/index.js`.
- Route all frontend `/api` calls directly to the backend with zero CORS issues!

---

### Step 3: Log In & Verify

Once deployed, open your Vercel deployment URL (e.g. `https://your-app.vercel.app`):
- **Store Owner Login**:
  - Username: `owner`
  - Password: `admin123`
  - Access: Full owner dashboard, POS billing, profit/loss reports, stock management, supplier purchases, udhaar credit management.
- **Store Cashier Login**:
  - Username: `cashier`
  - Password: `admin123`
  - Access: POS billing, customer lookups, product stock inquiry.
- **API Health Check**:
  - Visit `https://your-app.vercel.app/api/health` to confirm the backend is responding.

---

## 2. Alternative: Separate Frontend (Vercel) + Backend (Render / Railway)

If you prefer separating the frontend and backend onto different hosts:

### Backend on Render / Railway:
1. Create a Web Service pointing to the `server/` directory.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: Your JWT secret key.
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

### Frontend on Vercel:
1. In Vercel, set Root Directory to `client`.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`
4. Click Deploy (`client/vercel.json` will ensure SPA routes like `/products` don't 404 on refresh).

---

## 3. Alternative: Docker & Docker Compose (Self-Hosting)

The repository includes a ready-to-use `docker-compose.yml`:

```bash
# Build and start PostgreSQL + Express Backend + Vite React / Nginx Frontend
docker-compose up --build -d

# Check status
docker-compose ps

# Access application
# Frontend UI: http://localhost (or http://localhost:3000)
# Backend API: http://localhost:5000/api
```

---

## 4. Production Security & Optimization Summary

- [x] **Vercel Serverless Function**: Native Express adapter in `api/index.js`.
- [x] **Vite Bundle Optimization**: Split vendor, recharts, and lucide chunks for low latency on Vercel Edge.
- [x] **Supabase SSL Ready**: Automatic SSL handshake with `{ rejectUnauthorized: false }` for cloud databases.
- [x] **Serverless Connection Pooling**: Connection pool sizes throttled (`max: 5`) with 30-second idle timeouts to prevent connection exhaustion.
- [x] **SPA Routing Preservation**: Clean URL rewrites in `vercel.json` and `client/vercel.json`.
- [x] **Minimal Environment Setup**: Zero bloat — only `DATABASE_URL` and `JWT_SECRET` required.
