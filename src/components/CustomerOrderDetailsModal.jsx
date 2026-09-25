import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { ChefHat, Check, Clock, CreditCard, X, RefreshCw, Sparkles, UtensilsCrossed, FileText } from 'lucide-react';

export default function CustomerOrderDetailsModal({ order: initialOrder, onClose, onOrderMore }) {
    const [order, setOrder] = useState(initialOrder);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshOrderStatus = async () => {
        if (!order?.id) return;
        setIsRefreshing(true);
        const allOrders = await apiService.getOrders();
        const updated = allOrders.find(o => o.id === order.id);
        if (updated) {
            setOrder(updated);
            localStorage.setItem('orderly_active_order', JSON.stringify(updated));
        }
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshOrderStatus();

        const interval = setInterval(() => {
            refreshOrderStatus();
        }, 3000);

        let subscription;
        if (isSupabaseConfigured && supabase && order?.id) {
            subscription = supabase
                .channel(`order_track_${order.id}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (payload) => {
                    if (payload.new) {
                        setOrder(prev => ({ ...prev, ...payload.new }));
                        localStorage.setItem('orderly_active_order', JSON.stringify({ ...order, ...payload.new }));
                    }
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [order?.id]);

    if (!order) return null;

    const items = order.order_items || order.items || [];
    const isPaid = order.payment_status === 'paid';

    // Status step index calculation: 1=pending (Received), 2=preparing, 3=completed (Served)
    const statusMap = { pending: 1, preparing: 2, completed: 3 };
    const currentStep = statusMap[order.status] || 1;

    const formatTime = (isoString) => {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '—';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden flex flex-col my-auto border border-[#ede7de]">
                
                {/* Modal Top Header */}
                <div className="p-6 pb-4 flex items-center justify-between bg-white border-b border-[#f4efe8]">
                    <div className="flex items-center gap-3.5">
                        {/* Ochre Golden Circle Badge */}
                        <div className="w-12 h-12 rounded-full bg-[#c89346] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                            <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a1815] tracking-tight leading-tight">
                                Order Details
                            </h2>
                            <p className="text-xs font-semibold text-[#8c8275] mt-0.5">
                                Order #{order.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshOrderStatus}
                            className={`p-2 text-[#776c5f] hover:text-[#1a1815] hover:bg-[#f5efea] rounded-full transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh order status"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-[#776c5f] hover:text-[#1a1815] hover:bg-[#f5efea] rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 stroke-[2.2]" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] bg-white">

                    {/* Section 1: Live Status Timeline Card */}
                    <div className="bg-[#fbf9f4] rounded-2xl p-4 border border-[#f2ece3] space-y-4">
                        <div className="flex justify-between items-center text-sm font-extrabold text-[#2a2621]">
                            <span>Live Status</span>
                            
                            {/* Status Pill Badge */}
                            <span className="capitalize px-3 py-1 rounded-full text-xs font-black bg-[#e2f0e7] text-[#2d6a4f] flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse"></span>
                                {order.status === 'pending' ? 'Pending' : order.status === 'preparing' ? 'Preparing' : 'Served'}
                            </span>
                        </div>

                        {/* Stepper Timeline (3 steps: Received -> Preparing -> Served) */}
                        <div className="relative pt-2 pb-1">
                            {/* Horizontal Connecting Bar */}
                            <div className="absolute top-6 left-10 right-10 h-[2px] bg-[#e6dfd5] -z-0"></div>

                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                {[
                                    { step: 1, label: 'Received', icon: Check, time: formatTime(order.created_at) },
                                    { step: 2, label: 'Preparing', icon: ChefHat, time: currentStep >= 2 ? 'In Progress' : '—' },
                                    { step: 3, label: 'Served', icon: Check, time: currentStep >= 3 ? 'Completed' : '—' }
                                ].map((st) => {
                                    const isActive = currentStep >= st.step;
                                    const IconComp = st.icon;

                                    return (
                                        <div key={st.step} className="flex flex-col items-center gap-1.5 text-center">
                                            {/* Step Circle Icon */}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                                isActive 
                                                    ? 'bg-[#235c43] text-white shadow-sm ring-4 ring-[#e2f0e7]' 
                                                    : 'bg-[#ede7de] text-[#8a8175]'
                                            }`}>
                                                <IconComp className="w-4 h-4 stroke-[2.5]" />
                                            </div>

                                            {/* Label */}
                                            <span className={`text-xs font-bold ${isActive ? 'text-[#235c43] font-black' : 'text-[#8a8175]'}`}>
                                                {st.label}
                                            </span>

                                            {/* Time */}
                                            <span className="text-[10px] text-[#9c9183] font-medium block">
                                                {st.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Table & Customer Information Card */}
                    <div className="bg-[#fbf9f4] p-4 rounded-2xl border border-[#f2ece3] space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-bold text-[#8c8275] block">Table</span>
                                <span className="text-lg font-black text-[#1a1815] block mt-0.5">Table #{order.table_number}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-[#8c8275] block">Customer</span>
                                <span className="text-lg font-black text-[#1a1815] block mt-0.5">{order.customer_name || 'Guest'}</span>
                            </div>
                        </div>

                        {/* Payment Status Badges */}
                        <div className="pt-2 border-t border-[#eee6db] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 bg-[#e2f0e7] text-[#2d6a4f] px-3 py-1.5 rounded-xl font-bold border border-[#cbe4d4]">
                                💳 <span>{isPaid ? 'Paid Online 💳' : 'Pay at Counter'}</span>
                            </div>

                            {order.razorpay_payment_id && (
                                <div className="flex items-center gap-1 bg-[#f0ece3] text-[#554d42] px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border border-[#e3dcd0]">
                                    <FileText className="w-3.5 h-3.5 text-[#887c6e]" />
                                    <span>Ref: {order.razorpay_payment_id}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Ordered Items Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-[#4a4339]">
                            Ordered Items Breakdown ({items.length})
                        </h4>

                        <div className="space-y-2.5">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white border border-[#f0e8dd] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-[#dfd3c3] transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        {/* Dish Image Thumbnail */}
                                        <div className="w-11 h-11 rounded-xl bg-[#f5efea] overflow-hidden shrink-0 border border-[#e9e2d7] flex items-center justify-center text-[#8c8275] font-bold">
                                            {item.image || item.image_url ? (
                                                <img src={item.image || item.image_url} alt={item.dish_name || item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{item.quantity}x</span>
                                            )}
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-[#1a1815] text-sm leading-snug">
                                                {item.dish_name || item.name}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-[#8c8275] font-medium">
                                                    ₹{Number(item.unit_price || item.price).toFixed(2)} each
                                                </span>
                                                {item.portion_label && (
                                                    <span className="text-[11px] font-bold text-[#8b5e2b] bg-[#fbf4e8] px-1.5 py-0.5 rounded border border-[#f2e2ca]">
                                                        {item.portion_label}
                                                    </span>
                                                )}
                                                <span className="text-xs font-extrabold text-[#1a1815]">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="font-black text-[#1a1815] text-base">
                                        ₹{(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Subtotal & Grand Total Card */}
                    <div className="bg-[#fbf9f4] p-4 rounded-2xl border border-[#f2ece3] space-y-2.5">
                        <div className="flex justify-between text-xs font-semibold text-[#8c8275]">
                            <span>Items Subtotal</span>
                            <span className="font-bold text-[#332e27]">₹{Number(order.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-[#8c8275] pb-2.5 border-b border-[#eee6db]">
                            <span>Taxes & Service</span>
                            <span className="font-bold text-[#332e27]">Included</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-black text-[#1a1815]">Grand Total Paid</span>
                            <span className="text-2xl font-black text-[#235c43]">₹{Number(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 bg-white border-t border-[#f4efe8] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 bg-[#fbf9f4] border border-[#dfd3c3] text-[#332e27] font-extrabold rounded-2xl hover:bg-[#f5efea] transition-colors text-sm shadow-2xs"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            if (onOrderMore) onOrderMore();
                        }}
                        className="flex-1 py-3.5 px-4 bg-[#8b5e2b] text-white font-extrabold rounded-2xl hover:bg-[#785023] transition-colors text-sm shadow-md"
                    >
                        Order More Dishes
                    </button>
                </div>
            </div>
        </div>
    );
}
