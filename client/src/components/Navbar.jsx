import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchLowStockCount = async () => {
    try {
      const res = await api.get('/products/low-stock');
      setLowStockCount(res.data.count || 0);
    } catch (err) {
      // Ignore background error
    }
  };

  useEffect(() => {
    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-800">
          Small Shop Inventory & Sales Management
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Low-Stock Notification Pill */}
        {lowStockCount > 0 ? (
          <Link
            to="/products?filter=low-stock"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-sm animate-pulse"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{lowStockCount} Low Stock Item{lowStockCount > 1 ? 's' : ''}</span>
          </Link>
        ) : (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Stock Levels Healthy
          </span>
        )}

        {/* User Role Badge */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-gray-900">{user?.name}</p>
          <p className="text-[11px] text-gray-500 capitalize">{user?.role} session</p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
