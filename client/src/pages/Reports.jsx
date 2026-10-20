import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, DollarSign, Award, Calendar } from 'lucide-react';

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [salesReport, setSalesReport] = useState([]);
  const [profitSummary, setProfitSummary] = useState(null);
  const [profitBreakdown, setProfitBreakdown] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, profitRes, topRes] = await Promise.all([
        api.get(`/reports/sales?period=${period}`),
        api.get('/reports/profit'),
        api.get('/reports/top-products'),
      ]);

      setSalesReport(salesRes.data.report || []);
      setProfitSummary(profitRes.data.summary);
      setProfitBreakdown(profitRes.data.daily_breakdown || []);
      setTopProducts(topRes.data.top_products || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (salesReport.length === 0) {
      alert('No sales data available to export.');
      return;
    }

    const headers = ['Period', 'Date', 'Transaction Count', 'Total Revenue', 'Total Collected'];
    const rows = salesReport.map((r) => [
      r.period_label,
      new Date(r.sort_date).toLocaleDateString(),
      r.transaction_count,
      r.total_revenue,
      r.total_collected,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Profit Reports</h1>
          <p className="text-sm text-gray-500">Financial insights, cost vs profit margins, and bestseller trends</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border rounded-xl p-1 flex">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  period === p ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">30-Day Revenue</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            Rs. {profitSummary?.total_revenue?.toLocaleString() || '0.00'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Gross sales turnover</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">30-Day Cost of Goods (COGS)</p>
          <h3 className="text-2xl font-bold text-slate-700 mt-1">
            Rs. {profitSummary?.total_cost?.toLocaleString() || '0.00'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Wholesale inventory purchase cost</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Net Realized Profit</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            Rs. {profitSummary?.total_profit?.toLocaleString() || '0.00'}
          </h3>
          <p className="text-xs text-emerald-700 mt-1">Revenue minus COGS</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Profit Margin</p>
          <h3 className="text-2xl font-bold text-teal-600 mt-1">
            {profitSummary?.profit_margin_pct || '0'}%
          </h3>
          <p className="text-xs text-teal-700 mt-1">Net profit margin percentage</p>
        </div>
      </div>

      {/* Chart 1: Sales & Revenue Trend */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 text-sm">
            Sales & Revenue Trend ({period.toUpperCase()})
          </h3>
          <p className="text-xs text-gray-500">Gross revenue volume over time</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesReport}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Revenue']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="total_revenue" name="Total Revenue (Rs.)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_collected" name="Cash Collected (Rs.)" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Net Profit Trend */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Net Profit Timeline (30 Days)</h3>
          <p className="text-xs text-gray-500">Actual profit calculation = (Sale Price - Cost Price) × Sold Quantity</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitBreakdown}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Profit']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="profit" name="Net Profit (Rs.)" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="revenue" name="Total Revenue (Rs.)" stroke="#94a3b8" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900 text-sm">Best-Selling Items by Volume & Profit</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Profit Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {topProducts.map((p, idx) => (
                <tr key={p.product_id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{p.product_name}</td>
                  <td className="py-3 px-4 text-gray-500">{p.category_name || 'General'}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-800">{p.units_sold} units</td>
                  <td className="py-3 px-4 text-right font-medium">Rs. {parseFloat(p.total_sales_volume).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    Rs. {parseFloat(p.total_profit_generated).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
