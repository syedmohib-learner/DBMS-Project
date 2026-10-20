import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  ShoppingCart,
  Receipt,
  Eye,
  RotateCcw,
  Package,
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

export default function Dashboard() {
  const { isOwner } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, lowRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/products/low-stock'),
      ]);
      setSummary(sumRes.data.summary);
      setLowStockProducts(lowRes.data.products);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVoidSale = async (saleId) => {
    if (!window.confirm(`Are you sure you want to void Sale #${saleId}? This will restore stock items and reverse customer credit.`)) {
      return;
    }
    try {
      await api.patch(`/sales/${saleId}/void`);
      alert('Sale voided successfully. Stock restored.');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void sale');
    }
  };

  const handleViewReceipt = async (saleId) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setActiveReceipt(res.data.sale);
    } catch (err) {
      alert('Failed to load receipt details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Overview Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">Real-time inventory levels, cash flow, and counter sales.</p>
        </div>
        <Link
          to="/pos"
          className="flex items-center justify-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Open POS Counter (Billing)</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Sales</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              Rs. {summary?.today_sales?.toLocaleString() || '0.00'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{summary?.today_sales_count || 0} bills completed today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Profit (Owner Only) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Net Profit</p>
            {isOwner ? (
              <>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  Rs. {summary?.today_profit?.toLocaleString() || '0.00'}
                </h3>
                <p className="text-xs text-emerald-700 mt-1">Revenue minus item costs</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-400 mt-1">Restricted</h3>
                <p className="text-xs text-gray-400 mt-1">Owner access required</p>
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Items</p>
            <h3 className={`text-2xl font-bold mt-1 ${summary?.low_stock_count > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {summary?.low_stock_count || 0}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Below reorder threshold</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${summary?.low_stock_count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Outstanding Udhaar (Customer Credit) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Udhaar</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              Rs. {summary?.total_outstanding_credit?.toLocaleString() || '0.00'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Outstanding credit balance</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low-Stock Attention Alert Panel */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900 text-sm">
                Critical Stock Alerts ({lowStockProducts.length} items need replenishment)
              </h3>
            </div>
            {isOwner && (
              <Link to="/purchases" className="text-xs font-bold text-amber-800 hover:underline">
                Order from Suppliers &rarr;
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.slice(0, 6).map((item) => (
              <div key={item.product_id} className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs shadow-xs">
                <div>
                  <p className="font-bold text-gray-900">{item.product_name}</p>
                  <p className="text-gray-500">{item.category_name || 'General'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full">
                    Stock: {item.current_stock_level}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Min: {item.reorder_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Counter Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Counter Sales</h3>
            <p className="text-xs text-gray-500">Real-time point-of-sale transaction ledger</p>
          </div>
          <Link to="/pos" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            Create New Bill +
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {(summary?.recent_sales || []).length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No sales recorded yet. Click "Open POS Counter" to create your first sale.
                  </td>
                </tr>
              ) : (
                summary?.recent_sales?.map((sale) => (
                  <tr key={sale.sale_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      INV-{String(sale.sale_id).padStart(5, '0')}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(sale.sale_date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{sale.cashier_name}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      Rs. {parseFloat(sale.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      Rs. {parseFloat(sale.paid_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          sale.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewReceipt(sale.sale_id)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="View Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {isOwner && sale.status === 'completed' && (
                          <button
                            onClick={() => handleVoidSale(sale.sale_id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Void Sale & Restore Stock"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal sale={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
}
