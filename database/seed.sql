-- ====================================================================
-- Inventory and Sales Tracker for Small Shops
-- Seed Data
-- ====================================================================

-- 1. ROLES
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'owner'),
    (2, 'cashier')
ON CONFLICT (role_id) DO NOTHING;

-- 2. USERS
-- Password for both users is 'admin123'
-- Hash for 'admin123': $2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m
INSERT INTO users (name, username, password_hash, role_id, is_active) VALUES
    ('Syed Mohib (Store Owner)', 'owner', '$2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m', 1, TRUE),
    ('Ahmed Ali (Store Cashier)', 'cashier', '$2a$10$3VHccVZAtmBpt.TYZo6WJO/w2Gd0t21wTCurRhRkXCNohKY73Dp1m', 2, TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. CATEGORIES
INSERT INTO categories (category_id, category_name, description) VALUES
    (1, 'Groceries & Staples', 'Flour, rice, pulses, cooking oils, and sugar'),
    (2, 'Beverages & Drinks', 'Tea, juices, soda, mineral water, and energy drinks'),
    (3, 'Dairy & Bakery', 'Milk, butter, bread, eggs, and cheese'),
    (4, 'Snacks & Confectionery', 'Biscuits, chips, chocolates, and cookies'),
    (5, 'Personal & Home Care', 'Soaps, detergents, shampoos, and cleaning supplies')
ON CONFLICT (category_name) DO NOTHING;

-- 4. SUPPLIERS
INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone_number, email, address) VALUES
    (1, 'National Foods Wholesale', 'Tariq Mehmood', '+92 300 1234567', 'sales@nationalwholesale.pk', 'Warehouse 14, SITE Area, Karachi'),
    (2, 'Beverage Distro Co.', 'Farhan Khan', '+92 321 9876543', 'orders@beveragedistro.com', 'Korangi Industrial Area, Karachi'),
    (3, 'Pak Dairy Goods', 'Zubair Shah', '+92 333 4567890', 'zubair@pakdairy.com', 'Federal B Area, Karachi')
ON CONFLICT DO NOTHING;

-- 5. PRODUCTS (Stock, Cost price, Sale price, Reorder levels)
-- Note: Some items have stock <= reorder_level to immediately test low-stock alerts
INSERT INTO products (product_name, category_id, supplier_id, description, cost_price, sale_price, current_stock_level, reorder_level, is_active) VALUES
    ('Basmati Rice Super Kernel 5kg', 1, 1, 'Premium long grain basmati rice', 1400.00, 1650.00, 24, 5, TRUE),
    ('Cooking Oil 1L Pouch', 1, 1, 'Double refined vegetable cooking oil', 450.00, 520.00, 30, 8, TRUE),
    ('Chakki Atta (Flour) 10kg', 1, 1, '100% whole wheat stone-ground flour', 1100.00, 1280.00, 15, 6, TRUE),
    ('Sugar Premium 1kg', 1, 1, 'Refined white crystal sugar', 130.00, 150.00, 4, 10, TRUE), -- Low stock alert!
    ('Tapal Danedar Tea 430g', 2, 2, 'Strong black tea blend', 680.00, 780.00, 18, 5, TRUE),
    ('Coca-Cola 1.5L', 2, 2, 'Chilled carbonated soft drink', 160.00, 200.00, 3, 12, TRUE), -- Low stock alert!
    ('Nestle Pure Life Water 1.5L', 2, 2, 'Clean mineral water bottle', 70.00, 100.00, 45, 10, TRUE),
    ('Dawn Bread Large Plain', 3, 3, 'Freshly baked sliced white bread', 140.00, 170.00, 2, 5, TRUE), -- Low stock alert!
    ('Olpers Milk 1L', 3, 3, 'UHT processed full cream milk', 270.00, 310.00, 35, 10, TRUE),
    ('Lays Masala Chips 45g', 4, 2, 'Crispy potato crisps spicy masala', 50.00, 70.00, 50, 15, TRUE),
    ('Super Biscuits Half Roll', 4, 2, 'Crisp sweet tea biscuits', 30.00, 40.00, 60, 20, TRUE),
    ('Lux Beauty Soap 135g', 5, 1, 'Soft moisturizing bar soap', 120.00, 150.00, 22, 6, TRUE)
ON CONFLICT DO NOTHING;

-- 6. CUSTOMERS (With initial credit / udhaar balances)
INSERT INTO customers (customer_name, phone_number, email, current_credit_balance) VALUES
    ('Kashif Siddiqui (Neighbor)', '+92 301 5550101', 'kashif.s@gmail.com', 1250.00), -- Outstanding Udhaar
    ('Hassan Raza (Regular)', '+92 312 5550202', 'hassan.raza@yahoo.com', 450.00),   -- Outstanding Udhaar
    ('Dr. Aslam', '+92 345 5550303', 'draslam@clinic.pk', 0.00),
    ('Walk-in Customer', NULL, NULL, 0.00)
ON CONFLICT DO NOTHING;

-- 7. INITIAL SAMPLE PURCHASES
INSERT INTO purchases (purchase_id, supplier_id, user_id, purchase_date, total_cost, notes) VALUES
    (1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 days', 50000.00, 'Opening inventory stock receipt')
ON CONFLICT (purchase_id) DO NOTHING;

INSERT INTO purchase_items (purchase_id, product_id, quantity_received, unit_cost, subtotal) VALUES
    (1, 1, 25, 1400.00, 35000.00),
    (1, 2, 33, 450.00, 14850.00)
ON CONFLICT DO NOTHING;

-- 8. INITIAL SAMPLE SALES
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

-- 9. RESET SERIAL SEQUENCES TO PREVENT ID CONFLICTS
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
