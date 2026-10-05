import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';
import { useSettings } from '../../context/SettingsContext';
import { printThermalReceipt } from '../../utils/printReceipt';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Printer,
    CheckCircle2,
    Utensils,
    CreditCard,
    DollarSign,
    QrCode,
    Receipt,
    User,
    Phone,
    RefreshCw,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPOS() {
    const { settings } = useSettings();
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // POS Order State
    const [orderType, setOrderType] = useState('COUNTER'); // 'COUNTER' or 'TABLE'
    const [selectedTable, setSelectedTable] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [cart, setCart] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [taxPercent, setTaxPercent] = useState(5); // 5% default GST
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'upi', 'card'
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dishesRes, categoriesRes, tablesRes] = await Promise.all([
                apiService.getDishes(),
                apiService.getCategories(),
                apiService.getTables()
            ]);
            setDishes(dishesRes || []);
            setCategories(categoriesRes || []);
            setTables(tablesRes || []);
        } catch (err) {
            console.error('Error loading POS data:', err);
            toast.error('Failed to load menu data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (dish) => {
        if (dish.is_available === false) {
            toast.error(`${dish.name} is currently out of stock`);
            return;
        }

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.id === dish.id);
            if (existingIndex > -1) {
                const updated = [...prevCart];
                updated[existingIndex].quantity += 1;
                return updated;
            } else {
                return [
                    ...prevCart,
                    {
                        id: dish.id,
                        name: dish.name,
                        dish_name: dish.name,
                        price: Number(dish.base_price || dish.price || 0),
                        unit_price: Number(dish.base_price || dish.price || 0),
                        quantity: 1,
                        image: dish.images?.[0] || dish.image_url || '',
                        note: ''
                    }
                ];
            }
        });
    };

    const updateQuantity = (dishId, delta) => {
        setCart(prev =>
            prev
                .map(item => {
                    if (item.id === dishId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const updateItemNote = (dishId, note) => {
        setCart(prev =>
            prev.map(item => (item.id === dishId ? { ...item, note } : item))
        );
    };

    const removeItem = (dishId) => {
        setCart(prev => prev.filter(item => item.id !== dishId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscountAmount(0);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedTable('');
    };

    // Calculation math
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = Math.min(Number(discountAmount) || 0, subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = (taxableAmount * (Number(taxPercent) || 0)) / 100;
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    const handleCreateOrder = async (shouldPrint = false) => {
        if (cart.length === 0) {
            toast.error('Please add at least one item to the order');
            return;
        }

        if (orderType === 'TABLE' && !selectedTable) {
            toast.error('Please select a table number');
            return;
        }

        setIsSubmitting(true);
        try {
            const tableObj = tables.find(t => String(t.table_number) === String(selectedTable));

            const orderPayload = {
                table_id: orderType === 'TABLE' ? tableObj?.id || null : null,
                table_number: orderType === 'TABLE' ? selectedTable : null,
                service_mode: orderType === 'TABLE' ? 'TABLE_SERVICE' : 'SELF_SERVICE',
                customer_name: customerName || (orderType === 'TABLE' ? `Table ${selectedTable} Guest` : 'Counter Customer'),
                customer_phone: customerPhone || '',
                status: 'CONFIRMED',
                payment_status: 'SUCCESS',
                payment_method: paymentMethod,
                subtotal: subtotal,
                discount: discount,
                tax_amount: taxAmount,
                total_amount: grandTotal,
                items: cart.map(item => ({
                    dish_id: item.id,
                    dish_name: item.name,
                    quantity: item.quantity,
                    unit_price_snapshot: item.price,
                    special_instruction: item.note || ''
                }))
            };

            const createdOrder = await apiService.saveOrder(orderPayload);
            toast.success(`POS Order #${createdOrder.order_number || createdOrder.id || ''} created successfully!`);

            if (shouldPrint) {
                printThermalReceipt(createdOrder || { ...orderPayload, id: Date.now() }, settings);
            }

            clearCart();
        } catch (err) {
            console.error('POS order error:', err);
            toast.error(err.message || 'Failed to create POS order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDishes = dishes.filter(d => {
        const matchesCat = selectedCategory === 'ALL' || String(d.category_id) === String(selectedCategory);
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="space-y-4 text-slate-900 font-sans">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        POS Express Billing <Receipt className="w-6 h-6 text-emerald-600" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Quick counter billing, instant order creation & 80mm thermal receipt printing</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Menu</span>
                    </button>
                </div>
            </div>

            {/* Main Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Side: Category Tabs & Dish Grid (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Search & Category Filter Bar */}
                    <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search dishes by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <button
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === 'ALL' ? 'bg-[#114536] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                All Items ({dishes.length})
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat.id ? 'bg-[#114536] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dish Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 6, 7].map(i => (
                                <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredDishes.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-bold">
                            No dishes found matching search
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                            {filteredDishes.map(dish => {
                                const price = Number(dish.base_price || dish.price || 0);
                                const isAvailable = dish.is_available !== false;
                                const imgUrl = dish.images?.[0] || dish.image_url || '/placeholder-food.png';

                                return (
                                    <div
                                        key={dish.id}
                                        onClick={() => isAvailable && handleAddToCart(dish)}
                                        className={`group relative bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 ${isAvailable ? 'hover:border-emerald-600 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="space-y-2">
                                            <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 relative">
                                                <img
                                                    src={imgUrl}
                                                    alt={dish.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {!isAvailable && (
                                                    <span className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[10px] font-black text-white uppercase">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-xs line-clamp-1">{dish.name}</h3>
                                                <span className="text-[11px] font-black text-emerald-700">₹{price.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            disabled={!isAvailable}
                                            className="mt-2 w-full py-1.5 bg-slate-100 group-hover:bg-[#114536] group-hover:text-white text-slate-800 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Side: Order Cart & POS Billing Summary (5 Cols) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                            Current Order <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
                        </h2>

                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Order Details & Customer Header Inputs */}
                    <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {/* Order Type Toggle */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => setOrderType('COUNTER')}
                                className={`py-2 rounded-xl font-bold border transition-all ${orderType === 'COUNTER' ? 'bg-[#114536] text-white border-[#114536] shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                            >
                                Counter / Takeaway
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrderType('TABLE')}
                                className={`py-2 rounded-xl font-bold border transition-all ${orderType === 'TABLE' ? 'bg-[#114536] text-white border-[#114536] shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                            >
                                Table Order
                            </button>
                        </div>

                        {orderType === 'TABLE' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Table #</label>
                                <select
                                    value={selectedTable}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-900"
                                >
                                    <option value="">Select Table Number...</option>
                                    {tables.map(t => (
                                        <option key={t.id} value={t.table_number}>Table #{t.table_number}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Customer Name</label>
                                <input
                                    type="text"
                                    placeholder="Guest Name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                        {cart.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 rounded-2xl">
                                Click on menu items to add to order
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                                        <span className="font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <input
                                            type="text"
                                            placeholder="Item note (e.g. Less spicy)..."
                                            value={item.note || ''}
                                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                                            className="w-1/2 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] text-slate-700 outline-none"
                                        />

                                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md font-bold"
                                            >
                                                <Minus className="w-3 h-3 text-slate-700" />
                                            </button>
                                            <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md font-bold"
                                            >
                                                <Plus className="w-3 h-3 text-slate-700" />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="w-5 h-5 flex items-center justify-center text-rose-500 hover:text-rose-700 ml-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Calculation Breakdown & Payment Options */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex justify-between font-medium text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-600 font-medium">Discount (₹)</span>
                            <input
                                type="number"
                                min="0"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold outline-none text-xs"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-600 font-medium">GST / Tax (%)</span>
                            <input
                                type="number"
                                min="0"
                                value={taxPercent}
                                onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold outline-none text-xs"
                            />
                        </div>

                        <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-slate-900">
                            <span>Grand Total</span>
                            <span className="font-mono text-emerald-700 text-base">₹{grandTotal.toFixed(2)}</span>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="pt-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payment Method</label>
                            <div className="grid grid-cols-3 gap-1.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`py-1.5 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'cash' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Cash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`py-1.5 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'upi' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    UPI / QR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`py-1.5 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'card' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Card
                                </button>
                            </div>
                        </div>

                        {/* Order Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-3">
                            <button
                                disabled={isSubmitting || cart.length === 0}
                                onClick={() => handleCreateOrder(false)}
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Save Order
                            </button>

                            <button
                                disabled={isSubmitting || cart.length === 0}
                                onClick={() => handleCreateOrder(true)}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                Pay & Print 🖨️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
