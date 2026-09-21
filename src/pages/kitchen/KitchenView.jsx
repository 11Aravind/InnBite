import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { Flame, RefreshCw, LayoutDashboard, Home, Clock, ChefHat, CheckCircle2, DollarSign, AlertCircle } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-6 font-sans selection:bg-rose-500 selection:text-white">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            Kitchen Live Order Board
                        </h1>
                        <p className="text-xs text-slate-500">Real-time table order queue for cooks & staff</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-sm">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3.5 py-1.5 rounded-lg capitalize font-bold text-xs transition-all ${filterStatus === st ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            {st} ({st === 'all' ? activeOrders.length : activeOrders.filter(o => o.status === st).length})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl border border-slate-200 font-bold flex items-center gap-1.5 transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4 text-rose-500" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold flex items-center gap-1.5 transition-colors"
                    >
                        <Home className="w-4 h-4" /> Customer Menu
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">Loading kitchen orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <ChefHat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-lg font-bold text-slate-700">No active kitchen orders</p>
                    <p className="text-xs text-slate-400">Orders placed by customers will appear here automatically</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div
                                key={order.id}
                                className={`flex flex-col justify-between rounded-2xl border-2 p-4.5 bg-white shadow-sm hover:shadow-md transition-all ${order.status === 'pending'
                                        ? 'border-amber-400 bg-amber-50/20'
                                        : order.status === 'preparing'
                                            ? 'border-blue-400 bg-blue-50/20'
                                            : 'border-emerald-400 bg-emerald-50/20'
                                    }`}
                            >
                                <div>
                                    {/* Card Header: Table # & Status Badge */}
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                                T-{order.table_number}
                                            </span>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-medium uppercase">Customer</span>
                                                <span className="text-sm font-bold text-slate-900">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${order.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                                                    : order.status === 'preparing'
                                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Badge */}
                                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl mb-3 border border-slate-100 text-xs">
                                        <span className="text-slate-500 font-medium">Payment:</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {isPaid ? 'Paid ✅' : 'Pay at Counter 💵'}
                                            </span>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handleMarkPaid(order.id)}
                                                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-bold transition-colors"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ordered Items List */}
                                    <div className="space-y-2 mb-4">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="font-extrabold text-slate-900 mr-2">{item.quantity}x</span>
                                                    <span className="text-slate-800 font-semibold">{item.dish_name || item.name}</span>
                                                    {item.portion_label && (
                                                        <span className="text-xs text-amber-700 block font-medium">Portion: {item.portion_label}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono font-bold">${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Progress Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="text-sm font-black text-slate-900">
                                        ${Number(order.total_amount).toFixed(2)}
                                    </span>

                                    <div className="flex gap-1.5">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                            >
                                                Start Preparing 🍳
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                            >
                                                Mark Ready 🔔
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                                            >
                                                Complete Order ✅
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
