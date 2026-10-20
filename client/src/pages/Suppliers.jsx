import React, { useState, useEffect } from 'react';
import api from '../api';
import { Building2, Plus, Phone, Mail, MapPin, Edit2, Trash2, X } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    contact_details: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.suppliers);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_name: '',
      contact_person: '',
      phone_number: '',
      email: '',
      address: '',
      contact_details: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      supplier_name: s.supplier_name,
      contact_person: s.contact_person || '',
      phone_number: s.phone_number || '',
      email: s.email || '',
      address: s.address || '',
      contact_details: s.contact_details || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.supplier_id}`, formData);
        alert('Supplier updated successfully!');
      } else {
        await api.post('/suppliers', formData);
        alert('Supplier created successfully!');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving supplier.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      const res = await api.delete(`/suppliers/${id}`);
      alert(res.data.message || 'Supplier deleted.');
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete supplier.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesale Suppliers Directory</h1>
          <p className="text-sm text-gray-500">Manage distributors, trade accounts, and purchase relationships</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.supplier_id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-gray-900">{s.supplier_name}</h3>
                <p className="text-xs text-gray-500">Contact: {s.contact_person || 'Representative'}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.supplier_id, s.supplier_name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 border-t pt-3">
              {s.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{s.phone_number}</span>
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{s.email}</span>
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{s.address}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-2.5 flex justify-between text-xs">
              <span className="text-gray-500">Total Purchase Volume:</span>
              <span className="font-bold text-gray-900">Rs. {parseFloat(s.total_spent || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border">
            <h3 className="font-bold text-gray-900 text-sm mb-3">
              {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
