import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Building2,
  BarChart3,
  UserCog,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function Sidebar() {
  const { user, isOwner } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'Billing (POS)', icon: ShoppingCart },
    { to: '/products', label: 'Inventory & Stock', icon: Package },
    { to: '/customers', label: 'Customers & Udhaar', icon: Users },
    ...(isOwner
      ? [
          { to: '/purchases', label: 'Purchases (Stock In)', icon: Truck },
          { to: '/suppliers', label: 'Suppliers', icon: Building2 },
          { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
          { to: '/users', label: 'User Accounts', icon: UserCog },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/50">
          ST
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white leading-tight">Shop Tracker</h1>
          <p className="text-xs text-slate-400">Inventory & POS</p>
        </div>
      </div>

      {/* User Info Capsule */}
      <div className="p-4 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
          {isOwner ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <User className="w-5 h-5 text-sky-400" />}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">{user?.name || user?.username}</p>
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
              isOwner ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        <p>DBMS Project • Version 1.0</p>
        <p className="text-slate-400 mt-0.5">Syed Mohib, Univ. of Karachi</p>
      </div>
    </aside>
  );
}
