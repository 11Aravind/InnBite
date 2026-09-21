import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import {
    DollarSign,
    ShoppingBag,
    Flame,
    Utensils,
    TrendingUp,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [dishesCount, setDishesCount] = useState(0);
    const [tablesCount, setTablesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiService.getOrders(),
            apiService.getDishes(),
            apiService.getTables()
        ]).then(([ordersData, dishesData, tablesData]) => {
            setOrders(ordersData || []);
            setDishesCount((dishesData || []).length);
            setTablesCount((tablesData || []).length);
        }).finally(() => setLoading(false));
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;

    return (
        <div className="space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-2 border-b border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        Dashboard Overview <TrendingUp className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-400">Live analytics and metrics for Orderly QR System</p>
                </div>
                <button
                    onClick={() => navigate('/kitchen')}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Flame className="w-4 h-4" />
                    <span>Open Live Kitchen Display</span>
                </button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">${totalRevenue.toFixed(2)}</div>
                    <span className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                        Accumulated earnings
                    </span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{orders.length}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                        {completedCount} completed orders
                    </span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Kitchen</span>
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Flame className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
                    <span className="text-[11px] text-amber-400 font-medium mt-1.5 block">
                        Active in kitchen
                    </span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Menu Items</span>
                        <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                            <Utensils className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{dishesCount}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                        {tablesCount} registered QR tables
                    </span>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl p-6">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-400" /> Recent Customer Orders
                    </h2>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                        <span>View All Orders</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-500">Loading order data...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No orders placed yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/60 text-xs font-bold text-slate-400 uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Table</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3.5 font-bold text-white">Table #{order.table_number}</td>
                                        <td className="px-4 py-3.5 font-medium text-slate-200">{order.customer_name || 'Guest'}</td>
                                        <td className="px-4 py-3.5 font-bold text-emerald-400">${Number(order.total_amount).toFixed(2)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                                {order.payment_status === 'paid' ? 'Paid' : 'Counter'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-semibold capitalize text-slate-300">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500">
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
