const db = require('../config/db');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category_id, low_stock, active_only = 'true' } = req.query;

    let query = `
      SELECT p.*, c.category_name, s.supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE 1=1
    `;
    const params = [];

    if (active_only === 'true') {
      params.push(true);
      query += ` AND p.is_active = $${params.length}`;
    }

    if (category_id) {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (p.product_name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    if (low_stock === 'true') {
      query += ` AND p.current_stock_level <= p.reorder_level`;
    }

    query += ` ORDER BY p.product_name ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.category_name, s.supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE p.is_active = TRUE AND p.current_stock_level <= p.reorder_level
       ORDER BY p.current_stock_level ASC`
    );
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT p.*, c.category_name, s.supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE p.product_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const {
      product_name,
      category_id,
      supplier_id,
      description,
      cost_price,
      sale_price,
      current_stock_level = 0,
      reorder_level = 5,
    } = req.body;

    if (!product_name || !category_id || cost_price === undefined || sale_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category, cost price, and sale price are required.',
      });
    }

    const result = await db.query(
      `INSERT INTO products 
        (product_name, category_id, supplier_id, description, cost_price, sale_price, current_stock_level, reorder_level, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING *`,
      [
        product_name.trim(),
        category_id,
        supplier_id || null,
        description,
        parseFloat(cost_price),
        parseFloat(sale_price),
        parseInt(current_stock_level, 10),
        parseInt(reorder_level, 10),
      ]
    );

    res.status(201).json({ success: true, product: result.rows[0], message: 'Product created successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      category_id,
      supplier_id,
      description,
      cost_price,
      sale_price,
      current_stock_level,
      reorder_level,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE products
       SET product_name = COALESCE($1, product_name),
           category_id = COALESCE($2, category_id),
           supplier_id = COALESCE($3, supplier_id),
           description = COALESCE($4, description),
           cost_price = COALESCE($5, cost_price),
           sale_price = COALESCE($6, sale_price),
           current_stock_level = COALESCE($7, current_stock_level),
           reorder_level = COALESCE($8, reorder_level),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $10
       RETURNING *`,
      [
        product_name?.trim(),
        category_id,
        supplier_id,
        description,
        cost_price !== undefined ? parseFloat(cost_price) : null,
        sale_price !== undefined ? parseFloat(sale_price) : null,
        current_stock_level !== undefined ? parseInt(current_stock_level, 10) : null,
        reorder_level !== undefined ? parseInt(reorder_level, 10) : null,
        is_active,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product: result.rows[0], message: 'Product updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product appears in sales or purchases
    const usageCheck = await db.query(
      `SELECT 
         (SELECT COUNT(*) FROM sales_items WHERE product_id = $1) AS sale_count,
         (SELECT COUNT(*) FROM purchase_items WHERE product_id = $1) AS purchase_count`,
      [id]
    );

    const { sale_count, purchase_count } = usageCheck.rows[0];

    // As specified in SDS: products used in past sales/purchases are deactivated instead of deleted
    if (parseInt(sale_count, 10) > 0 || parseInt(purchase_count, 10) > 0) {
      await db.query(`UPDATE products SET is_active = FALSE WHERE product_id = $1`, [id]);
      return res.json({
        success: true,
        message: 'Product has transaction history and was deactivated instead of deleted (per business rule).',
      });
    }

    const result = await db.query(`DELETE FROM products WHERE product_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (err) {
    next(err);
  }
};
