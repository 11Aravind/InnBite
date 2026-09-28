import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { ChefHat, Check, Clock, CreditCard, X, RefreshCw, Sparkles, UtensilsCrossed, FileText, MessageSquare } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';
import { handleOrderRealtimeUpdate, syncActiveOrderWithServer } from '../utils/orderUtils';

export default function CustomerOrderDetailsModal({ order: initialOrder, onClose, onOrderMore, disableSubscription = false }) {
    const [order, setOrder] = useState(initialOrder);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (disableSubscription) {
            setOrder(initialOrder);
        }
    }, [initialOrder, disableSubscription]);

    const refreshOrderStatus = async () => {
        if (!order?.id) return;
        setIsRefreshing(true);
        const updated = await syncActiveOrderWithServer(order);
        if (!updated) {
            onClose();
        } else {
            setOrder(updated);
        }
        setIsRefreshing(false);
    };

    useEffect(() => {
        if (!disableSubscription) {
            refreshOrderStatus();
        }

        const interval = setInterval(() => {
            if (!disableSubscription) {
                refreshOrderStatus();
            }
        }, 3000);

        let subscription;
        if (!disableSubscription && isSupabaseConfigured && supabase && order?.id) {
            subscription = supabase
                .channel(`order_track_${order.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                    if (payload.eventType === 'DELETE' && (payload.old?.id === order.id)) {
                        secureStorage.removeItem('orderly_active_order');
                        onClose();
                    } else if (payload.eventType === 'UPDATE' && payload.new?.id === order.id) {
                        const updated = handleOrderRealtimeUpdate(order, payload.new);
                        if (!updated) {
                            onClose();
                        } else {
                            setOrder(updated);
                        }
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
    const isPaid = order.payment_status === 'SUCCESS' || order.payment_status === 'paid';
    const isSelfService = order.service_mode === 'SELF_SERVICE' || (!order.table_number && !order.table_id);

    const statusMap = { CONFIRMED: 1, ACCEPTED: 2, PREPARING: 2, READY: 3, SERVED: 3, pending: 1, preparing: 2, completed: 3 };
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">

                {/* Modal Top Header */}
                <div className="p-6 pb-4 flex items-center justify-between bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-md shadow-emerald-600/20">
                            <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                        <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                Order Confirmed
                            </span>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                                Order #{order.order_number || order.id}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshOrderStatus}
                            className={`p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh order status"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 stroke-[2.2]" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] bg-white">

                    {/* Service Mode Callout Banner */}
                    {isSelfService ? (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                                Self-Service Pickup Order
                            </span>
                            <p className="text-sm font-black text-amber-800">
                                Please keep your order number <span className="underline">#{order.order_number || order.id}</span> to collect food.
                            </p>
                            <p className="text-[11px] text-amber-700 font-semibold">
                                (No table assigned for self-service mode)
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                    Table Service Order
                                </span>
                                <span className="text-lg font-black text-white">
                                    Table #{order.table_number}
                                </span>
                            </div>
                            <span className="text-xs font-extrabold bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700">
                                Table QR Identified
                            </span>
                        </div>
                    )}

                    {/* Live Status Timeline Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
                        <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                            <span>Order Progress</span>
                            <span className="capitalize px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                {order.status || 'CONFIRMED'}
                            </span>
                        </div>

                        {/* Stepper Timeline */}
                        <div className="relative pt-2 pb-1">
                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                {[
                                    { step: 1, label: 'Confirmed', icon: Check, time: formatTime(order.created_at) },
                                    { step: 2, label: 'Preparing', icon: ChefHat, time: currentStep >= 2 ? 'In Kitchen' : '—' },
                                    { step: 3, label: 'Ready/Served', icon: Check, time: currentStep >= 3 ? 'Ready' : '—' }
                                ].map((st) => {
                                    const isActive = currentStep >= st.step;
                                    const IconComp = st.icon;

                                    return (
                                        <div key={st.step} className="flex flex-col items-center gap-1.5 text-center">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isActive
                                                ? 'bg-slate-900 text-white shadow-sm ring-4 ring-slate-200'
                                                : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                <IconComp className="w-4 h-4 stroke-[2.5]" />
                                            </div>
                                            <span className={`text-xs font-bold ${isActive ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                                                {st.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium block">
                                                {st.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            <span className="font-extrabold text-slate-900">
                                {isPaid ? 'Payment Verified (SUCCESS)' : 'Payment Pending'}
                            </span>
                        </div>
                        {order.razorpay_payment_id && (
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                ID: {order.razorpay_payment_id}
                            </span>
                        )}
                    </div>

                    {/* Items Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Ordered Items & Customizations ({items.length})
                        </h4>

                        <div className="space-y-2.5">
                            {items.map((item, idx) => {
                                const customEntries = Object.entries(item.customizations || {});
                                const instruction = item.special_instruction || item.specialInstruction;

                                return (
                                    <div
                                        key={idx}
                                        className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900 text-sm">
                                                    {item.dish_name || item.name}
                                                </span>
                                                {item.portion_label && (
                                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                        {item.portion_label}
                                                    </span>
                                                )}
                                                <span className="text-xs font-extrabold text-slate-900">
                                                    × {item.quantity}
                                                </span>
                                            </div>
                                            <span className="font-black text-slate-900 text-sm">
                                                ₹{(Number(item.unit_price_snapshot || item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Customizations tags */}
                                        {customEntries.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {customEntries.map(([k, v]) => (
                                                    <span key={k} className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                                        • {v === 'No' ? `No ${k}` : `${k}: ${v}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Special Instruction */}
                                        {instruction && (
                                            <p className="text-[11px] text-indigo-700 italic bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                                                <span>Note: "{instruction}"</span>
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                Grand Total Paid
                            </span>
                            <span className="text-xs text-slate-400">All Taxes & Charges Included</span>
                        </div>
                        <span className="text-2xl font-black text-white">
                            ₹{Number(order.total_amount || order.subtotal || 0).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 bg-slate-100 border border-slate-200 text-slate-800 font-extrabold rounded-2xl hover:bg-slate-200 transition-colors text-xs"
                    >
                        Close Window
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            if (onOrderMore) onOrderMore();
                        }}
                        className="flex-1 py-3.5 px-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors text-xs shadow-md"
                    >
                        Order More Food
                    </button>
                </div>
            </div>
        </div>
    );
}
