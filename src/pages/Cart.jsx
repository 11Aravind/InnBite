import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import CartItem from '../components/CartItem';
import { apiService } from '../utils/apiService';
import { getOrCreateCustomerSession } from '../utils/session';
import { openRazorpayCheckout } from '../utils/razorpay';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import { CreditCard, AlertCircle, Store, CheckCircle2 } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';
import { addActiveOrderToStorage } from '../utils/orderUtils';
import { useSettings } from '../context/SettingsContext';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { toast } from 'react-hot-toast';

export default function Cart() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const {
        items,
        updateItemQuantity,
        updateItem,
        removeItem,
        cartTotal,
        emptyCart,
        isEmpty
    } = useCart();

    const session = getOrCreateCustomerSession();

    const [tableNumber, setTableNumber] = useState(() => {
        return session.table_number || secureStorage.getItem('orderly_table_number') || '1';
    });

    const [customerName, setCustomerName] = useState(() => {
        return secureStorage.getItem('orderly_customer_name') || '';
    });
    const [customerPhone, setCustomerPhone] = useState(() => {
        return secureStorage.getItem('orderly_customer_phone') || '';
    });

    const handleCustomerNameChange = (e) => {
        const val = e.target.value;
        setCustomerName(val);
        secureStorage.setItem('orderly_customer_name', val);
    };

    const handleCustomerPhoneChange = (e) => {
        const val = e.target.value;
        setCustomerPhone(val);
        secureStorage.setItem('orderly_customer_phone', val);
    };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(null);
    const [checkoutError, setCheckoutError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('online');

    // Live Stock Availability State for items in Cart
    const [unavailableItemIds, setUnavailableItemIds] = useState(new Set());

    const checkCartStockAvailability = async () => {
        if (isEmpty) return;
        try {
            const dishes = await apiService.getDishes();
            const dishMap = new Map((dishes || []).map(d => [d.id, d]));
            const unavailSet = new Set();
            for (const item of items) {
                const rawId = item.dish_id || item.id;
                const dbDish = dishMap.get(rawId);
                if (dbDish && dbDish.is_available === false) {
                    unavailSet.add(rawId);
                }
            }
            setUnavailableItemIds(unavailSet);
        } catch (e) {
            console.error('Stock check error:', e);
        }
    };

    useEffect(() => {
        checkCartStockAvailability();

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('cart_realtime_stock')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
                    checkCartStockAvailability();
                })
                .subscribe();
        }
        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [items]);

    const paymentModeSetting = settings?.payment_mode || 'BOTH';

    useEffect(() => {
        if (paymentModeSetting === 'PAY_AT_COUNTER') {
            setPaymentMethod('cash_at_counter');
        } else if (paymentModeSetting === 'ONLINE_ONLY') {
            setPaymentMethod('online');
        }
    }, [paymentModeSetting]);

    const isSelfService = (settings?.service_mode || session.service_mode) === 'SELF_SERVICE';
    const hasUnavailableItems = items.some(item => unavailableItemIds.has(item.dish_id || item.id));

    const handleClose = () => {
        navigate(-1);
    };

    const handleTableChange = (e) => {
        const val = e.target.value;
        setTableNumber(val);
        secureStorage.setItem('orderly_table_number', val);
    };

    const handleSaveOrderState = (orderData) => {
        setOrderPlaced(orderData);
        try {
            addActiveOrderToStorage(orderData);
        } catch (e) {
            console.error('Error saving active order:', e);
        }
    };

    const handlePlaceOrder = async () => {
        if (isEmpty) return;
        setCheckoutError('');
        setIsSubmitting(true);

        // Pre-checkout Live Database Availability Guard
        try {
            const freshDishes = await apiService.getDishes();
            const dishMap = new Map((freshDishes || []).map(d => [d.id, d]));
            const unavailableNames = [];
            const unavailSet = new Set();

            for (const item of items) {
                const rawId = item.dish_id || item.id;
                const dbDish = dishMap.get(rawId);
                if (dbDish && dbDish.is_available === false) {
                    unavailableNames.push(item.name || dbDish.name || 'Dish');
                    unavailSet.add(rawId);
                }
            }

            if (unavailableNames.length > 0) {
                setUnavailableItemIds(unavailSet);
                setIsSubmitting(false);
                const alertMsg = `⚠️ Stock Alert: "${unavailableNames.join(', ')}" is currently out of stock. Please remove unavailable items to checkout.`;
                setCheckoutError(alertMsg);
                toast.error(alertMsg, { duration: 4000 });
                return;
            }
        } catch (e) {
            console.warn('Pre-checkout stock guard check error:', e);
        }

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

        // If paying at counter / cash on shop
        if (paymentMethod === 'cash_at_counter' || paymentModeSetting === 'PAY_AT_COUNTER') {
            try {
                const counterPayload = {
                    ...orderPayload,
                    payment_method: 'cash_at_counter',
                    payment_status: 'PENDING'
                };
                const res = await apiService.createOrder(counterPayload);
                setIsSubmitting(false);
                if (res.success) {
                    handleSaveOrderState(res.order);
                    emptyCart();
                } else {
                    setCheckoutError(res.error || 'Failed to place order.');
                }
            } catch (err) {
                setIsSubmitting(false);
                setCheckoutError('Order Error: ' + (err.message || 'Unknown error'));
            }
            return;
        }

        // Online Razorpay Payment
        try {
            await openRazorpayCheckout({
                amount: cartTotal,
                customerName: customerName || 'Guest',
                customerPhone: customerPhone || '9999999999',
                onSuccess: async (razorpayResponse) => {
                    const finalPayload = {
                        ...orderPayload,
                        payment_method: 'razorpay',
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
                        return;
                    }
                    setCheckoutError('Payment failed: ' + (err.message || 'Unable to process payment. Please try again.'));
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
        <div className="container relative flex size-full min-h-screen flex-col bg-white justify-between max-w-lg mx-auto font-sans">
            <div>
                {/* Header */}
                <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-20">
                    <div 
                        className="text-[#171312] flex size-12 shrink-0 items-center cursor-pointer" 
                        onClick={handleClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                        </svg>
                    </div>
                    <h2 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                        Your Order
                    </h2>
                </div>

                {/* Service Mode & Table Banner */}
                <div className="p-4">
                    {isSelfService ? (
                        <div className="bg-[#f4f1f1] p-4 rounded-2xl flex items-center gap-3">
                            <div>
                                <span className="text-sm font-bold text-[#171312] uppercase tracking-wider block">
                                    Self-Service Hotel Mode
                                </span>
                                <span className="text-xs text-[#836c67] font-semibold mt-1 block">
                                    No table number required. You will collect your food using your unique Order Number.
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#f4f1f1] p-4 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-[#836c67] uppercase tracking-wider block">
                                    Table Assignment
                                </span>
                                <span className="text-sm font-black text-[#171312]">
                                    Table #{tableNumber}
                                </span>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                QR Verified
                            </span>










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
                <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-2">
                    Items
                </h3>

                {isEmpty ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm font-bold text-[#171312]">Your cart is currently empty.</p>
                        <p className="text-xs text-[#836c67] mt-1">Scan menu items to add them to your session.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-6 py-3 bg-[#f4f1f1] text-[#171312] rounded-full text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {items.map(item => {
                            const rawId = item.dish_id || item.id;
                            const isAvail = !unavailableItemIds.has(rawId);
                            return (
                                <CartItem
                                    key={item.id}
                                    {...item}
                                    isAvailable={isAvail}
                                    onIncrease={() => updateItemQuantity(item.id, item.quantity + 1)}
                                    onDecrease={() => updateItemQuantity(item.id, item.quantity - 1)}
                                    onRemove={() => removeItem(item.id)}
                                    onUpdateNotes={(newNote) => updateItem(item.id, { ...item, special_instruction: newNote, specialInstruction: newNote })}
                                />
                            );
                        })}
                    </div>
                )}

                {!isEmpty && (
                    <>
                        {/* Customer Details Form (Optional) */}
                        <div className="px-4 py-4 space-y-3 border-t border-[#f4f1f1] mt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em]">
                                    Guest Details
                                </h3>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Optional
                                </span>
                            </div>
                            <input
                                type="text"
                                placeholder="Your Name (Optional)"
                                value={customerName}
                                onChange={handleCustomerNameChange}
                                className="w-full px-4 py-3 bg-[#f4f1f1] border-none rounded-xl text-sm font-medium text-[#171312] outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-[#836c67]"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number (Optional)"
                                value={customerPhone}
                                onChange={handleCustomerPhoneChange}
                                className="w-full px-4 py-3 bg-[#f4f1f1] border-none rounded-xl text-sm font-medium text-[#171312] outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-[#836c67]"
                            />
                        </div>

                        {/* Payment Method Selector based on App Settings */}
                        <div className="px-4 py-4 space-y-3 border-t border-[#f4f1f1]">
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em]">
                                Payment Option
                            </h3>

                            {paymentModeSetting === 'ONLINE_ONLY' && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
                                    <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">Online Payment Only (Razorpay / UPI)</p>
                                        <p className="text-[11px] text-emerald-700">Pre-payment required by hotel policy.</p>
                                    </div>
                                </div>
                            )}

                            {paymentModeSetting === 'PAY_AT_COUNTER' && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900">
                                    <Store className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">Pay at Cash Counter / Shop</p>
                                        <p className="text-[11px] text-amber-700">Pay cash or card directly when receiving order.</p>
                                    </div>
                                </div>
                            )}

                            {paymentModeSetting === 'BOTH' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setPaymentMethod('online')}
                                        className={`cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 ${
                                            paymentMethod === 'online'
                                                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <CreditCard className="w-4 h-4 text-emerald-600" />
                                            {paymentMethod === 'online' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Pay Online</p>
                                            <p className="text-[10px] text-slate-500">Razorpay / UPI / Cards</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setPaymentMethod('cash_at_counter')}
                                        className={`cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 ${
                                            paymentMethod === 'cash_at_counter'
                                                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <Store className="w-4 h-4 text-amber-600" />
                                            {paymentMethod === 'cash_at_counter' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Pay at Counter</p>
                                            <p className="text-[10px] text-slate-500">Cash / Card at Shop</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                            Order Summary
                        </h3>
                        <div className="p-4">
                            <div className="flex justify-between gap-x-6 py-2">
                                <p className="text-[#836c67] text-sm font-normal leading-normal">Subtotal</p>
                                <p className="text-[#171312] text-sm font-normal leading-normal text-right">₹{cartTotal.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between gap-x-6 py-2">
                                <p className="text-[#836c67] text-sm font-normal leading-normal">Taxes & Fees</p>
                                <p className="text-[#171312] text-sm font-normal leading-normal text-right text-emerald-600">Included</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-[#f4f1f1]">
                            <div className="flex justify-between gap-x-6 py-2">
                                <p className="text-[#836c67] text-sm font-normal leading-normal">Total</p>
                                <p className="text-[#171312] text-sm font-bold leading-normal text-right">₹{cartTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div className="h-5 bg-white pb-24"></div>
                    </>
                )}
            </div>

            {/* Sticky Checkout Button */}
            {!isEmpty && (
                <div className="fixed bottom-0 left-0 right-0 bg-white sm:relative z-30">
                    <div className="flex px-4 py-3 max-w-lg mx-auto w-full">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || settings?.is_closed || hasUnavailableItems}
                            className={`flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] transition-transform ${settings?.is_closed || hasUnavailableItems ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-[#edc3ba] text-[#171312] active:scale-[0.99] hover:bg-[#e4b5ab]'} disabled:opacity-50`}
                        >
                            <span className="truncate">
                                {settings?.is_closed
                                    ? 'Shop is Closed'
                                    : hasUnavailableItems
                                        ? 'Remove Out-of-Stock Items to Checkout'
                                        : isSubmitting
                                            ? 'Processing...'
                                            : 'Checkout'}
                            </span>
                        </button>
                    </div>
                    <div className="h-5 bg-white sm:hidden"></div>
                </div>
            )}
        </div>
    );
}