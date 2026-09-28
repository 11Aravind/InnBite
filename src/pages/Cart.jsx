import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import CartItem from '../components/CartItem';
import { apiService } from '../utils/apiService';
import { getOrCreateCustomerSession } from '../utils/session';
import { openRazorpayCheckout } from '../utils/razorpay';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import { ChefHat, Check, Clock, CreditCard, Sparkles, Utensils, AlertCircle } from 'lucide-react';

export default function Cart() {
    const navigate = useNavigate();
    const {
        items,
        updateItemQuantity,
        removeItem,
        cartTotal,
        emptyCart,
        isEmpty
    } = useCart();

    const session = getOrCreateCustomerSession();

    const [settings, setSettings] = useState(null);
    const [tableNumber, setTableNumber] = useState(() => {
        return session.table_number || localStorage.getItem('orderly_table_number') || '1';
    });

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(null);
    const [checkoutError, setCheckoutError] = useState('');

    useEffect(() => {
        apiService.getRestaurantSettings().then(setSettings);
    }, []);

    const isSelfService = (settings?.service_mode || session.service_mode) === 'SELF_SERVICE';

    const handleClose = () => {
        navigate(-1);
    };

    const handleTableChange = (e) => {
        const val = e.target.value;
        setTableNumber(val);
        localStorage.setItem('orderly_table_number', val);
    };

    const handleSaveOrderState = (orderData) => {
        setOrderPlaced(orderData);
        try {
            localStorage.setItem('orderly_active_order', JSON.stringify(orderData));
        } catch (e) {
            console.error('Error saving active order:', e);
        }
    };

    const handlePlaceOrder = async () => {
        if (isEmpty) return;
        setCheckoutError('');
        setIsSubmitting(true);

        // Generate Idempotency Key (Req Sec 42, 52)
        const checkoutAttemptId = 'chk_' + session.session_id + '_' + Date.now();

        const orderPayload = {
            idempotency_key: checkoutAttemptId,
            session_id: session.session_id,
            service_mode: isSelfService ? 'SELF_SERVICE' : 'TABLE_SERVICE',
            table_number: isSelfService ? null : tableNumber,
            table_id: isSelfService ? null : `tbl-${tableNumber}`,
            customer_name: customerName || 'Guest',
            customer_phone: customerPhone || '',
            total_amount: cartTotal,
            payment_method: 'razorpay',
            payment_status: 'SUCCESS',
            items: items.map(item => ({
                id: item.id,
                dish_id: item.dish_id || item.id,
                name: item.name,
                price: item.price,
                portion: item.portion || 'Regular',
                quantity: item.quantity,
                customizations: item.customizations || {},
                special_instruction: item.special_instruction || item.specialInstruction || ''
            }))
        };

        try {
            await openRazorpayCheckout({
                amount: cartTotal,
                customerName: customerName || 'Guest',
                customerPhone: customerPhone || '9999999999',
                onSuccess: async (razorpayResponse) => {
                    const finalPayload = {
                        ...orderPayload,
                        payment_status: 'SUCCESS',
                        razorpay_payment_id: razorpayResponse.razorpay_payment_id
                    };
                    const res = await apiService.createOrder(finalPayload);
                    setIsSubmitting(false);
                    if (res.success) {
                        handleSaveOrderState(res.order);
                        emptyCart();
                    } else {
                        setCheckoutError(res.error || 'Failed to place order.');
                    }
                },
                onFailure: async (err) => {
                    setIsSubmitting(false);
                    if (err?.message?.includes('cancelled')) {
                        return; // User intentionally closed popup
                    }

                    const confirmDemo = window.confirm(
                        `Razorpay Online Payment could not be processed (${err.message || '401 Unauthorized'}).\n\nWould you like to complete this order using Demo/Test Payment?`
                    );

                    if (confirmDemo) {
                        setIsSubmitting(true);
                        const demoPayload = {
                            ...orderPayload,
                            payment_status: 'SUCCESS',
                            razorpay_payment_id: 'pay_demo_' + Date.now()
                        };
                        const res = await apiService.createOrder(demoPayload);
                        setIsSubmitting(false);
                        if (res.success) {
                            handleSaveOrderState(res.order);
                            emptyCart();
                        } else {
                            setCheckoutError(res.error || 'Failed to place order.');
                        }
                    }
                }
            });
        } catch (err) {
            setIsSubmitting(false);
            setCheckoutError('Checkout Error: ' + (err.message || 'Unknown error'));
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-[#f8fafc] py-8 px-4 font-sans flex items-center justify-center">
                <CustomerOrderDetailsModal
                    order={orderPlaced}
                    onClose={() => navigate('/')}
                    onOrderMore={() => navigate('/')}
                />
            </div>
        );
    }

    return (
        <div className="container relative flex size-full min-h-screen flex-col bg-slate-50 justify-between font-sans overflow-x-hidden max-w-lg mx-auto">
            <div>
                {/* Header */}
                <div className="flex items-center bg-white p-4 justify-between border-b border-slate-100 shadow-sm sticky top-0 z-20">
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-slate-900 text-base font-extrabold tracking-tight">
                        Your Order Cart
                    </h2>
                    <div className="w-10" />
                </div>

                {/* Service Mode & Table Banner */}
                <div className="p-4">
                    {isSelfService ? (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                🛒
                            </div>
                            <div>
                                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                                    Self-Service Hotel Mode
                                </span>
                                <span className="text-xs text-amber-700 font-semibold">
                                    No table number required. You will collect your food using your unique Order Number.
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                    📍
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Table Assignment
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        Table #{tableNumber}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                <label className="text-xs text-slate-500 font-bold">No:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={tableNumber}
                                    onChange={handleTableChange}
                                    className="w-10 text-center text-xs font-extrabold outline-none bg-transparent text-slate-900"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Notice */}
                {checkoutError && (
                    <div className="mx-4 mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>{checkoutError}</div>
                    </div>
                )}

                {/* Items List */}
                <div className="px-4">
                    <h3 className="text-slate-900 text-xs font-bold uppercase tracking-wider pb-3">
                        Items in Cart ({items.length})
                    </h3>

                    {isEmpty ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-500 space-y-3 shadow-sm">
                            <span className="text-5xl block mb-2">🛒</span>
                            <p className="text-sm font-bold text-slate-800">Your cart is currently empty.</p>
                            <p className="text-xs text-slate-500">Scan menu items to add them to your session.</p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <CartItem
                                key={item.id}
                                {...item}
                                onIncrease={() => updateItemQuantity(item.id, item.quantity + 1)}
                                onDecrease={() => updateItemQuantity(item.id, item.quantity - 1)}
                                onRemove={() => removeItem(item.id)}
                            />
                        ))
                    )}
                </div>

                {!isEmpty && (
                    <div className="p-4 space-y-4 pb-32">
                        {/* Customer Details Form */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Guest Customer Info (Optional)
                            </h3>
                            <input
                                type="text"
                                placeholder="Your Name (e.g. John)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
                            />
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Order Summary
                            </h3>
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Taxes & Fees</span>
                                <span className="text-emerald-600 font-bold">Included</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-black text-slate-900">
                                <span>Total Payable</span>
                                <span className="text-base text-rose-600">₹{cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Confirm Order Bar */}
            {!isEmpty && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30 shadow-2xl">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-between transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span>Verifying & Processing Order...</span>
                            ) : (
                                <>
                                    <span>Confirm & Pay Online</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                                        ₹{cartTotal.toFixed(2)}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
