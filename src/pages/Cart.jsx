import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import CartItem from '../components/CartItem';
import { apiService } from '../utils/apiService';
import { getOrCreateCustomerSession } from '../utils/session';
import { openRazorpayCheckout } from '../utils/razorpay';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import { ChefHat, Check, Clock, CreditCard, Sparkles, Utensils, AlertCircle } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';

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
        return session.table_number || secureStorage.getItem('orderly_table_number') || '1';
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
        secureStorage.setItem('orderly_table_number', val);
    };

    const handleSaveOrderState = (orderData) => {
        setOrderPlaced(orderData);
        try {
            secureStorage.setItem('orderly_active_order', orderData);
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
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                <label className="text-xs text-[#836c67] font-bold">No:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={tableNumber}
                                    onChange={handleTableChange}
                                    className="w-10 text-center text-xs font-extrabold outline-none bg-transparent text-[#171312] p-0 border-none focus:ring-0"
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
                        {items.map(item => (
                            <CartItem
                                key={item.id}
                                {...item}
                                onIncrease={() => updateItemQuantity(item.id, item.quantity + 1)}
                                onDecrease={() => updateItemQuantity(item.id, item.quantity - 1)}
                                onRemove={() => removeItem(item.id)}
                            />
                        ))}
                    </div>
                )}

                {!isEmpty && (
                    <>
                        {/* Customer Details Form */}
                        <div className="px-4 py-4 space-y-3 border-t border-[#f4f1f1] mt-4">
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em]">
                                Guest Details
                            </h3>
                            <input
                                type="text"
                                placeholder="Your Name (e.g. John)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f4f1f1] border-none rounded-xl text-sm font-medium text-[#171312] outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-[#836c67]"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f4f1f1] border-none rounded-xl text-sm font-medium text-[#171312] outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-[#836c67]"
                            />
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
                            disabled={isSubmitting}
                            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#edc3ba] text-[#171312] text-base font-bold leading-normal tracking-[0.015em] transition-transform active:scale-[0.99] disabled:opacity-50"
                        >
                            <span className="truncate">
                                {isSubmitting ? 'Processing...' : 'Checkout'}
                            </span>
                        </button>
                    </div>
                    <div className="h-5 bg-white sm:hidden"></div>
                </div>
            )}
        </div>
    );
}
