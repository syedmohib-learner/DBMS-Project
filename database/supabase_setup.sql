-- ====================================================================
-- Inventory and Sales Tracker for Small Shops
-- FINAL COMPLETE DATABASE SETUP FOR SUPABASE
-- ====================================================================
-- HOW TO RUN IN SUPABASE:
-- 1. Open your project on Supabase (https://supabase.com/dashboard)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire script and click "Run" (green button)
-- ====================================================================

SET search_path = public;

-- --------------------------------------------------------------------
-- STEP 1: CLEANUP EXISTING TABLES (in reverse dependency order)
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- STEP 2: CREATE TABLES WITH CONSTRAINTS AND FOREIGN KEYS
-- --------------------------------------------------------------------

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

-- 6. CUSTOMERS TABLE (with udhaar / credit tracking)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(100),
    current_credit_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PURCHASES TABLE (Stock In from Wholesale Suppliers)
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

-- 11. PAYMENTS TABLE (Customer Udhaar Paybacks)
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- STEP 3: CREATE PERFORMANCE INDEXES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- STEP 4: INSERT SEED DATA
-- --------------------------------------------------------------------

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'owner'),
    (2, 'cashier')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Default Users (Default Password for both is: admin123)
-- bcrypt hash for 'admin123': $2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m
INSERT INTO users (name, username, password_hash, role_id, is_active) VALUES
    ('Syed Mohib (Store Owner)', 'owner', '$2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m', 1, TRUE),
    ('Ahmed Ali (Store Cashier)', 'cashier', '$2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m', 2, TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. Retail Categories
INSERT INTO categories (category_id, category_name, description) VALUES
    (1, 'Groceries & Staples', 'Flour, rice, pulses, cooking oils, and sugar'),
    (2, 'Beverages & Drinks', 'Tea, juices, soda, mineral water, and energy drinks'),
    (3, 'Dairy & Bakery', 'Milk, butter, bread, eggs, and cheese'),
    (4, 'Snacks & Confectionery', 'Biscuits, chips, chocolates, and cookies'),
    (5, 'Personal & Home Care', 'Soaps, detergents, shampoos, and cleaning supplies')
ON CONFLICT (category_name) DO NOTHING;

-- 4. Suppliers
INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone_number, email, address) VALUES
    (1, 'National Foods Wholesale', 'Tariq Mehmood', '+92 300 1234567', 'sales@nationalwholesale.pk', 'Warehouse 14, SITE Area, Karachi'),
    (2, 'Beverage Distro Co.', 'Farhan Khan', '+92 321 9876543', 'orders@beveragedistro.com', 'Korangi Industrial Area, Karachi'),
    (3, 'Pak Dairy Goods', 'Zubair Shah', '+92 333 4567890', 'zubair@pakdairy.com', 'Federal B Area, Karachi')
ON CONFLICT DO NOTHING;

-- 5. Products (Includes realistic stock, cost, sale price, and low-stock alerts)
INSERT INTO products (product_name, category_id, supplier_id, description, cost_price, sale_price, current_stock_level, reorder_level, is_active) VALUES
    ('Basmati Rice Super Kernel 5kg', 1, 1, 'Premium long grain basmati rice', 1400.00, 1650.00, 24, 5, TRUE),
    ('Cooking Oil 1L Pouch', 1, 1, 'Double refined vegetable cooking oil', 450.00, 520.00, 30, 8, TRUE),
    ('Chakki Atta (Flour) 10kg', 1, 1, '100% whole wheat stone-ground flour', 1100.00, 1280.00, 15, 6, TRUE),
    ('Sugar Premium 1kg', 1, 1, 'Refined white crystal sugar', 130.00, 150.00, 4, 10, TRUE), -- Low stock alert
    ('Tapal Danedar Tea 430g', 2, 2, 'Strong black tea blend', 680.00, 780.00, 18, 5, TRUE),
    ('Coca-Cola 1.5L', 2, 2, 'Chilled carbonated soft drink', 160.00, 200.00, 3, 12, TRUE), -- Low stock alert
    ('Nestle Pure Life Water 1.5L', 2, 2, 'Clean mineral water bottle', 70.00, 100.00, 45, 10, TRUE),
    ('Dawn Bread Large Plain', 3, 3, 'Freshly baked sliced white bread', 140.00, 170.00, 2, 5, TRUE), -- Low stock alert
    ('Olpers Milk 1L', 3, 3, 'UHT processed full cream milk', 270.00, 310.00, 35, 10, TRUE),
    ('Lays Masala Chips 45g', 4, 2, 'Crispy potato crisps spicy masala', 50.00, 70.00, 50, 15, TRUE),
    ('Super Biscuits Half Roll', 4, 2, 'Crisp sweet tea biscuits', 30.00, 40.00, 60, 20, TRUE),
    ('Lux Beauty Soap 135g', 5, 1, 'Soft moisturizing bar soap', 120.00, 150.00, 22, 6, TRUE)
