const { pool } = require('../config/db');

exports.getSales = async (req, res, next) => {
  try {
    const { status, customer_id, startDate, endDate } = req.query;

    let query = `
      SELECT s.sale_id, s.sale_date, s.total_amount, s.paid_amount, s.payment_method, s.status, s.notes,
             c.customer_name, c.customer_id, c.phone_number AS customer_phone,
             u.name AS cashier_name,
             COUNT(si.sales_item_id)::int AS item_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN sales_items si ON s.sale_id = si.sale_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    if (customer_id) {
      params.push(customer_id);
      query += ` AND s.customer_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND s.sale_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND s.sale_date <= $${params.length}`;
    }

    query += `
      GROUP BY s.sale_id, c.customer_name, c.customer_id, c.phone_number, u.name
      ORDER BY s.sale_date DESC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, sales: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const saleRes = await pool.query(
      `SELECT s.*, 
              c.customer_name, c.phone_number AS customer_phone, c.current_credit_balance,
              u.name AS cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.customer_id
       JOIN users u ON s.user_id = u.user_id
       WHERE s.sale_id = $1`,
      [id]
    );

    if (saleRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale receipt not found.' });
    }

    const itemsRes = await pool.query(
      `SELECT si.*, pr.product_name, pr.reorder_level, pr.current_stock_level
       FROM sales_items si
       JOIN products pr ON si.product_id = pr.product_id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({
      success: true,
      sale: {
        ...saleRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createSale = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { customer_id, items, paid_amount, payment_method = 'Cash', notes } = req.body;
    const user_id = req.user.user_id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item must be added to the bill.' });
    }

    await client.query('BEGIN');

    // 1. Lock and validate each product, check stock
    const validatedItems = [];
    let calculatedTotal = 0;
    const lowStockAlerts = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item parameters: product_id and positive quantity are required.');
      }

      // SELECT FOR UPDATE locks row to prevent concurrent race conditions
      const prodRes = await client.query(
        `SELECT product_id, product_name, cost_price, sale_price, current_stock_level, reorder_level, is_active
         FROM products
         WHERE product_id = $1
         FOR UPDATE`,
        [item.product_id]
      );

      if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
        throw new Error(`Product ID ${item.product_id} is inactive or does not exist.`);
      }

      const product = prodRes.rows[0];
      const requestedQty = parseInt(item.quantity, 10);

      // Business Rule: Stock can never be negative
      if (product.current_stock_level < requestedQty) {
        const err = new Error(
          `Insufficient stock for "${product.product_name}". Available: ${product.current_stock_level}, Requested: ${requestedQty}`
        );
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : parseFloat(product.sale_price);
      const unitCost = parseFloat(product.cost_price);
      const subtotal = unitPrice * requestedQty;
      calculatedTotal += subtotal;

      const remainingStock = product.current_stock_level - requestedQty;

      if (remainingStock <= product.reorder_level) {
        lowStockAlerts.push({
          product_id: product.product_id,
          product_name: product.product_name,
          remaining_stock: remainingStock,
          reorder_level: product.reorder_level,
        });
      }

      validatedItems.push({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: requestedQty,
        unit_price: unitPrice,
        unit_cost: unitCost,
        subtotal,
        remainingStock,
      });
    }

    const numericPaid = paid_amount !== undefined ? parseFloat(paid_amount) : calculatedTotal;

    // Credit / Udhaar validation: If not fully paid, customer is mandatory
    if (numericPaid < calculatedTotal) {
      if (!customer_id) {
        const err = new Error('A customer must be selected for partial payment or credit (udhaar) sales.');
        err.statusCode = 400;
        throw err;
      }

      const unpaidDifference = calculatedTotal - numericPaid;
      await client.query(
        `UPDATE customers
         SET current_credit_balance = current_credit_balance + $1
         WHERE customer_id = $2`,
        [unpaidDifference, customer_id]
      );
    }

    // 2. Insert Sale record
    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, user_id, total_amount, paid_amount, payment_method, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6)
       RETURNING *`,
      [customer_id || null, user_id, calculatedTotal, numericPaid, payment_method, notes || null]
    );

    const sale = saleResult.rows[0];

    // 3. Insert sale items and deduct stock
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, unit_cost, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sale.sale_id, vItem.product_id, vItem.quantity, vItem.unit_price, vItem.unit_cost, vItem.subtotal]
      );

      await client.query(
        `UPDATE products
         SET current_stock_level = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [vItem.remainingStock, vItem.product_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      sale: {
        ...sale,
        items: validatedItems,
      },
      lowStockAlerts,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.voidSale = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const saleRes = await client.query(
      `SELECT * FROM sales WHERE sale_id = $1 FOR UPDATE`,
      [id]
    );

    if (saleRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale not found.' });
    }

    const sale = saleRes.rows[0];

    if (sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'This sale has already been voided.' });
    }

    // 1. Restore stock quantities
    const itemsRes = await client.query(`SELECT * FROM sales_items WHERE sale_id = $1`, [id]);
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE products 
         SET current_stock_level = current_stock_level + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 2. If sale had unpaid balance, revert customer's credit balance
    if (sale.customer_id && parseFloat(sale.total_amount) > parseFloat(sale.paid_amount)) {
      const unpaidDifference = parseFloat(sale.total_amount) - parseFloat(sale.paid_amount);
      await client.query(
        `UPDATE customers
         SET current_credit_balance = GREATEST(0, current_credit_balance - $1)
         WHERE customer_id = $2`,
        [unpaidDifference, sale.customer_id]
      );
    }

    // 3. Mark sale as voided
    await client.query(
      `UPDATE sales SET status = 'voided' WHERE sale_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sale was successfully voided. Stock has been restored and customer credit reversed.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
