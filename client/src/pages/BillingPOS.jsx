import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  UserPlus,
  DollarSign,
  Package,
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

export default function BillingPOS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.get('/products?active_only=true'),
        api.get('/categories'),
        api.get('/customers'),
      ]);
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);
      setCustomers(custRes.data.customers);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  const addToCart = (product) => {
    if (product.current_stock_level <= 0) {
      alert(`"${product.product_name}" is currently out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.current_stock_level) {
          alert(`Cannot add more than available stock (${product.current_stock_level}) for "${product.product_name}".`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        const unitPrice = parseFloat(product.sale_price);
        return [
          ...prevCart,
          {
            product_id: product.product_id,
            product_name: product.product_name,
            unit_price: unitPrice,
            quantity: 1,
            max_stock: product.current_stock_level,
            subtotal: unitPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product_id === productId) {
          if (qty > item.max_stock) {
            alert(`Stock limit reached! Only ${item.max_stock} units available.`);
            return item;
          }
          return { ...item, quantity: qty, subtotal: qty * item.unit_price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items from current bill?')) {
      setCart([]);
      setPaidAmount('');
      setNotes('');
    }
  };

  // Calculations
  const grandTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const numericPaid = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;
  const changeDue = numericPaid > grandTotal ? numericPaid - grandTotal : 0;
  const creditAdded = numericPaid < grandTotal ? grandTotal - numericPaid : 0;

  // Quick Customer Creation
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName) return;
    try {
      const res = await api.post('/customers', {
        customer_name: newCustomerName,
        phone_number: newCustomerPhone,
      });
      setCustomers((prev) => [res.data.customer, ...prev]);
      setSelectedCustomerId(res.data.customer.customer_id);
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err) {
      alert('Failed to add customer.');
    }
  };

  // Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Please add products to the bill first.');
      return;
    }

    if (creditAdded > 0 && !selectedCustomerId) {
      alert('A registered customer must be selected for Credit / Udhaar (unpaid) sales!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        paid_amount: numericPaid,
        payment_method: paymentMethod,
        notes,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const res = await api.post('/sales', payload);

      setCompletedSale(res.data.sale);
      setStockAlerts(res.data.lowStockAlerts || []);

      // Reset cart
      setCart([]);
      setPaidAmount('');
      setNotes('');
      setSelectedCustomerId('');

      // Refresh product list stock counts
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing transaction.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory ? String(p.category_id) === String(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-5">
      {/* LEFT: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Package className="w-12 h-12 mb-2 text-gray-300" />
              <p className="text-sm">No products found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.current_stock_level <= 0;
                const isLowStock = product.current_stock_level <= product.reorder_level;

                return (
                  <button
                    key={product.product_id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50/50 hover:border-emerald-300 border-gray-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
                          {product.category_name || 'Item'}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? 'Out' : `Stock: ${product.current_stock_level}`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {product.product_name}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">
                        Rs. {parseFloat(product.sale_price).toFixed(0)}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition">
                        + Add
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Billing Register & Cart (40%) */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cart Top Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Active Bill ({cart.length} items)</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-300 hover:text-red-100 font-medium transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <ShoppingCart className="w-12 h-12 mb-2 text-gray-300 stroke-1" />
              <p className="text-xs">Counter register is empty.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Click any product from the catalog to add.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <h5 className="font-semibold text-gray-900 truncate">{item.product_name}</h5>
                  <p className="text-[11px] text-gray-500">Rs. {item.unit_price.toFixed(0)} each</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.max_stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                    className="w-10 text-center py-1 font-bold border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="w-20 text-right font-bold text-gray-900">
                  Rs. {item.subtotal.toFixed(0)}
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="ml-2 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Customer & Checkout Controls */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/70 space-y-3">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Customer (Required for Udhaar / Credit)
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> {showAddCustomer ? 'Cancel' : '+ New'}
              </button>
            </div>

            {showAddCustomer ? (
              <form onSubmit={handleQuickAddCustomer} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-28 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  Save
                </button>
              </form>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="">Walk-in Customer (Full Cash Only)</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_name} {c.current_credit_balance > 0 ? `(Udhaar: Rs. ${parseFloat(c.current_credit_balance).toFixed(0)})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Method & Amount Paid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="Online / Mobile">Online / Mobile</option>
                <option value="Credit / Udhaar">Credit / Udhaar</option>
                <option value="Split">Split Payment</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Amount Paid (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder={grandTotal ? grandTotal.toFixed(0) : '0'}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Financial Calculation Feedback */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-base text-gray-900">
              <span>Total Amount:</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>

            {changeDue > 0 && (
              <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded">
                <span>Change Returned:</span>
                <span>Rs. {changeDue.toFixed(2)}</span>
              </div>
            )}

            {creditAdded > 0 && (
              <div className="flex justify-between font-bold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                <span>Remaining Udhaar (Credit):</span>
                <span>Rs. {creditAdded.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{loading ? 'Processing Sale...' : 'Save & Print Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => {
            setCompletedSale(null);
            if (stockAlerts.length > 0) {
              alert(
                `Notice: ${stockAlerts.length} item(s) dropped below reorder level during this sale:\n` +
                  stockAlerts.map((a) => `• ${a.product_name} (Remaining: ${a.remaining_stock})`).join('\n')
              );
            }
          }}
        />
      )}
    </div>
  );
}
