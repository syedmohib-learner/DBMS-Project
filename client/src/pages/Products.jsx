import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  FolderPlus,
} from 'lucide-react';

export default function Products() {
  const { isOwner } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(searchParams.get('filter') === 'low-stock');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    supplier_id: '',
    description: '',
    cost_price: '',
    sale_price: '',
    current_stock_level: 0,
    reorder_level: 5,
  });

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, [showLowStockOnly]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?low_stock=${showLowStockOnly}`),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);

      if (isOwner) {
        const supRes = await api.get('/suppliers');
        setSuppliers(supRes.data.suppliers);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      product_name: '',
      category_id: categories[0]?.category_id || '',
      supplier_id: suppliers[0]?.supplier_id || '',
      description: '',
      cost_price: '',
      sale_price: '',
      current_stock_level: 0,
      reorder_level: 5,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      product_name: p.product_name,
      category_id: p.category_id,
      supplier_id: p.supplier_id || '',
      description: p.description || '',
      cost_price: p.cost_price,
      sale_price: p.sale_price,
      current_stock_level: p.current_stock_level,
      reorder_level: p.reorder_level,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.product_id}`, formData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', formData);
        alert('Product created successfully!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"? Per SRS rules, if it has transaction history it will be safely deactivated.`)) {
      return;
    }
    try {
      const res = await api.delete(`/products/${id}`);
      alert(res.data.message || 'Product removed.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove product.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await api.post('/categories', { category_name: newCategoryName, description: newCategoryDesc });
      alert('Category added!');
      setCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      const catRes = await api.get('/categories');
      setCategories(catRes.data.categories);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add category');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter ? String(p.category_id) === String(categoryFilter) : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Catalog</h1>
          <p className="text-sm text-gray-500">Track quantities, reorder points, cost & retail prices</p>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Category</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              showLowStockOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                {isOwner && <th className="py-3 px-4 text-right">Cost Price</th>}
                <th className="py-3 px-4 text-right">Sale Price</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-center">Reorder Min</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isOwner && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 6} className="py-8 text-center text-gray-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.current_stock_level <= p.reorder_level;
                  const isOut = p.current_stock_level <= 0;

                  return (
                    <tr key={p.product_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{p.product_name}</div>
                        {p.description && <div className="text-[11px] text-gray-400 truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px]">
                          {p.category_name || 'General'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-3 px-4 text-right font-medium text-gray-500">
                          Rs. {parseFloat(p.cost_price).toFixed(2)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        Rs. {parseFloat(p.sale_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.current_stock_level} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-500">{p.reorder_level}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.product_id, p.product_name)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete / Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-gray-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Primary Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None / Open Market</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Cost Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Sale Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Current Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.current_stock_level}
                    onChange={(e) => setFormData({ ...formData, current_stock_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Reorder Alert Level *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frozen Foods"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional details"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
