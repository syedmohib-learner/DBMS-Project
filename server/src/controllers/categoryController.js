const db = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, COUNT(p.product_id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = TRUE
       GROUP BY c.category_id
       ORDER BY c.category_name ASC`
    );
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const result = await db.query(
      `INSERT INTO categories (category_name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [category_name.trim(), description]
    );

    res.status(201).json({ success: true, category: result.rows[0], message: 'Category created successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Category name already exists.' });
    }
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    const result = await db.query(
      `UPDATE categories
       SET category_name = COALESCE($1, category_name),
           description = COALESCE($2, description)
       WHERE category_id = $3
       RETURNING *`,
      [category_name?.trim(), description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, category: result.rows[0], message: 'Category updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if category has products
    const prodCheck = await db.query(`SELECT 1 FROM products WHERE category_id = $1 LIMIT 1`, [id]);
    if (prodCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category that contains products.' });
    }

    const result = await db.query(`DELETE FROM categories WHERE category_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
