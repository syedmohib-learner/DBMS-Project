-- ====================================================================
-- Inventory and Sales Tracker for Small Shops
-- Database Schema (PostgreSQL)
-- Aligned with SRS, SDS, ERD, and DFD Specifications
-- Prepared by: Syed Mohib, University of Karachi
-- ====================================================================

-- Drop existing tables if needed (in reverse dependency order)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. ROLES TABLE
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUPPLIERS TABLE
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    contact_details VARCHAR(100),
    phone_number VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS TABLE
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    supplier_id INT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
    description TEXT,
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0),
    current_stock_level INT NOT NULL DEFAULT 0 CHECK (current_stock_level >= 0),
    reorder_level INT NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CUSTOMERS TABLE
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(100),
    current_credit_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PURCHASES TABLE (Stock In from Suppliers)
CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PURCHASE_ITEMS TABLE
CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity_received INT NOT NULL CHECK (quantity_received > 0),
    unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. SALES TABLE (POS Transactions)
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SALES_ITEMS TABLE
CREATE TABLE sales_items (
    sales_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

-- 11. PAYMENTS TABLE (Customer Udhaar Credit Paybacks)
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES (As specified in SDS Section 3.3)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock_level, reorder_level);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
