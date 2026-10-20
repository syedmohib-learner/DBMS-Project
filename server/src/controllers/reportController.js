const db = require('../config/db');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const isOwner = req.user.role === 'owner';

    // 1. Today's sales summary
    const todaySales = await db.query(
      `SELECT 
         COALESCE(SUM(total_amount), 0) AS total_sales,
         COUNT(sale_id)::int AS sales_count,
         COALESCE(SUM(paid_amount), 0) AS total_collected
       FROM sales
       WHERE status = 'completed' AND sale_date >= CURRENT_DATE`
    );

    // 2. Today's profit (Owner only)
    let todayProfit = 0;
    if (isOwner) {
      const profitRes = await db.query(
        `SELECT COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0) AS profit
         FROM sales_items si
         JOIN sales s ON si.sale_id = s.sale_id
         WHERE s.status = 'completed' AND s.sale_date >= CURRENT_DATE`
      );
      todayProfit = parseFloat(profitRes.rows[0].profit || 0);
    }

    // 3. Counts: low-stock products, total products, total customers with credit
    const statsRes = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE) AS total_products,
         (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE AND current_stock_level <= reorder_level) AS low_stock_count,
         (SELECT COUNT(*)::int FROM customers) AS total_customers,
         (SELECT COALESCE(SUM(current_credit_balance), 0) FROM customers) AS total_outstanding_credit`
    );

    // 4. Recent sales (latest 5)
    const recentSales = await db.query(
      `SELECT s.sale_id, s.sale_date, s.total_amount, s.paid_amount, s.payment_method, s.status,
              c.customer_name, u.name AS cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.customer_id
       JOIN users u ON s.user_id = u.user_id
       ORDER BY s.sale_date DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      summary: {
        today_sales: parseFloat(todaySales.rows[0].total_sales),
        today_sales_count: todaySales.rows[0].sales_count,
        today_collected: parseFloat(todaySales.rows[0].total_collected),
        today_profit: isOwner ? todayProfit : null,
        total_products: statsRes.rows[0].total_products,
        low_stock_count: statsRes.rows[0].low_stock_count,
        total_customers: statsRes.rows[0].total_customers,
        total_outstanding_credit: parseFloat(statsRes.rows[0].total_outstanding_credit),
        recent_sales: recentSales.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    let intervalString;
    let dateFormat;

    if (period === 'monthly') {
      intervalString = '1 year';
      dateFormat = 'YYYY-MM';
    } else if (period === 'weekly') {
      intervalString = '8 weeks';
      dateFormat = 'IYYY-IW';
    } else {
      // daily (last 30 days)
      intervalString = '30 days';
      dateFormat = 'YYYY-MM-DD';
    }

    const result = await db.query(
      `SELECT 
         TO_CHAR(sale_date, '${dateFormat}') AS period_label,
         DATE_TRUNC('day', sale_date) AS sort_date,
         COUNT(sale_id)::int AS transaction_count,
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COALESCE(SUM(paid_amount), 0) AS total_collected
       FROM sales
       WHERE status = 'completed' AND sale_date >= CURRENT_DATE - INTERVAL '${intervalString}'
       GROUP BY period_label, sort_date
       ORDER BY sort_date ASC`
    );

    res.json({ success: true, period, report: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getProfitReport = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;

    const result = await db.query(
      `SELECT 
         DATE_TRUNC('day', s.sale_date)::date AS date,
         COALESCE(SUM(si.subtotal), 0) AS revenue,
         COALESCE(SUM(si.unit_cost * si.quantity), 0) AS cogs,
         COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0) AS profit
       FROM sales s
       JOIN sales_items si ON s.sale_id = si.sale_id
       WHERE s.status = 'completed' AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', s.sale_date)::date
       ORDER BY date ASC`
    );

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    result.rows.forEach((row) => {
      totalRevenue += parseFloat(row.revenue);
      totalCost += parseFloat(row.cogs);
      totalProfit += parseFloat(row.profit);
    });

    res.json({
      success: true,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin_pct: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0,
      },
      daily_breakdown: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const result = await db.query(
      `SELECT 
         p.product_id,
         p.product_name,
         c.category_name,
         COALESCE(SUM(si.quantity), 0)::int AS units_sold,
         COALESCE(SUM(si.subtotal), 0) AS total_sales_volume,
         COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0) AS total_profit_generated
       FROM sales_items si
       JOIN sales s ON si.sale_id = s.sale_id
       JOIN products p ON si.product_id = p.product_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE s.status = 'completed'
       GROUP BY p.product_id, p.product_name, c.category_name
       ORDER BY units_sold DESC
       LIMIT $1`,
      [parseInt(limit, 10)]
    );

    res.json({ success: true, top_products: result.rows });
  } catch (err) {
    next(err);
  }
};
