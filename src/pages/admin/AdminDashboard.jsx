import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-xs text-gray-500">Live analytics and metrics for Orderly QR System</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/kitchen')}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span>👨‍🍳 Open Live Kitchen View</span>
                    </button>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Total Revenue</span>
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">💰</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">${totalRevenue.toFixed(2)}</div>
                    <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Accumulated earnings</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Total Orders</span>
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">🧾</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{orders.length}</div>
                    <span className="text-[11px] text-gray-500 font-medium mt-1 block">{completedCount} completed orders</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Pending Kitchen</span>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">🍳</span>
                    </div>
                    <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
                    <span className="text-[11px] text-amber-600 font-medium mt-1 block">Active in kitchen</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Active Menu Items</span>
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-xl text-lg">🍔</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{dishesCount}</div>
                    <span className="text-[11px] text-gray-500 font-medium mt-1 block">{tablesCount} QR tables registered</span>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-gray-900">Recent Customer Orders</h2>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                        View All Orders →
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading order data...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No orders placed yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Table</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-bold text-gray-900">Table #{order.table_number}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{order.customer_name || 'Guest'}</td>
                                        <td className="px-4 py-3 font-bold text-emerald-600">${Number(order.total_amount).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {order.payment_status === 'paid' ? 'Paid' : 'Counter'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-semibold capitalize text-gray-700">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
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
