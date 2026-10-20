const { pool } = require('../config/db');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, has_balance } = req.query;

    let query = `
      SELECT c.*, 
             COUNT(DISTINCT s.sale_id)::int AS total_sales,
             COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'completed'), 0) AS lifetime_spent
      FROM customers c
      LEFT JOIN sales s ON c.customer_id = s.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (c.customer_name ILIKE $${params.length} OR c.phone_number ILIKE $${params.length})`;
    }

    if (has_balance === 'true') {
      query += ` AND c.current_credit_balance > 0`;
    }

    query += `
      GROUP BY c.customer_id
      ORDER BY c.current_credit_balance DESC, c.customer_name ASC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, customers: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM customers WHERE customer_id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { customer_name, phone_number, email, initial_credit_balance = 0 } = req.body;
    if (!customer_name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    const result = await pool.query(
      `INSERT INTO customers (customer_name, phone_number, email, current_credit_balance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customer_name.trim(), phone_number, email, parseFloat(initial_credit_balance || 0)]
    );

    res.status(201).json({ success: true, customer: result.rows[0], message: 'Customer added successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer_name, phone_number, email } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET customer_name = COALESCE($1, customer_name),
           phone_number = COALESCE($2, phone_number),
           email = COALESCE($3, email)
       WHERE customer_id = $4
       RETURNING *`,
      [customer_name?.trim(), phone_number, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    res.json({ success: true, customer: result.rows[0], message: 'Customer updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    const user_id = req.user.user_id;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    await client.query('BEGIN');

    const customerRes = await client.query(
      `SELECT customer_id, customer_name, current_credit_balance 
       FROM customers 
       WHERE customer_id = $1 
       FOR UPDATE`,
      [id]
    );

    if (customerRes.rows.length === 0) {
      throw new Error('Customer not found.');
    }

    const customer = customerRes.rows[0];

    // Record payment
    const paymentRes = await client.query(
      `INSERT INTO payments (customer_id, user_id, amount, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, user_id, numAmount, notes || null]
    );

    // Update customer credit balance
    const updatedCustomer = await client.query(
      `UPDATE customers
       SET current_credit_balance = GREATEST(0, current_credit_balance - $1)
       WHERE customer_id = $2
       RETURNING *`,
      [numAmount, id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Payment of Rs. ${numAmount} recorded successfully. Remaining balance: Rs. ${updatedCustomer.rows[0].current_credit_balance}`,
      payment: paymentRes.rows[0],
      customer: updatedCustomer.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check customer exists
    const custRes = await pool.query(`SELECT * FROM customers WHERE customer_id = $1`, [id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Combine sales (debits/credits) and payments (credits)
    const ledgerRes = await pool.query(
      `
      SELECT 
        'sale' AS entry_type,
        s.sale_id AS reference_id,
        s.sale_date AS entry_date,
        s.total_amount,
        s.paid_amount,
        (s.total_amount - s.paid_amount) AS credit_added,
        0.00 AS payment_made,
        s.status,
        s.notes,
        u.name AS recorded_by
      FROM sales s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.customer_id = $1

      UNION ALL

      SELECT 
        'payment' AS entry_type,
        p.payment_id AS reference_id,
        p.payment_date AS entry_date,
        0.00 AS total_amount,
        0.00 AS paid_amount,
        0.00 AS credit_added,
        p.amount AS payment_made,
        'completed' AS status,
        p.notes,
        u.name AS recorded_by
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.customer_id = $1

      ORDER BY entry_date DESC
      `,
      [id]
    );

    res.json({
      success: true,
      customer: custRes.rows[0],
      ledger: ledgerRes.rows,
    });
  } catch (err) {
    next(err);
  }
};
