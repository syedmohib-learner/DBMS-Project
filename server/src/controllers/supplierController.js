const db = require('../config/db');

exports.getSuppliers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, 
              COUNT(p.purchase_id)::int AS total_purchases,
              COALESCE(SUM(p.total_cost), 0) AS total_spent
       FROM suppliers s
       LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
       GROUP BY s.supplier_id
       ORDER BY s.supplier_name ASC`
    );
    res.json({ success: true, suppliers: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { supplier_name, contact_person, phone_number, email, address, contact_details } = req.body;
    if (!supplier_name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }

    const result = await db.query(
      `INSERT INTO suppliers (supplier_name, contact_person, phone_number, email, address, contact_details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [supplier_name.trim(), contact_person, phone_number, email, address, contact_details]
    );

    res.status(201).json({ success: true, supplier: result.rows[0], message: 'Supplier added successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_person, phone_number, email, address, contact_details } = req.body;

    const result = await db.query(
      `UPDATE suppliers
       SET supplier_name = COALESCE($1, supplier_name),
           contact_person = COALESCE($2, contact_person),
           phone_number = COALESCE($3, phone_number),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           contact_details = COALESCE($6, contact_details)
       WHERE supplier_id = $7
       RETURNING *`,
      [supplier_name?.trim(), contact_person, phone_number, email, address, contact_details, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    res.json({ success: true, supplier: result.rows[0], message: 'Supplier updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const purchaseCheck = await db.query(`SELECT 1 FROM purchases WHERE supplier_id = $1 LIMIT 1`, [id]);
    if (purchaseCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with recorded purchase transactions. Keep for audit history.',
      });
    }

    const result = await db.query(`DELETE FROM suppliers WHERE supplier_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    res.json({ success: true, message: 'Supplier deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
