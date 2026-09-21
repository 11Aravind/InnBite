import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPayment, setFilterPayment] = useState('all'); // 'all', 'paid', 'pending'

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleMarkPaid = async (orderId) => {
        await apiService.updatePaymentStatus(orderId, 'paid');
        loadOrders();
    };

    const handleUpdateStatus = async (orderId, status) => {
        await apiService.updateOrderStatus(orderId, status);
        loadOrders();
    };

    const filteredOrders = filterPayment === 'all'
        ? orders
        : orders.filter(o => o.payment_status === filterPayment);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders & Payments Log</h1>
                    <p className="text-xs text-gray-500">Track incoming table orders, collection status, and razorpay logs</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 text-xs">
                        {['all', 'paid', 'pending'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilterPayment(p)}
                                className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-colors ${filterPayment === p ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                            >
                                {p === 'pending' ? 'Unpaid / Counter' : p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadOrders}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No orders matching filter</div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                                <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black bg-gray-900 text-white px-3 py-1 rounded-xl">
                                            Table #{order.table_number}
                                        </span>
                                        <div>
                                            <span className="font-bold text-gray-900 block text-sm">{order.customer_name || 'Guest'}</span>
                                            <span className="text-xs text-gray-400 font-mono">{order.id} · {new Date(order.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block font-medium">Order Status</span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none capitalize"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div className="text-right pl-3 border-l border-gray-100">
                                            <span className="text-xs text-gray-400 block font-medium">Total Amount</span>
                                            <span className="text-base font-black text-emerald-600">${Number(order.total_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Breakdown */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-900 mr-1.5">{item.quantity}x</span>
                                                <span className="font-medium text-gray-800">{item.dish_name || item.name}</span>
                                                {item.portion_label && <span className="text-[10px] text-gray-500 block">Portion: {item.portion_label}</span>}
                                            </div>
                                            <span className="font-bold text-gray-700">${(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Footer */}
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50/50 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Method:</span>
                                        <span className="font-bold text-gray-900 capitalize">{order.payment_method === 'razorpay' ? 'Razorpay Online 💳' : 'Pay at Counter 💵'}</span>
                                        {order.razorpay_payment_id && (
                                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                                ID: {order.razorpay_payment_id}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {isPaid ? 'PAID ✅' : 'UNPAID / COUNTER 💵'}
                                        </span>

                                        {!isPaid && (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                                            >
                                                Mark Paid & Collected
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
