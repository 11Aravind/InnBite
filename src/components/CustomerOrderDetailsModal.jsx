import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { ChefHat, Check, CreditCard, X, RefreshCw, MessageSquare, Utensils, Clock, Layers } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';
import { handleOrderRealtimeUpdate, syncActiveOrdersWithServer, getActiveOrdersFromStorage } from '../utils/orderUtils';

export default function CustomerOrderDetailsModal({
    order: initialSingleOrder,
    orders: initialOrdersProp,
    onClose,
    onOrderMore,
    disableSubscription = false
}) {
    const [orders, setOrders] = useState(() => {
        if (Array.isArray(initialOrdersProp) && initialOrdersProp.length > 0) return initialOrdersProp;
        if (initialSingleOrder) return [initialSingleOrder];
        return getActiveOrdersFromStorage();
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (Array.isArray(initialOrdersProp) && initialOrdersProp.length > 0) {
            setOrders(initialOrdersProp);
        } else if (initialSingleOrder) {
            setOrders([initialSingleOrder]);
        }
    }, [initialSingleOrder, initialOrdersProp]);

    const refreshActiveOrders = async () => {
        setIsRefreshing(true);
        const activeList = await syncActiveOrdersWithServer({ knownOrders: orders });
        if (!activeList || activeList.length === 0) {
            onClose();
        } else {
            setOrders(activeList);
        }
        setIsRefreshing(false);
    };

    useEffect(() => {
        if (!disableSubscription) {
            refreshActiveOrders();
        }

        const interval = setInterval(() => {
            if (!disableSubscription) {
                refreshActiveOrders();
            }
        }, 3000);

        let subscription;
        if (!disableSubscription && isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('modal_orders_track')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                    if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        setOrders(prevOrders => {
                            const updated = handleOrderRealtimeUpdate(prevOrders, payload.new || payload.old);
                            if (!updated || updated.length === 0) {
                                onClose();
                                return [];
                            }
                            return updated;
                        });
                    }
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [disableSubscription, onClose]);

    if (!orders || orders.length === 0) return null;

    const firstOrder = orders[0];
    const isSelfService = orders.every(o => o.service_mode === 'SELF_SERVICE' || (!o.table_number && !o.table_id));
    const tableNumber = orders.find(o => o.table_number)?.table_number || secureStorage.getItem('orderly_table_number') || '1';

    // Calculate combined total & overall status step
    const grandTotal = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const orderNumbersString = orders.map(o => `#${o.order_number || o.id}`).join(', ');

    const statusMap = { CONFIRMED: 1, ACCEPTED: 2, PREPARING: 2, READY: 3, SERVED: 3, pending: 1, preparing: 2, completed: 3 };
    const maxStep = Math.max(...orders.map(o => statusMap[o.status] || 1));

    const overallStatusLabel = orders.some(o => o.status === 'READY')
        ? 'READY FOR PICKUP / SERVING'
        : orders.some(o => o.status === 'PREPARING' || o.status === 'ACCEPTED')
            ? 'PREPARING IN KITCHEN'
            : 'CONFIRMED';

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
                                {orders.length > 1 ? `${orders.length} Active Orders` : 'Order Confirmed'}
                            </span>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                                {orders.length > 1 ? `Orders ${orderNumbersString}` : `Order ${orderNumbersString}`}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshActiveOrders}
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

                    {/* Service Mode Banner */}
                    {isSelfService ? (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                                Self-Service Pickup Orders
                            </span>
                            <p className="text-sm font-black text-amber-800">
                                Order Numbers: <span className="underline">{orderNumbersString}</span>
                            </p>
                            <p className="text-[11px] text-amber-700 font-semibold">
                                (Keep your order numbers handy when collecting food)
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                    Table Service Active Orders
                                </span>
                                <span className="text-lg font-black text-white">
                                    Table #{tableNumber}
                                </span>
                            </div>
                            <span className="text-xs font-extrabold bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700">
                                {orders.length} Sub-Order{orders.length > 1 ? 's' : ''} Active
                            </span>
                        </div>
                    )}

                    {/* Overall Progress Stepper */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
                        <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                            <span>Overall Progress</span>
                            <span className="capitalize px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                {overallStatusLabel}
                            </span>
                        </div>

                        {/* Stepper Timeline */}
                        <div className="relative pt-2 pb-1">
                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                {[
                                    { step: 1, label: 'Confirmed', icon: Check, time: formatTime(firstOrder?.created_at) },
                                    { step: 2, label: 'Preparing', icon: ChefHat, time: maxStep >= 2 ? 'In Kitchen' : '—' },
                                    { step: 3, label: 'Ready/Served', icon: Check, time: maxStep >= 3 ? 'Ready' : '—' }
                                ].map((st) => {
                                    const isActive = maxStep >= st.step;
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

                    {/* Breakdown of Sub-Orders */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-slate-400" />
                                All Ordered Items ({orders.reduce((acc, o) => acc + (o.order_items || o.items || []).length, 0)} Items)
                            </h4>
                            {orders.length > 1 && (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    {orders.length} Sub-Orders Combined
                                </span>
                            )}
                        </div>

                        {orders.map((subOrder, subIdx) => {
                            const items = subOrder.order_items || subOrder.items || [];
                            const isPaid = subOrder.payment_status === 'SUCCESS' || subOrder.payment_status === 'paid';

                            return (
                                <div key={subOrder.id || subIdx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                                    {/* Order Ticket Header */}
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                Order #{subOrder.order_number || subOrder.id}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {formatTime(subOrder.created_at)}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                                            {subOrder.status || 'CONFIRMED'}
                                        </span>
                                    </div>

                                    {/* Items in this Order */}
                                    <div className="space-y-2">
                                        {items.map((item, idx) => {
                                            const customEntries = Object.entries(item.customizations || {});
                                            const instruction = item.special_instruction || item.specialInstruction;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1.5 shadow-2xs"
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

                                                    {/* Customizations */}
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

                                    {/* Sub-order subtotal & payment badge */}
                                    <div className="flex items-center justify-between pt-1 text-xs">
                                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                            {isPaid ? 'Paid' : 'Payment Pending'}
                                        </span>
                                        <span className="font-black text-slate-900">
                                            Subtotal: ₹{Number(subOrder.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Combined Grand Total */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                Combined Grand Total
                            </span>
                            <span className="text-xs text-slate-400">
                                All {orders.length} Active Orders Included (Taxes Included)
                            </span>
                        </div>
                        <span className="text-2xl font-black text-white">
                            ₹{grandTotal.toFixed(2)}
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