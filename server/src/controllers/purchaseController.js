const { pool } = require('../config/db');

exports.getPurchases = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.purchase_id, p.purchase_date, p.total_cost, p.notes,
              s.supplier_name, s.supplier_id,
              u.name AS recorded_by_name,
              COUNT(pi.purchase_item_id)::int AS item_count
       FROM purchases p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
       GROUP BY p.purchase_id, s.supplier_name, s.supplier_id, u.name
       ORDER BY p.purchase_date DESC`
    );
    res.json({ success: true, purchases: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseRes = await pool.query(
      `SELECT p.*, s.supplier_name, s.phone_number, s.contact_person, u.name AS recorded_by
       FROM purchases p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN users u ON p.user_id = u.user_id
       WHERE p.purchase_id = $1`,
      [id]
    );

    if (purchaseRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase record not found.' });
    }

    const itemsRes = await pool.query(
      `SELECT pi.*, pr.product_name
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.product_id
       WHERE pi.purchase_id = $1`,
      [id]
    );

    res.json({
      success: true,
      purchase: {
        ...purchaseRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createPurchase = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { supplier_id, items, notes } = req.body;
    const user_id = req.user.user_id;

    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID and a list of items are required.',
      });
    }

    await client.query('BEGIN');

    // 1. Calculate total cost and validate items
    let totalCost = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity_received || item.quantity_received <= 0) {
        throw new Error('Each purchase item must specify a valid product_id and positive quantity_received.');
      }
      const unitCost = parseFloat(item.unit_cost || 0);
      const qty = parseInt(item.quantity_received, 10);
      totalCost += unitCost * qty;
    }

    // 2. Insert purchase header
    const purchaseResult = await client.query(
      `INSERT INTO purchases (supplier_id, user_id, total_cost, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [supplier_id, user_id, totalCost, notes || null]
    );

    const purchase = purchaseResult.rows[0];

    // 3. Insert purchase items and update stock
    for (const item of items) {
      const qty = parseInt(item.quantity_received, 10);
      const unitCost = parseFloat(item.unit_cost || 0);
      const subtotal = unitCost * qty;

      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity_received, unit_cost, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchase.purchase_id, item.product_id, qty, unitCost, subtotal]
      );

      // Increase stock level and update latest cost price
      await client.query(
        `UPDATE products 
         SET current_stock_level = current_stock_level + $1,
             cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $3`,
        [qty, unitCost, item.product_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Stock purchase recorded successfully and inventory updated.',
      purchase,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
