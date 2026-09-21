import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import {
    Flame,
    RefreshCw,
    LayoutDashboard,
    Home,
    Clock,
    ChefHat,
    CheckCircle2,
    DollarSign,
    Bell,
    UtensilsCrossed,
    Sparkles,
    Check,
    CreditCard,
    AlertCircle,
    ShoppingBag
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
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans selection:bg-rose-500 selection:text-white">
            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl p-5 rounded-3xl border shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-rose-500/25 ring-1 ring-white/20">
                        <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            Kitchen Live Order Display
                        </h1>
                        <p className="text-xs text-slate-400">Real-time KDS (Kitchen Display System) order tickets</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-sm">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-2 rounded-xl capitalize font-bold text-xs transition-all ${filterStatus === st
                                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 font-extrabold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {st} ({st === 'all' ? activeOrders.length : activeOrders.filter(o => o.status === st).length})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700/50"
                    >
                        <LayoutDashboard className="w-4 h-4 text-rose-400" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2 transition-colors border border-rose-500/30"
                    >
                        <Home className="w-4 h-4" /> Customer View
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">Loading kitchen orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-950/60 rounded-3xl border border-slate-800/80 shadow-2xl">
                    <ChefHat className="w-14 h-14 text-slate-600 mx-auto mb-3" />
                    <p className="text-lg font-extrabold text-slate-300">No Active Kitchen Orders</p>
                    <p className="text-xs text-slate-500 mt-1">Orders scanned & placed by customers at tables will appear here live</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        const statusColors = {
                            pending: {
                                border: 'border-amber-500/60',
                                headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                                statusBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                                textBadge: 'text-amber-400',
                                ring: 'ring-2 ring-amber-500/30 animate-pulse'
                            },
                            preparing: {
                                border: 'border-blue-500/60',
                                headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
                                statusBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                                textBadge: 'text-blue-400',
                                ring: 'ring-1 ring-blue-500/30'
                            },
                            ready: {
                                border: 'border-emerald-500/60',
                                headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
                                statusBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                                textBadge: 'text-emerald-400',
                                ring: 'ring-1 ring-emerald-500/30'
                            }
                        };

                        const theme = statusColors[order.status] || statusColors.pending;

                        return (
                            <div
                                key={order.id}
                                className={`flex flex-col justify-between rounded-3xl bg-slate-950 border ${theme.border} ${theme.ring} shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
                            >
                                {/* Ticket Header */}
                                <div>
                                    <div className={`${theme.headerBg} p-4 text-white flex justify-between items-center shadow-md`}>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-950/80 text-white font-black text-xl px-3.5 py-1 rounded-xl shadow-inner border border-white/10">
                                                T-{order.table_number}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-extrabold tracking-wider text-white/80 block">Table Order</span>
                                                <span className="text-sm font-bold text-white leading-none">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] font-extrabold uppercase bg-slate-950/60 text-white px-2.5 py-1 rounded-lg border border-white/10 block mb-1">
                                                {order.status}
                                            </span>
                                            <span className="text-[10px] text-white/90 font-mono flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Status Strip */}
                                    <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-850 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <span>Payment:</span>
                                            <span className={`font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {isPaid ? 'Paid Online ✅' : 'Pay at Counter 💵'}
                                            </span>
                                        </div>

                                        {!isPaid && (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </div>

                                    {/* Order Items List */}
                                    <div className="p-4 space-y-2.5">
                                        {items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-start bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                                                        {item.quantity}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-slate-100 text-sm leading-tight">{item.dish_name || item.name}</h4>
                                                        {item.portion_label && (
                                                            <span className="text-[11px] font-semibold text-amber-400 block mt-0.5">
                                                                Portion: {item.portion_label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-slate-400">
                                                    ${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Action Footer */}
                                <div className="p-4 bg-slate-900/90 border-t border-slate-850 flex items-center justify-between gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Grand Total</span>
                                        <span className="text-lg font-black text-white">${Number(order.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
                                            >
                                                <Flame className="w-4 h-4" />
                                                <span>Start Preparing</span>
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-1.5"
                                            >
                                                <Bell className="w-4 h-4" />
                                                <span>Mark Ready</span>
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
                                            >
                                                <Check className="w-4 h-4 text-emerald-400" />
                                                <span>Complete Order</span>
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
