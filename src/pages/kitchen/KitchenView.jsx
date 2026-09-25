import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
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
    FileText
} from 'lucide-react';

export default function KitchenView() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [activeNotification, setActiveNotification] = useState(null);

    // Track previous known order IDs to detect new incoming orders
    const previousOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);

    const loadOrders = async () => {
        setLoading(true);
        const data = await apiService.getOrders();
        const freshOrders = data || [];

        // Check for new incoming orders
        const newOrders = freshOrders.filter(o => !previousOrderIdsRef.current.has(o.id));

        if (!isFirstLoadRef.current && newOrders.length > 0) {
            // Pick the latest order for popup notification
            const newest = newOrders[0];
            setActiveNotification(newest);

            // Play sound chime alert
            if (soundEnabled) {
                playOrderChimeSound();
            }
        }

        // Update known order IDs
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
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
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
        await apiService.updatePaymentStatus(orderId, 'paid');
        if (activeNotification?.id === orderId) {
            setActiveNotification(prev => prev ? { ...prev, payment_status: 'paid' } : null);
        }
        loadOrders();
    };

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const filteredOrders = filterStatus === 'all'
        ? activeOrders
        : activeOrders.filter(o => o.status === filterStatus);

    return (
        <div className="min-h-screen bg-[#f7f4ef] text-[#1a1815] p-4 md:p-6 font-sans relative overflow-x-hidden">

            {/* NEW ORDER POPUP NOTIFICATION MODAL & BANNER (WARM CREAM & GOLDEN OCHRE THEME) */}
            {activeNotification && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-bounce-in shadow-2xl">
                    <div className="bg-white rounded-[28px] p-5 border-2 border-[#c89346] shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#f4efe8] pb-3.5">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-full bg-[#c89346] text-white flex items-center justify-center font-black animate-pulse shadow-sm">
                                    <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <div>
                                    <span className="text-[11px] uppercase font-black text-[#8b5e2b] tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-[#c89346]" /> NEW TABLE ORDER RECEIVED!
                                    </span>
                                    <h3 className="text-lg font-black text-[#1a1815] leading-tight mt-0.5">
                                        Table #{activeNotification.table_number} · {activeNotification.customer_name || 'Guest'}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveNotification(null)}
                                className="p-2 text-[#776c5f] hover:text-[#1a1815] hover:bg-[#f5efea] rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 stroke-[2.2]" />
                            </button>
                        </div>

                        {/* Payment & Total info Card */}
                        <div className="flex justify-between items-center bg-[#fbf9f4] p-3.5 rounded-2xl border border-[#f2ece3] text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`font-black px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border ${
                                    activeNotification.payment_status === 'paid' 
                                        ? 'bg-[#e2f0e7] text-[#2d6a4f] border-[#cbe4d4]' 
                                        : 'bg-[#fdf4e8] text-[#8b5e2b] border-[#f2e2ca]'
                                }`}>
                                    💳 {activeNotification.payment_status === 'paid' ? 'Paid Online 💳' : 'Pay at Counter'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-[#8c8275] block font-bold">TOTAL AMOUNT</span>
                                <span className="text-lg font-black text-[#235c43]">₹{Number(activeNotification.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Ordered Items Breakdown inside Notification */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#8c8275] block">
                                ORDERED ITEMS ({ (activeNotification.order_items || activeNotification.items || []).length })
                            </span>
                            {(activeNotification.order_items || activeNotification.items || []).map((item, idx) => (
                                <div key={idx} className="bg-[#fbf9f4] p-3 rounded-2xl border border-[#f0e8dd] flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-[#8b5e2b] text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                            {item.quantity}x
                                        </span>
                                        <div>
                                            <span className="font-bold text-[#1a1815] text-sm">{item.dish_name || item.name}</span>
                                            {item.portion_label && <span className="text-[11px] text-[#8b5e2b] block font-semibold mt-0.5">Portion: {item.portion_label}</span>}
                                        </div>
                                    </div>
                                    <span className="font-black text-[#1a1815]">₹{(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Notification Quick Action Buttons */}
                        <div className="flex items-center gap-2.5 pt-1">
                            {activeNotification.status === 'pending' && (
                                <button
                                    onClick={() => handleStatusUpdate(activeNotification.id, 'preparing')}
                                    className="flex-1 bg-[#8b5e2b] hover:bg-[#785023] text-white font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Flame className="w-4 h-4" /> Start Preparing 🍳
                                </button>
                            )}
                            {activeNotification.status === 'preparing' && (
                                <button
                                    onClick={() => handleStatusUpdate(activeNotification.id, 'completed')}
                                    className="flex-1 bg-[#235c43] hover:bg-[#1b4834] text-white font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Complete Order / Served ✓
                                </button>
                            )}
                            <button
                                onClick={() => setActiveNotification(null)}
                                className="px-5 py-3 bg-[#fbf9f4] hover:bg-[#f5efea] text-[#332e27] text-xs font-extrabold rounded-2xl border border-[#dfd3c3] transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border border-[#e9e2d7] bg-white p-4.5 rounded-[24px] shadow-2xs gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#c89346] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                        <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-[#1a1815]">
                            Waiter & Kitchen Display (KDS)
                        </h1>
                        <p className="text-xs text-[#8c8275] font-semibold">Real-time table orders & waiter sound alerts</p>
                    </div>
                </div>

                {/* Sound Controls */}
                <div className="flex items-center gap-2 bg-[#f8f5ef] p-1.5 rounded-2xl border border-[#e8e1d7]">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all ${
                            soundEnabled ? 'bg-[#235c43] text-white shadow-2xs' : 'bg-[#e9e2d7] text-[#6e6458]'
                        }`}
                        title={soundEnabled ? 'Order Alert Sound Active' : 'Sound Muted'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                    </button>
                    <button
                        onClick={handleTestSound}
                        className="px-3 py-1.5 hover:bg-[#ede7de] text-[#332e27] text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        title="Test Sound Chime"
                    >
                        <Bell className="w-3.5 h-3.5 text-[#8b5e2b]" /> Test Chime
                    </button>
                </div>

                {/* Filter Tabs (Removed Ready tab) */}
                <div className="flex items-center gap-1 bg-[#f8f5ef] p-1.5 rounded-full border border-[#e8e1d7] text-xs">
                    {['all', 'pending', 'preparing'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-1.5 rounded-full capitalize font-extrabold transition-all ${
                                filterStatus === st
                                    ? 'bg-[#8b5e2b] text-white shadow-2xs'
                                    : 'text-[#6e6458] hover:text-[#1a1815] hover:bg-[#ede7de]'
                            }`}
                        >
                            {st === 'all' ? `All (${activeOrders.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${activeOrders.filter(o => o.status === st).length})`}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="w-10 h-10 rounded-full border border-[#e8e1d7] bg-white text-[#332e27] flex items-center justify-center hover:bg-[#fbf9f4] transition-colors shadow-2xs"
                        title="Refresh Orders"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2.5 bg-[#f8f5ef] hover:bg-[#ede7de] text-[#332e27] text-xs rounded-xl border border-[#e8e1d7] font-extrabold flex items-center gap-2 transition-colors"
                    >
                        <LayoutGrid className="w-4 h-4 text-[#8b5e2b]" /> Admin Portal
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2.5 bg-[#1a1815] hover:bg-black text-white text-xs rounded-xl font-extrabold flex items-center gap-2 transition-colors shadow-2xs"
                    >
                        <User className="w-4 h-4" /> Customer View
                    </button>
                </div>
            </div>

            {/* Orders Cards Grid */}
            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-[#8c8275] font-semibold">Loading kitchen & waiter orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-[#6e6458] bg-white rounded-[24px] border border-[#e9e2d7] shadow-2xs">
                    <UtensilsCrossed className="w-14 h-14 text-[#d8cfc4] mx-auto mb-3" />
                    <p className="text-xl font-black text-[#1a1815]">No Active Kitchen Orders</p>
                    <p className="text-xs text-[#8c8275] mt-1 font-medium">Orders placed by customers at tables will appear here live with sound alerts</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {filteredOrders.map((order) => {
                        const items = order.order_items || order.items || [];
                        const isPaid = order.payment_status === 'paid';

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-[24px] border border-[#ede7de] shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="bg-[#2a241e] p-4 text-white flex justify-between items-center rounded-t-[24px]">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white text-[#1a1815] font-black text-base px-3.5 py-1.5 rounded-xl shadow-2xs border border-[#e8e1d7] shrink-0">
                                                T-{order.table_number}
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-black text-[#c89346] block tracking-wider">TABLE ORDER</span>
                                                <span className="text-base font-bold text-white leading-tight block">{order.customer_name || 'Guest'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {order.status === 'preparing' && (
                                                <span className="bg-[#fdf4e8] text-[#8b5e2b] font-black text-[11px] px-3.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide border border-[#f2e2ca]">
                                                    <ChefHat className="w-3.5 h-3.5" /> PREPARING
                                                </span>
                                            )}
                                            {order.status === 'pending' && (
                                                <span className="bg-[#fef3c7] text-[#b45309] font-black text-[11px] px-3.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide animate-pulse border border-[#fde68a]">
                                                    PENDING
                                                </span>
                                            )}

                                            <span className="text-[11px] text-[#b8ad9e] font-medium flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Strip */}
                                    <div className="bg-[#fbf9f4] border-b border-[#f2ece3] px-4 py-3 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-[#554d42]">
                                            <CreditCard className="w-4 h-4 text-[#8b5e2b]" />
                                            <span className="text-[#8c8275] font-semibold">Payment</span>
                                            <span className="font-extrabold text-[#1a1815]">
                                                {isPaid ? 'Paid Online' : 'Pay at Counter'}
                                            </span>
                                        </div>

                                        {!isPaid ? (
                                            <button
                                                onClick={() => handleMarkPaid(order.id)}
                                                className="bg-white border border-[#dfd3c3] text-[#1a1815] font-extrabold px-3 py-1.5 rounded-xl shadow-2xs hover:bg-[#f5efea] text-[11px] flex items-center gap-1.5 transition-colors"
                                            >
                                                <CreditCard className="w-3.5 h-3.5 text-[#8b5e2b]" /> Mark Paid
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-black text-[#2d6a4f] bg-[#e2f0e7] px-2.5 py-1 rounded-lg border border-[#cbe4d4]">
                                                Paid ✓
                                            </span>
                                        )}
                                    </div>

                                    {/* Items List */}
                                    <div className="p-4 space-y-2.5 min-h-[140px] bg-white">
                                        {items.length > 0 ? (
                                            items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-[#fbf9f4] border border-[#f0e8dd] rounded-2xl p-3.5 flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-[#8b5e2b] text-white font-extrabold text-xs w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                                            {item.quantity}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-bold text-[#1a1815] text-sm">{item.dish_name || item.name}</h4>
                                                            {item.portion_label && (
                                                                <span className="text-xs text-[#8b5e2b] block mt-0.5 font-semibold">
                                                                    Portion: {item.portion_label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-[#1a1815] text-sm">
                                                        ₹{(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-[#fbf9f4] border border-[#f0e8dd] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                                                <ChefHat className="w-10 h-10 text-[#d8cfc4] mb-1" />
                                                <p className="font-bold text-[#1a1815] text-sm">No items listed</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-[#f2ece3] flex justify-between items-center bg-white rounded-b-[24px]">
                                    <div>
                                        <span className="text-[10px] uppercase font-extrabold text-[#8c8275] tracking-wider block">GRAND TOTAL</span>
                                        <span className="text-xl font-black text-[#235c43] mt-0.5 block">₹{Number(order.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="bg-[#8b5e2b] hover:bg-[#785023] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                                            >
                                                <Flame className="w-4 h-4" /> Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="bg-[#235c43] hover:bg-[#1b4834] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                                            >
                                                <Check className="w-4 h-4 text-white stroke-[2.5]" /> Complete Order
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