ON CONFLICT DO NOTHING;

-- 6. Customers (With Udhaar Credit balances)
INSERT INTO customers (customer_name, phone_number, email, current_credit_balance) VALUES
    ('Kashif Siddiqui (Neighbor)', '+92 301 5550101', 'kashif.s@gmail.com', 1250.00), -- Outstanding Udhaar
    ('Hassan Raza (Regular)', '+92 312 5550202', 'hassan.raza@yahoo.com', 450.00),   -- Outstanding Udhaar
    ('Dr. Aslam', '+92 345 5550303', 'draslam@clinic.pk', 0.00),
    ('Walk-in Customer', NULL, NULL, 0.00)
ON CONFLICT DO NOTHING;

-- 7. Sample Purchase
INSERT INTO purchases (purchase_id, supplier_id, user_id, purchase_date, total_cost, notes) VALUES
    (1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 days', 49850.00, 'Opening inventory stock receipt')
ON CONFLICT (purchase_id) DO NOTHING;

INSERT INTO purchase_items (purchase_id, product_id, quantity_received, unit_cost, subtotal) VALUES
    (1, 1, 25, 1400.00, 35000.00),
    (1, 2, 33, 450.00, 14850.00)
ON CONFLICT DO NOTHING;

-- 8. Sample Sales
INSERT INTO sales (sale_id, customer_id, user_id, sale_date, total_amount, paid_amount, payment_method, status, notes) VALUES
    (1, 1, 2, CURRENT_TIMESTAMP - INTERVAL '1 day', 2170.00, 920.00, 'Split/Credit', 'completed', 'Partial paid, remainder to udhaar balance'),
    (2, 2, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours', 580.00, 580.00, 'Cash', 'completed', 'Full cash payment')
ON CONFLICT (sale_id) DO NOTHING;

INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, unit_cost, subtotal) VALUES
    (1, 1, 1, 1650.00, 1400.00, 1650.00),
    (1, 2, 1, 520.00, 450.00, 520.00),
    (2, 7, 2, 100.00, 70.00, 200.00),
    (2, 9, 1, 310.00, 270.00, 310.00),
    (2, 10, 1, 70.00, 50.00, 70.00)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- STEP 5: SYNCHRONIZE SERIAL SEQUENCES
-- --------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), COALESCE(MAX(role_id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE(MAX(user_id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('suppliers', 'supplier_id'), COALESCE(MAX(supplier_id), 1)) FROM suppliers;
SELECT setval(pg_get_serial_sequence('products', 'product_id'), COALESCE(MAX(product_id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('customers', 'customer_id'), COALESCE(MAX(customer_id), 1)) FROM customers;
SELECT setval(pg_get_serial_sequence('purchases', 'purchase_id'), COALESCE(MAX(purchase_id), 1)) FROM purchases;
SELECT setval(pg_get_serial_sequence('purchase_items', 'purchase_item_id'), COALESCE(MAX(purchase_item_id), 1)) FROM purchase_items;
SELECT setval(pg_get_serial_sequence('sales', 'sale_id'), COALESCE(MAX(sale_id), 1)) FROM sales;
SELECT setval(pg_get_serial_sequence('sales_items', 'sales_item_id'), COALESCE(MAX(sales_item_id), 1)) FROM sales_items;

-- --------------------------------------------------------------------
-- STEP 6: VERIFICATION SUMMARY QUERY
-- --------------------------------------------------------------------
SELECT 
    'Database initialized successfully!' AS status,
    (SELECT COUNT(*) FROM roles) AS roles_count,
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM categories) AS categories_count,
    (SELECT COUNT(*) FROM suppliers) AS suppliers_count,
    (SELECT COUNT(*) FROM products) AS products_count,
    (SELECT COUNT(*) FROM customers) AS customers_count,
    (SELECT COUNT(*) FROM purchases) AS purchases_count,
    (SELECT COUNT(*) FROM sales) AS sales_count;
