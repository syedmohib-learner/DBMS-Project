import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = parseFloat(sale.total_amount || 0);
  const paidAmount = parseFloat(sale.paid_amount || 0);
  const creditAdded = totalAmount > paidAmount ? totalAmount - paidAmount : 0;
  const changeGiven = paidAmount > totalAmount ? paidAmount - totalAmount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Sale Completed Successfully</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div id="printable-receipt" className="p-6 bg-white font-mono text-xs text-gray-800">
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">
              AL-MADINA GENERAL STORE
            </h2>
            <p className="text-[11px] text-gray-600">Retail & Wholesale Provisions</p>
            <p className="text-[10px] text-gray-500">Shop #12, Commercial Market, Karachi</p>
            <p className="text-[10px] text-gray-500">Ph: +92 300 0000000</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt #:</span>
              <span className="font-bold">INV-{String(sale.sale_id).padStart(5, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{new Date(sale.sale_date || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cashier:</span>
              <span>{sale.cashier_name || 'Staff'}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{sale.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className="font-medium">{sale.payment_method || 'Cash'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-gray-300">
            <div className="flex justify-between text-[11px] font-bold text-gray-700 pb-1.5 border-b border-gray-200">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>

            <div className="divide-y divide-gray-100">
              {(sale.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 text-[11px]">
                  <span className="w-1/2 truncate font-medium">{item.product_name}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/6 text-right">Rs. {parseFloat(item.unit_price).toFixed(0)}</span>
                  <span className="w-1/6 text-right font-semibold">
                    Rs. {parseFloat(item.subtotal || item.unit_price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Credit / Change */}
          <div className="py-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
              <span>Grand Total:</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Amount Paid:</span>
              <span>Rs. {paidAmount.toFixed(2)}</span>
            </div>

            {changeGiven > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                <span>Change Returned:</span>
                <span>Rs. {changeGiven.toFixed(2)}</span>
              </div>
            )}

            {creditAdded > 0 && (
              <div className="flex justify-between text-amber-800 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <span>Added to Udhaar (Credit):</span>
                <span>Rs. {creditAdded.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-dashed border-gray-300 text-center text-[10px] text-gray-500">
            <p>Thank you for shopping with us!</p>
            <p className="mt-0.5">Please check items before leaving the counter.</p>
          </div>
        </div>

        {/* Modal Buttons (Hidden in print) */}
        <div className="no-print p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium text-sm transition-colors"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
