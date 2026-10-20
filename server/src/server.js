require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    const res = await db.query('SELECT NOW()');
    console.log(`Connected to PostgreSQL database at ${res.rows[0].now}`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server due to database connection issue:', err.message);
    console.log('Starting server in fallback mode (DB reconnection will happen on request)...');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (Check DB configuration)`);
    });
  }
}

startServer();
