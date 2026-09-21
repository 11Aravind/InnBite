import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import {
    ChefHat,
    RefreshCw,
    LayoutDashboard,
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
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black shadow-md shrink-0">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">
                            Kitchen Live Order Board
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">Black & White High-Contrast KDS Display</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-200/80 text-xs">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-1.5 rounded-full capitalize font-bold transition-all ${filterStatus === st
                                    ? 'bg-black text-white shadow-sm font-extrabold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                        >
                            {st === 'all' ? `All (${activeOrders.length})` : `${st} (${activeOrders.filter(o => o.status === st).length})`}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-sm"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl border border-slate-200 font-bold flex items-center gap-2 transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white text-xs rounded-full font-bold flex items-center gap-2 transition-colors shadow-sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
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
                                    <div className="bg-[#1e293b] p-4 text-white flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white text-slate-900 font-black text-lg px-3 py-1 rounded-xl shadow-sm">
                                                T-{order.table_number}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">TABLE ORDER</span>
                                                <span className="text-sm font-bold text-white leading-none">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {order.status === 'ready' && (
                                                <span className="bg-[#22c55e] text-white font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                                                    <Check className="w-3.5 h-3.5" /> READY
                                                </span>
                                            )}
                                            {order.status === 'preparing' && (
                                                <span className="bg-slate-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                                                    <ChefHat className="w-3.5 h-3.5" /> PREPARING
                                                </span>
                                            )}
                                            {order.status === 'pending' && (
                                                <span className="bg-amber-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide animate-pulse">
                                                    PENDING
                                                </span>
                                            )}

                                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Strip */}
                                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <CreditCard className="w-4 h-4 text-slate-500" />
                                            <span>Payment</span>
                                            <span className="font-bold text-slate-900">
                                                {isPaid ? 'Paid Online' : 'Pay at Counter'}
                                            </span>
                                        </div>

                                        {!isPaid ? (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="bg-white border border-slate-200 text-slate-900 font-bold px-3 py-1 rounded-xl shadow-sm hover:bg-slate-50 text-[11px] flex items-center gap-1 transition-colors"
                                            >
                                                <CreditCard className="w-3 h-3 text-slate-700" /> Mark Paid
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                Paid ✓
                                            </span>
                                        )}
                                    </div>

                                    {/* Items List */}
                                    <div className="p-4 space-y-2.5 min-h-[100px]">
                                        {items.length > 0 ? (
                                            items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-black text-white font-black text-xs w-7 h-7 rounded-full flex items-center justify-center shrink-0">
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
                                                        ${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-6 text-center text-slate-400">
                                                <ChefHat className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                                <p className="text-xs font-medium">Preparing your order...</p>
                                                <p className="text-[10px] text-slate-400">We'll notify you when it's ready.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">GRAND TOTAL</span>
                                        <span className="text-xl font-black text-slate-900">${Number(order.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="bg-black hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Flame className="w-4 h-4 text-orange-400" /> Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="bg-black hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Bell className="w-4 h-4 text-amber-400" /> Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="bg-black hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                            >
                                                <Check className="w-4 h-4 text-emerald-400" /> Complete Order
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
