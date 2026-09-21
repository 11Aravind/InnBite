import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export default function KitchenView() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'preparing', 'ready'

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();

        // Interval poll as fallback
        const interval = setInterval(() => {
            loadOrders();
        }, 5000);

        // Supabase Realtime Listener if configured
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
        <div className="min-h-screen bg-gray-950 text-white p-4 font-sans">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-gray-800 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
                        👨‍🍳
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Kitchen Live Order Board</h1>
                        <p className="text-xs text-gray-400">Real-time table order queue for cooks & staff</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800 text-sm">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${filterStatus === st ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                            {st} ({st === 'all' ? activeOrders.length : activeOrders.filter(o => o.status === st).length})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg font-medium"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg font-medium"
                    >
                        ⚙️ Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs rounded-lg font-medium"
                    >
                        🏠 Customer Menu
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-gray-500">Loading kitchen orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-600 bg-gray-900/40 rounded-3xl border border-gray-900">
                    <span className="text-4xl block mb-2">🍽️</span>
                    <p className="text-lg font-semibold text-gray-400">No active kitchen orders</p>
                    <p className="text-xs text-gray-600">Orders placed by customers will appear here automatically</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div
                                key={order.id}
                                className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${order.status === 'pending'
                                        ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/5'
                                        : order.status === 'preparing'
                                            ? 'bg-blue-950/30 border-blue-500/40'
                                            : 'bg-emerald-950/30 border-emerald-500/40'
                                    }`}
                            >
                                <div>
                                    {/* Card Header: Table # & Status Badge */}
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-white bg-gray-800 px-3 py-1 rounded-xl border border-gray-700">
                                                T-{order.table_number}
                                            </span>
                                            <div>
                                                <span className="text-xs text-gray-400 block font-medium">Customer</span>
                                                <span className="text-sm font-semibold text-gray-200">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending'
                                                    ? 'bg-amber-500 text-black animate-pulse'
                                                    : order.status === 'preparing'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-emerald-500 text-black'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Badge */}
                                    <div className="flex items-center justify-between bg-gray-900/80 px-3 py-1.5 rounded-lg mb-3 border border-gray-800 text-xs">
                                        <span className="text-gray-400">Payment:</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {isPaid ? 'Paid ✅' : 'Pay at Counter 💵'}
                                            </span>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handleMarkPaid(order.id)}
                                                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded font-bold"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ordered Items List */}
                                    <div className="space-y-2 mb-4">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm bg-gray-900/60 p-2 rounded-lg border border-gray-850">
                                                <div>
                                                    <span className="font-bold text-white mr-2">{item.quantity}x</span>
                                                    <span className="text-gray-200 font-medium">{item.dish_name || item.name}</span>
                                                    {item.portion_label && (
                                                        <span className="text-xs text-amber-400 block font-normal">Portion: {item.portion_label}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono">${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Progress Action Buttons */}
                                <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-gray-300">
                                        Total: ${Number(order.total_amount).toFixed(2)}
                                    </span>

                                    <div className="flex gap-1.5">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                Start Preparing 🍳
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                Mark Ready 🔔
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors"
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
