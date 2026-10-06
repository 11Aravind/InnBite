import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { playOrderChimeSound } from '../../utils/sound';
import { useSettings } from '../../context/SettingsContext';
import { printThermalReceipt } from '../../utils/printReceipt';
import AdminSkeletonTable from '../../components/AdminSkeletonTable';
import { Receipt, RefreshCw, CreditCard, Volume2, VolumeX, MessageSquare, Printer } from 'lucide-react';

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${day}/${month}/${year}, ${timeStr}`;
};

export default function AdminOrders() {
    const { settings } = useSettings();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPayment, setFilterPayment] = useState('all');
    const [soundEnabled, setSoundEnabled] = useState(true);

    const previousOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        const freshOrders = data || [];

        const newOrders = freshOrders.filter(o => !previousOrderIdsRef.current.has(o.id));
        if (!isFirstLoadRef.current && newOrders.length > 0 && soundEnabled) {
            playOrderChimeSound();
        }

        previousOrderIdsRef.current = new Set(freshOrders.map(o => o.id));
        isFirstLoadRef.current = false;

        setOrders(freshOrders);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 4000);

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('admin_orders_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                    loadOrders();
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [soundEnabled]);

    const handleMarkPaid = async (orderId) => {
        await apiService.updatePaymentStatus(orderId, 'SUCCESS');
        loadOrders();
    };

    const handleUpdateStatus = async (orderId, status) => {
        await apiService.updateOrderStatus(orderId, status);
        loadOrders();
    };

    const filteredOrders = filterPayment === 'all'
        ? orders
        : orders.filter(o => (filterPayment === 'paid' ? o.payment_status === 'SUCCESS' || o.payment_status === 'paid' : o.payment_status !== 'SUCCESS' && o.payment_status !== 'paid'));

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Orders & Payments Log <Receipt className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track incoming table and self-service orders, live DB sync, payment logs, and status updates</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${soundEnabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}
                    >
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                    </button>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs">
                        {['all', 'paid', 'pending'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilterPayment(p)}
                                className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-colors ${filterPayment === p ? 'bg-[#114536] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                {p === 'pending' ? 'Unpaid / Counter' : p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={loadOrders}
                        className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {loading && orders.length === 0 ? (
                <AdminSkeletonTable rows={5} cols={5} />
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 font-bold text-xs">No orders matching filter</div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'SUCCESS' || order.payment_status === 'paid';
                        const isSelfService = order.service_mode === 'SELF_SERVICE' || (!order.table_number && !order.table_id);

                        return (
                            <div key={order.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                                <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        {isSelfService ? (
                                            <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl">
                                                Self-Service Order #{order.order_number || order.id}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-xl">
                                                Table #{order.table_number} · Order #{order.order_number || order.id}
                                            </span>
                                        )}
                                        <div>
                                            <span className="font-bold text-slate-900 block text-sm">{order.customer_name || 'Guest'}</span>
                                            <span className="text-[11px] text-slate-400 font-mono">{formatDateTime(order.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Status</span>
                                            <select
                                                value={order.status || 'CONFIRMED'}
                                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                className="text-xs font-extrabold bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1 outline-none uppercase focus:border-slate-900"
                                            >
                                                <option value="CONFIRMED">CONFIRMED</option>
                                                <option value="ACCEPTED">ACCEPTED</option>
                                                <option value="PREPARING">PREPARING</option>
                                                <option value="READY">READY</option>
                                                <option value="SERVED">SERVED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                            </select>
                                        </div>

                                        <div className="text-right pl-3 border-l border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                                            <span className="text-base font-black text-slate-900">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Breakdown */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {items.map((item, idx) => {
                                        const customEntries = Object.entries(item.customizations || {});
                                        const note = item.special_instruction || item.specialInstruction;

                                        return (
                                            <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-slate-900 mr-1.5">{item.quantity}x</span>
                                                        <span className="font-bold text-slate-800">{item.dish_name || item.name}</span>
                                                    </div>
                                                    <span className="font-mono text-slate-900 font-bold">₹{(Number(item.unit_price_snapshot || item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</span>
                                                </div>

                                                {item.portion_label && (
                                                    <span className="text-[10px] text-slate-500 font-medium block">Portion: {item.portion_label}</span>
                                                )}

                                                {customEntries.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                                        {customEntries.map(([k, v]) => (
                                                            <span key={k} className="text-[10px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                                                • {v === 'No' ? `No ${k}` : `${k}: ${v}`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {note && (
                                                    <p className="text-[10px] text-indigo-700 italic bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                                                        <span>"{note}"</span>
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-slate-500 font-semibold">Payment Method:</span>
                                        <span className="font-bold text-slate-900 capitalize flex items-center gap-1">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                            {order.payment_method === 'cash_at_counter' ? 'Pay at Counter / Cash' : 'Online Razorpay'}
                                        </span>
                                        {order.razorpay_payment_id ? (
                                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200 font-bold" title="Razorpay Payment Transaction ID">
                                                Txn ID: {order.razorpay_payment_id}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200" title="Checkout Reference ID">
                                                Ref: {order.idempotency_key || `ORD-${order.id}`} (No Payment Completed)
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold px-3 py-1 rounded-full text-xs border ${isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                            {isPaid ? 'Payment Verified (SUCCESS)' : 'Payment Pending'}
                                        </span>

                                        {!isPaid && (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="px-3.5 py-1.5 bg-[#114536] hover:bg-[#0c382b] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                                            >
                                                Mark Paid
                                            </button>
                                        )}

                                        <button
                                            onClick={() => printThermalReceipt(order, settings)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                                            title="Print 80mm Thermal Receipt"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                                            <span>Print Receipt</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}