import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import CartItem from '../components/CartItem';
import { apiService } from '../utils/apiService';
import { openRazorpayCheckout } from '../utils/razorpay';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import { ChefHat, Check, Clock, CreditCard, Sparkles, Utensils, Printer } from 'lucide-react';

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

    const [tableNumber, setTableNumber] = useState(() => {
        return localStorage.getItem('orderly_table_number') || '1';
    });

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const paymentMethod = 'razorpay'; // Online payment only
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(null);

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

        setIsSubmitting(true);

        const orderPayload = {
            table_number: tableNumber,
            customer_name: customerName || 'Guest',
            customer_phone: customerPhone || '',
            total_amount: cartTotal,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'razorpay' ? 'paid' : 'pending',
            items: items.map(item => ({
                id: item.id,
                dish_id: item.dish_id || item.id,
                name: item.name,
                price: item.price,
                portion: item.portion || 'Regular',
                quantity: item.quantity
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
                        payment_status: 'paid',
                        razorpay_payment_id: razorpayResponse.razorpay_payment_id
                    };
                    const res = await apiService.createOrder(finalPayload);
                    setIsSubmitting(false);
                    if (res.success) {
                        handleSaveOrderState(res.order);
                        emptyCart();
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
                            payment_status: 'paid',
                            razorpay_payment_id: 'pay_demo_' + Date.now()
                        };
                        const res = await apiService.createOrder(demoPayload);
                        setIsSubmitting(false);
                        if (res.success) {
                            handleSaveOrderState(res.order);
                            emptyCart();
                        }
                    }
                }
            });
        } catch (err) {
            setIsSubmitting(false);
            alert('Razorpay Checkout error: ' + (err.message || 'Unknown error'));
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
        <div className="container relative flex size-full min-h-screen flex-col bg-white justify-between group/design-root overflow-x-hidden"
            style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}>
            <div>
                {/* Header */}
                <div className="flex items-center bg-white p-4 pb-2 justify-between border-b border-gray-100">
                    <div className="text-[#171312] flex size-12 shrink-0 items-center cursor-pointer"
                        onClick={handleClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                            viewBox="0 0 256 256">
                            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                        </svg>
                    </div>
                    <h2 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                        Your Order
                    </h2>
                </div>

                {/* Table Banner / Input */}
                <div className="bg-[#fdf8f6] p-4 border-b border-[#f4e8e5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <div>
                            <span className="text-xs text-[#836c67] block font-medium">Table Assignment</span>
                            <span className="text-base font-bold text-[#171312]">Table #{tableNumber}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-[#edc3ba]">
                        <label className="text-xs text-gray-500 font-semibold">Table No:</label>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            value={tableNumber}
                            onChange={handleTableChange}
                            className="w-12 text-center text-sm font-bold outline-none bg-transparent"
                        />
                    </div>
                </div>

                <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                    Items
                </h3>

                {isEmpty ? (
                    <div className="px-4 py-12 text-center text-[#836c67]">
                        <span className="text-4xl block mb-2">🛒</span>
                        <p className="text-base font-medium">Your cart is empty.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 px-6 py-2 bg-[#f4f1f1] text-[#171312] rounded-full text-sm font-bold"
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

                {!isEmpty && (
                    <>
                        {/* Customer Info Form */}
                        <div className="px-4 py-4 border-t border-[#f4f1f1]">
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] mb-3">
                                Customer Details (Optional)
                            </h3>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Your Name (e.g. John)"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full h-11 bg-[#f4f1f1] px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number (for order SMS)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full h-11 bg-[#f4f1f1] px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white px-4 py-4 border-t border-[#f4f1f1] mb-24">
                            <h3 className="text-[#171312] text-lg font-bold leading-tight tracking-[-0.015em] mb-3">
                                Order Summary
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#836c67]">Subtotal</span>
                                    <span className="text-[#171312] font-medium">₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[#f4f1f1]">
                                    <span className="text-[#171312] text-base font-bold">Total Amount</span>
                                    <span className="text-[#171312] text-lg font-bold">₹{cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sticky Order Button */}
            {!isEmpty && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20">
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#171312] text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-colors shadow-lg"
                    >
                        {isSubmitting ? (
                            <span>Processing Order...</span>
                        ) : (
                            <span>
                                Pay Online & Confirm · ₹{cartTotal.toFixed(2)}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
