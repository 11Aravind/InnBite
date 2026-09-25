import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import {
    ChefHat,
    RefreshCw,
    LayoutGrid,
    User,
    Check,
    CreditCard,
    Clock,
    Bell,
    Flame
} from 'lucide-react';

export default function KitchenView() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();

        const interval = setInterval(() => {
            loadOrders();
        }, 5000);

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('kitchen_orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                    loadOrders();
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        await apiService.updateOrderStatus(orderId, newStatus);
        loadOrders();
    };

    const handleMarkPaid = async (orderId) => {
        await apiService.updatePaymentStatus(orderId, 'paid');
        loadOrders();
    };

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const filteredOrders = filterStatus === 'all'
        ? activeOrders
        : activeOrders.filter(o => o.status === filterStatus);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-6 font-sans">
            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border border-slate-200/80 bg-white p-4 rounded-2xl shadow-sm gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#18181b] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                        <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Kitchen Display
                        </h1>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200/80 text-xs">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-1.5 rounded-full capitalize font-bold transition-all ${filterStatus === st
                                    ? 'bg-[#18181b] text-white shadow-sm font-extrabold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                        >
                            {st === 'all' ? `All (${activeOrders.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${activeOrders.filter(o => o.status === st).length})`}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl border border-slate-200 font-bold flex items-center gap-2 transition-colors"
                    >
                        <LayoutGrid className="w-4 h-4 text-slate-700" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2.5 bg-[#18181b] hover:bg-black text-white text-xs rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <User className="w-4 h-4" /> Customer View
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">Loading kitchen orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-600 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <ChefHat className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-black text-slate-800">No Active Kitchen Orders</p>
                    <p className="text-xs text-slate-400 mt-1">Orders scanned & placed by customers at tables will appear here live</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
                            >
                                <div>
                                    {/* Card Header (Dark Charcoal Bar) */}
                                    <div className="bg-[#18181b] p-4 text-white flex justify-between items-center rounded-t-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white text-black font-extrabold text-base px-3.5 py-1.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
                                                T-{order.table_number}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">TABLE ORDER</span>
                                                <span className="text-base font-bold text-white leading-tight block">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {order.status === 'ready' && (
                                                <span className="bg-[#22c55e] text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide shadow-sm">
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" /> READY
                                                </span>
                                            )}
                                            {order.status === 'preparing' && (
                                                <span className="bg-[#334155] text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide shadow-sm">
                                                    <ChefHat className="w-3.5 h-3.5" /> PREPARING
                                                </span>
                                            )}
                                            {order.status === 'pending' && (
                                                <span className="bg-[#f59e0b] text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide animate-pulse shadow-sm">
                                                    PENDING
                                                </span>
                                            )}

                                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Strip */}
                                    <div className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <CreditCard className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-500 font-medium">Payment</span>
                                            <span className="font-bold text-slate-900">
                                                {isPaid ? 'Paid Online' : 'Pay at Counter'}
                                            </span>
                                        </div>

                                        {!isPaid ? (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="bg-white border border-slate-200 text-slate-900 font-bold px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 text-[11px] flex items-center gap-1.5 transition-colors"
                                            >
                                                <CreditCard className="w-3.5 h-3.5 text-slate-700" /> Mark Paid
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                Paid ✓
                                            </span>
                                        )}
                                    </div>

                                    {/* Items List */}
                                    <div className="p-4 space-y-3 min-h-[140px] bg-white">
                                        {order.status === 'preparing' && items.length === 0 ? (
                                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                                                <svg className="w-14 h-14 text-slate-400 mx-auto mb-2" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M26 12C26 9 28 8 28 6" />
                                                    <path d="M32 11C32 8 34 7 34 5" />
                                                    <path d="M38 12C38 9 40 8 40 6" />
                                                    <circle cx="32" cy="17" r="2.5" fill="currentColor" />
                                                    <path d="M14 38A18 18 0 0 1 50 38" />
                                                    <path d="M10 38h44" strokeWidth="3" />
                                                    <path d="M12 42h40" strokeWidth="2" />
                                                </svg>
                                                <p className="font-bold text-slate-900 text-sm">Preparing your order...</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">We'll notify you when it's ready.</p>
                                            </div>
                                        ) : items.length > 0 ? (
                                            items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3.5 flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-[#18181b] text-white font-extrabold text-xs w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                                            {item.quantity}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm">{item.dish_name || item.name}</h4>
                                                            {item.portion_label && (
                                                                <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                                                                    Portion: {item.portion_label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        ₹{(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                                                <svg className="w-14 h-14 text-slate-400 mx-auto mb-2" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M26 12C26 9 28 8 28 6" />
                                                    <path d="M32 11C32 8 34 7 34 5" />
                                                    <path d="M38 12C38 9 40 8 40 6" />
                                                    <circle cx="32" cy="17" r="2.5" fill="currentColor" />
                                                    <path d="M14 38A18 18 0 0 1 50 38" />
                                                    <path d="M10 38h44" strokeWidth="3" />
                                                    <path d="M12 42h40" strokeWidth="2" />
                                                </svg>
                                                <p className="font-bold text-slate-900 text-sm">Preparing your order...</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">We'll notify you when it's ready.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">GRAND TOTAL</span>
                                        <span className="text-xl font-black text-slate-900 mt-0.5 block">₹{Number(order.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="bg-[#18181b] hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Flame className="w-4 h-4 text-orange-400" /> Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="bg-[#18181b] hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Bell className="w-4 h-4 text-white" /> Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="bg-[#18181b] hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Check className="w-4 h-4 text-white stroke-[2.5]" /> Complete Order
                                            </button>
                                        )}
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
