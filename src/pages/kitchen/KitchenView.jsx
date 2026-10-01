import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { playOrderChimeSound } from '../../utils/sound';
import {
    ChefHat,
    RefreshCw,
    LayoutGrid,
    User,
    Check,
    CreditCard,
    Clock,
    Bell,
    Flame,
    Volume2,
    VolumeX,
    X,
    Sparkles,
    CheckCircle2,
    UtensilsCrossed,
    FileText,
    LogOut,
    MessageSquare
} from 'lucide-react';

export default function KitchenView() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [activeNotification, setActiveNotification] = useState(null);

    const previousOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        const freshOrders = data || [];

        // Check for new incoming orders
        const newOrders = freshOrders.filter(o => !previousOrderIdsRef.current.has(o.id));

        if (!isFirstLoadRef.current && newOrders.length > 0) {
            const newest = newOrders[0];
            setActiveNotification(newest);
            if (soundEnabled) {
                playOrderChimeSound();
            }
        }

        freshOrders.forEach(o => previousOrderIdsRef.current.add(o.id));
        isFirstLoadRef.current = false;

        setOrders(freshOrders);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();

        const interval = setInterval(() => {
            loadOrders();
        }, 4000);

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('kitchen_orders')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                    if (soundEnabled) {
                        playOrderChimeSound();
                    }
                    if (payload.new) {
                        setActiveNotification(payload.new);
                    }
                    loadOrders();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                    loadOrders();
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [soundEnabled]);

    const handleTestSound = () => {
        playOrderChimeSound();
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        await apiService.updateOrderStatus(orderId, newStatus);
        if (activeNotification?.id === orderId) {
            setActiveNotification(prev => prev ? { ...prev, status: newStatus } : null);
        }
        loadOrders();
    };

    const handleMarkPaid = async (orderId) => {
        await apiService.updatePaymentStatus(orderId, 'SUCCESS');
        if (activeNotification?.id === orderId) {
            setActiveNotification(prev => prev ? { ...prev, payment_status: 'SUCCESS' } : null);
        }
        loadOrders();
    };

    const handleLogout = () => {
        logout();
        navigate('/waiter/login', { replace: true });
    };

    const activeOrders = orders.filter(o => o.status !== 'SERVED' && o.status !== 'completed' && o.status !== 'CANCELLED');
    const filteredOrders = filterStatus === 'all'
        ? activeOrders
        : activeOrders.filter(o => o.status === filterStatus);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans relative overflow-x-hidden">

            {/* Live New Order Popup Notification */}
            {activeNotification && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-bounce-in shadow-2xl">
                    <div className="bg-white rounded-3xl p-5 border-2 border-[#114536] text-slate-900 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#114536] text-white flex items-center justify-center font-bold shadow-md">
                                    <UtensilsCrossed className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-black text-[#114536] tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> NEW CONFIRMED ORDER
                                    </span>
                                    <h3 className="text-base font-black text-slate-900 leading-tight">
                                        {activeNotification.service_mode === 'SELF_SERVICE' || (!activeNotification.table_number && !activeNotification.table_id)
                                            ? `Self-Service Order #${activeNotification.order_number || activeNotification.id}`
                                            : `Table #${activeNotification.table_number} · Order #${activeNotification.order_number || activeNotification.id}`
                                        }
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveNotification(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Action */}
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                            <span className="font-extrabold text-slate-800">
                                Total: ₹{Number(activeNotification.total_amount || 0).toFixed(2)}
                            </span>
                            <button
                                onClick={() => {
                                    handleStatusUpdate(activeNotification.id, 'PREPARING');
                                    setActiveNotification(null);
                                }}
                                className="btn-primary text-xs px-4 py-2"
                            >
                                Start Preparing 🍳
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 bg-[#114536] p-5 rounded-3xl shadow-lg text-white gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                        <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black tracking-tight text-white">
                                Waiter Live Dashboard
                            </h1>
                            <span className="text-[10px] bg-white/15 text-white px-2.5 py-0.5 rounded-md font-mono font-bold border border-white/20">
                                {user?.name || 'Waiter Staff'}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-100/80 font-medium">Real-time waiter notification & order fulfillment</p>
                    </div>
                </div>

                {/* Controls & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${soundEnabled ? 'bg-white text-[#114536] shadow-sm' : 'bg-white/10 text-emerald-100 border border-white/20'
                            }`}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                    </button>

                    <button
                        onClick={handleTestSound}
                        className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-colors border border-white/20 flex items-center gap-1"
                    >
                        <Bell className="w-3.5 h-3.5 text-amber-300" /> Test Sound
                    </button>

                    <button
                        onClick={loadOrders}
                        className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors border border-white/20"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-white text-xs font-bold rounded-xl border border-rose-300/30 transition-colors flex items-center gap-1.5"
                    >
                        <LogOut className="w-3.5 h-3.5 text-rose-200" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs mb-6 w-fit">
                {['all', 'CONFIRMED', 'PREPARING', 'READY'].map((st) => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${filterStatus === st
                            ? 'bg-[#114536] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                            }`}
                    >
                        {st === 'all' ? `All Active (${activeOrders.length})` : st}
                    </button>
                ))}
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold text-xs">Loading live waiter orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
                    <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-black text-slate-900">No Active Orders</p>
                    <p className="text-xs text-slate-500 mt-1">Confirmed guest orders will appear here automatically with sound alerts</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isSelfServiceOrder = order.service_mode === 'SELF_SERVICE' || (!order.table_number && !order.table_id);

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="bg-[#114536] p-4 text-white flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block">
                                                ORDER #{order.order_number || order.id}
                                            </span>
                                            {isSelfServiceOrder ? (
                                                <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded block mt-1">
                                                    Self-Service (No Table)
                                                </span>
                                            ) : (
                                                <span className="text-lg font-black text-white block mt-0.5">
                                                    Table #{order.table_number}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-xs font-black px-3 py-1 rounded-full uppercase bg-white/15 text-white border border-white/20">
                                            {order.status || 'CONFIRMED'}
                                        </span>
                                    </div>

                                    {/* Info Strip */}
                                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                                        <span>Customer: <strong className="text-slate-900">{order.customer_name || 'Guest'}</strong></span>
                                        <span className="font-mono text-[11px] text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {/* Items & Customizations List */}
                                    <div className="p-4 space-y-3 min-h-[140px]">
                                        {items.map((item, idx) => {
                                            const customEntries = Object.entries(item.customizations || {});
                                            const note = item.special_instruction || item.specialInstruction;

                                            return (
                                                <div key={idx} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-[#114536] text-white font-black text-[11px] flex items-center justify-center">
                                                                {item.quantity}
                                                            </span>
                                                            <span className="font-bold text-slate-900 text-sm">
                                                                {item.dish_name || item.name}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono font-bold text-[#114536]">
                                                            ₹{(Number(item.unit_price_snapshot || item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* Portion */}
                                                    {item.portion_label && (
                                                        <span className="text-[10px] text-slate-500 font-semibold block">
                                                            Portion: {item.portion_label}
                                                        </span>
                                                    )}

                                                    {/* Customization tags */}
                                                    {customEntries.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                            {customEntries.map(([k, v]) => (
                                                                <span key={k} className="text-[10px] font-bold bg-emerald-50 text-[#114536] px-1.5 py-0.5 rounded border border-[#114536]/20">
                                                                    • {v === 'No' ? `No ${k}` : `${k}: ${v}`}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Special Instructions */}
                                                    {note && (
                                                        <p className="text-[10px] text-amber-900 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 mt-1 flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                                                            <span>"{note}"</span>
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base font-black text-[#114536]">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                                            {order.payment_status !== 'SUCCESS' && order.payment_status !== 'paid' && (
                                                <button
                                                    onClick={() => handleMarkPaid(order.id)}
                                                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[10px] font-extrabold cursor-pointer"
                                                    title="Mark Order Payment as Paid"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5">
                                        {(order.status === 'CONFIRMED' || order.status === 'pending') && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                                                className="px-3.5 py-2 btn-primary text-xs flex items-center gap-1"
                                            >
                                                <Flame className="w-3.5 h-3.5" />
                                                <span>Prepare</span>
                                            </button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'READY')}
                                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Mark Ready</span>
                                            </button>
                                        )}
                                        {(order.status === 'READY' || order.status === 'PREPARING') && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                                                className="px-3 py-2 btn-secondary text-xs"
                                            >
                                                Complete / Served
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
