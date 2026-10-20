import React, { useState, useEffect } from 'react';
import api from '../api';
import { Truck, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity_received: 1, unit_cost: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      setPurchases(purRes.data.purchases);
      setSuppliers(supRes.data.suppliers);
      setProducts(prodRes.data.products);
      if (supRes.data.suppliers.length > 0) {
        setSupplierId(supRes.data.suppliers[0].supplier_id);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: '', quantity_received: 1, unit_cost: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(
      items.map((item, idx) => {
        if (idx === index) {
          const updated = { ...item, [field]: value };
          // If product changed, default the unit cost to product's current cost price
          if (field === 'product_id') {
            const foundProd = products.find((p) => String(p.product_id) === String(value));
            if (foundProd) {
              updated.unit_cost = foundProd.cost_price;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const totalInvoiceCost = items.reduce((acc, it) => {
    const qty = parseFloat(it.quantity_received) || 0;
    const cost = parseFloat(it.unit_cost) || 0;
    return acc + qty * cost;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier.');
      return;
    }

    const invalidItem = items.find((i) => !i.product_id || i.quantity_received <= 0);
    if (invalidItem) {
      alert('Please ensure all items have a selected product and valid quantity.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/purchases', {
        supplier_id: parseInt(supplierId, 10),
        notes,
        items: items.map((i) => ({
          product_id: parseInt(i.product_id, 10),
          quantity_received: parseInt(i.quantity_received, 10),
          unit_cost: parseFloat(i.unit_cost || 0),
        })),
      });

      alert('Purchase recorded! Stock quantities have been updated.');
      setShowForm(false);
      setItems([{ product_id: '', quantity_received: 1, unit_cost: '' }]);
      setNotes('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Purchases (Stock In)</h1>
          <p className="text-sm text-gray-500">Record supplier stock deliveries to automatically replenish inventory</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Record New Stock Arrival'}</span>
        </button>
      </div>

      {/* New Purchase Invoice Entry Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4 pb-2 border-b">
            Record Supplier Stock Invoice
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Supplier *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name} ({s.contact_person || 'No Contact'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Invoice Notes / Ref #</label>
                <input
                  type="text"
                  placeholder="e.g. Inv #88392 from Metro Wholesale"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Item Rows */}
            <div className="pt-2">
              <label className="block font-bold text-gray-700 uppercase mb-2">Delivered Items *</label>
              <div className="space-y-2">
                {items.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <select
                        required
                        value={row.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border rounded text-xs"
                      >
                        <option value="">Select Product to Restock</option>
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name} (Current Stock: {p.current_stock_level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={row.quantity_received}
                        onChange={(e) => handleItemChange(idx, 'quantity_received', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border rounded text-xs text-center font-bold"
                      />
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Unit Cost (Rs.)"
                        value={row.unit_cost}
                        onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border rounded text-xs text-right font-bold"
                      />
                    </div>

                    <div className="w-28 text-right font-bold text-gray-800 text-xs">
                      Rs. {((parseFloat(row.quantity_received) || 0) * (parseFloat(row.unit_cost) || 0)).toFixed(0)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddItemRow}
                className="mt-2 text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Another Product Row
              </button>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-bold text-gray-900">
                Total Purchase Cost: <span className="text-emerald-600 font-extrabold">Rs. {totalInvoiceCost.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20"
                >
                  {submitting ? 'Updating Inventory...' : 'Confirm Stock Arrival'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Historical Purchases Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Purchase History & Supplier Invoices</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Items Received</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No supplier purchases recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur.purchase_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      PO-{String(pur.purchase_id).padStart(4, '0')}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(pur.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{pur.supplier_name}</td>
                    <td className="py-3 px-4 text-gray-600">{pur.recorded_by_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">
                        {pur.item_count} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      Rs. {parseFloat(pur.total_cost).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-400 truncate max-w-xs">{pur.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
