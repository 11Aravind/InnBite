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
    Check,
    CreditCard,
    DollarSign,
    Bell
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
        <div className="min-h-screen bg-slate-100 text-black p-4 md:p-6 font-sans selection:bg-black selection:text-white">
            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-black bg-white p-5 rounded-2xl shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-md">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-black flex items-center gap-2">
                            Kitchen Live Order Board
                        </h1>
                        <p className="text-xs text-neutral-600 font-medium">Black & White High-Contrast KDS Display</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-black text-sm">
                    {['all', 'pending', 'preparing', 'ready'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-2 rounded-lg capitalize font-bold text-xs transition-all ${filterStatus === st
                                    ? 'bg-black text-white shadow-md font-black'
                                    : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
                                }`}
                        >
                            {st} ({st === 'all' ? activeOrders.length : activeOrders.filter(o => o.status === st).length})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="p-2.5 bg-white hover:bg-neutral-100 text-black rounded-xl border border-black transition-colors"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs rounded-xl font-bold flex items-center gap-2 transition-colors border border-black"
                    >
                        <LayoutDashboard className="w-4 h-4" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3.5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs rounded-xl font-bold flex items-center gap-2 transition-colors border border-black shadow-sm"
                    >
                        <Home className="w-4 h-4" /> Customer View
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-neutral-500 font-bold">Loading kitchen orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-black bg-white rounded-3xl border-2 border-black shadow-sm">
                    <ChefHat className="w-14 h-14 text-neutral-400 mx-auto mb-3" />
                    <p className="text-lg font-black text-black">No Active Kitchen Orders</p>
                    <p className="text-xs text-neutral-600 font-medium mt-1">Orders placed by customers will appear here live</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div
                                key={order.id}
                                className="flex flex-col justify-between rounded-2xl bg-white border-2 border-black shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl"
                            >
                                {/* Ticket Header */}
                                <div>
                                    <div className="bg-black p-4 text-white flex justify-between items-center border-b border-black">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white text-black font-black text-xl px-3 py-1 rounded-xl shadow-sm border border-black">
                                                T-{order.table_number}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">Table Order</span>
                                                <span className="text-sm font-bold text-white leading-none">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] font-black uppercase bg-neutral-800 text-white px-2.5 py-1 rounded-lg border border-neutral-700 block mb-1">
                                                {order.status}
                                            </span>
                                            <span className="text-[10px] text-neutral-400 font-mono flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Status Strip */}
                                    <div className="bg-neutral-100 px-4 py-2.5 border-b border-black flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-black font-semibold">
                                            <span className="text-neutral-600">Payment:</span>
                                            <span className="font-extrabold underline">
                                                {isPaid ? 'Paid Online 💳' : 'Pay at Counter 💵'}
                                            </span>
                                        </div>

                                        {!isPaid && (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="text-[11px] bg-black hover:bg-neutral-800 text-white font-black px-2.5 py-1 rounded-lg transition-colors"
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
                                                className="flex justify-between items-start bg-neutral-50 p-3 rounded-xl border border-black"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                                                        {item.quantity}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-black text-sm leading-tight">{item.dish_name || item.name}</h4>
                                                        {item.portion_label && (
                                                            <span className="text-[11px] font-bold text-neutral-700 block mt-0.5">
                                                                Portion: {item.portion_label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-black">
                                                    ${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Action Footer */}
                                <div className="p-4 bg-white border-t-2 border-black flex items-center justify-between gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase">Grand Total</span>
                                        <span className="text-lg font-black text-black">${Number(order.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                <Flame className="w-4 h-4" />
                                                <span>Start Preparing</span>
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                <Bell className="w-4 h-4" />
                                                <span>Mark Ready</span>
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white font-black text-xs rounded-xl transition-all border border-black flex items-center gap-1.5"
                                            >
                                                <Check className="w-4 h-4" />
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
