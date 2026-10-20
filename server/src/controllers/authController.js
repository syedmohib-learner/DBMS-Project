const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const result = await db.query(
      `SELECT u.user_id, u.name, u.username, u.password_hash, u.is_active, r.role_name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.username) = LOWER($1)`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact the shop owner.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const payload = {
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret_inventory_jwt_key_2026_xyz', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.username, u.is_active, r.role_name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.username, u.is_active, u.created_at, r.role_name AS role, r.role_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.user_id ASC`
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, username, password, role_id } = req.body;
    if (!name || !username || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'All fields (name, username, password, role_id) are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, username, password_hash, role_id, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING user_id, name, username, role_id, is_active, created_at`,
      [name.trim(), username.trim().toLowerCase(), password_hash, role_id]
    );

    res.status(201).json({ success: true, user: result.rows[0], message: 'User created successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_active, role_id, password } = req.body;

    let query = `UPDATE users SET name = COALESCE($1, name), is_active = COALESCE($2, is_active), role_id = COALESCE($3, role_id)`;
    let params = [name, is_active, role_id];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      query += `, password_hash = $4 WHERE user_id = $5 RETURNING user_id, name, username, role_id, is_active`;
      params.push(password_hash, id);
    } else {
      query += ` WHERE user_id = $4 RETURNING user_id, name, username, role_id, is_active`;
      params.push(id);
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: result.rows[0], message: 'User updated successfully.' });
  } catch (err) {
    next(err);
  }
};
