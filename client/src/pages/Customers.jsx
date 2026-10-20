import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  FileText,
  Phone,
  Mail,
  X,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);

  // New Customer Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    initial_credit_balance: 0,
  });

  // Pay Udhaar Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Ledger History Modal
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [hasBalanceOnly]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?has_balance=${hasBalanceOnly}`);
      setCustomers(res.data.customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      alert('Customer created successfully!');
      setCustomerModalOpen(false);
      setFormData({ customer_name: '', phone_number: '', email: '', initial_credit_balance: 0 });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer.');
    }
  };

  const handleOpenPayModal = (customer) => {
    setActiveCustomer(customer);
    setPaymentAmount(customer.current_credit_balance);
    setPaymentNotes('Cash payback for udhaar');
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      await api.post(`/customers/${activeCustomer.customer_id}/payments`, {
        amount: parseFloat(paymentAmount),
        notes: paymentNotes,
      });

      alert('Payment recorded successfully!');
      setPayModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment.');
    }
  };

  const handleOpenLedger = async (customer) => {
    try {
      const res = await api.get(`/customers/${customer.customer_id}/ledger`);
      setLedgerCustomer(res.data.customer);
      setLedgerData(res.data.ledger);
      setLedgerModalOpen(true);
    } catch (err) {
      alert('Failed to load customer account ledger.');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone_number && c.phone_number.includes(searchTerm))
  );

  const totalOutstanding = customers.reduce(
    (acc, c) => acc + parseFloat(c.current_credit_balance || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Accounts & Udhaar</h1>
          <p className="text-sm text-gray-500">Track regular customers, store credit (udhaar), and payment receipts</p>
        </div>

        <button
          onClick={() => setCustomerModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
              Total Outstanding Customer Udhaar
            </h4>
            <p className="text-xl font-extrabold text-red-600">
              Rs. {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setHasBalanceOnly(!hasBalanceOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            hasBalanceOnly
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-red-700 border-red-300 hover:bg-red-100'
          }`}
        >
          {hasBalanceOnly ? 'Showing Udhaar Customers' : 'Filter: Has Balance Only'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customer Accounts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-center">Lifetime Sales</th>
                <th className="py-3 px-4 text-right">Outstanding Udhaar</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const hasBalance = parseFloat(cust.current_credit_balance) > 0;
                  return (
                    <tr key={cust.customer_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{cust.customer_name}</td>
                      <td className="py-3 px-4 text-gray-600">{cust.phone_number || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium">
                          {cust.total_sales || 0} visits
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full ${
                            hasBalance ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          Rs. {parseFloat(cust.current_credit_balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasBalance && (
                            <button
                              onClick={() => handleOpenPayModal(cust)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 transition"
                            >
                              Receive Payment
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenLedger(cust)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ledger</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm">
                Receive Udhaar Payback
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-gray-50 p-3 rounded-lg text-xs space-y-1">
              <p className="text-gray-600">Customer: <strong className="text-gray-900">{activeCustomer.customer_name}</strong></p>
              <p className="text-gray-600">Total Udhaar: <strong className="text-red-600">Rs. {parseFloat(activeCustomer.current_credit_balance).toFixed(2)}</strong></p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Amount Paid (Rs.) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={activeCustomer.current_credit_balance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Payment Note / Receipt</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Account Ledger Modal */}
      {ledgerModalOpen && ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{ledgerCustomer.customer_name} — Account Ledger</h3>
                <p className="text-xs text-gray-500">Contact: {ledgerCustomer.phone_number || 'N/A'}</p>
              </div>
              <button onClick={() => setLedgerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
              <span>Current Outstanding Udhaar Balance:</span>
              <span className="text-base font-bold text-red-400">
                Rs. {parseFloat(ledgerCustomer.current_credit_balance).toFixed(2)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Entry Type</th>
                    <th className="py-2.5 px-3">Ref #</th>
                    <th className="py-2.5 px-3 text-right">Credit (Udhaar)</th>
                    <th className="py-2.5 px-3 text-right">Payment Made</th>
                    <th className="py-2.5 px-3">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400">
                        No ledger history recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(row.entry_date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                              row.entry_type === 'sale'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.entry_type === 'sale' ? 'Credit Purchase' : 'Udhaar Payback'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-800">
                          {row.entry_type === 'sale' ? `INV-${row.reference_id}` : `PAY-${row.reference_id}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-800">
                          {parseFloat(row.credit_added) > 0 ? `+ Rs. ${parseFloat(row.credit_added).toFixed(0)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {parseFloat(row.payment_made) > 0 ? `- Rs. ${parseFloat(row.payment_made).toFixed(0)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{row.recorded_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t mt-3 flex justify-end">
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add Customer Account</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+92 300 0000000"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Opening Udhaar Balance (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.initial_credit_balance}
                  onChange={(e) => setFormData({ ...formData, initial_credit_balance: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
