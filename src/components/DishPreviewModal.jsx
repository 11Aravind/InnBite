import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import VegNonVegSymbol from './VegNonVegSymbol';
import ImageWithSkeleton from './ImageWithSkeleton';
import { showAddToCartToast } from '../utils/toastUtils';
import { X, Star, Plus, Minus, ChevronRight, Utensils, Check } from 'lucide-react';

export default function DishPreviewModal({
    isOpen,
    onClose,
    dish
}) {
    const navigate = useNavigate();
    const { addItem, updateItemQuantity, removeItem, items } = useCart();

    if (!isOpen || !dish) return null;

    const {
        id,
        name,
        image,
        images,
        price: basePriceRaw,
        basePrice,
        base_price,
        description,
        preparation,
        preparation_details,
        isAvailable = true,
        isPopular = false,
        isSpecial = false,
        isVeg = true,
        portions: dishPortions
    } = dish;

    const displayImage = (images && images.length > 0) ? images[0] : (image || '/placeholderfood.png');
    const rawPrice = Number(basePrice || base_price || basePriceRaw || 0);

    // Portions configuration
    const portions = (dishPortions && dishPortions.length > 0)
        ? dishPortions
        : [{ value: 'regular', label: 'Regular', price: rawPrice }];

    const [selectedPortion, setSelectedPortion] = useState(portions[0]?.value || 'regular');

    const portionObj = portions.find(p => p.value === selectedPortion) || portions[0];
    const portionLabel = portionObj?.label || 'Regular';
    const activePrice = portionObj?.price !== undefined && portionObj?.price !== 0
        ? Number(portionObj.price)
        : rawPrice;

    // Unique cart item identifier incorporating portion
    const cartItemId = `${id}-${selectedPortion || 'reg'}`;

    // Check if item is in cart
    const existingItem = (items || []).find(item => item.id === cartItemId || item.id === id);
    const quantity = existingItem ? existingItem.quantity : 0;

    const handleAddToCart = () => {
        if (!isAvailable) return;
        if (existingItem) {
            updateItemQuantity(existingItem.id, quantity + 1);
        } else {
            addItem({
                id: cartItemId,
                dish_id: id,
                name: `${name} (${portionLabel})`,
                price: activePrice,
                portion: portionLabel,
                image: displayImage,
                description
            }, 1);
            showAddToCartToast(`${name} (${portionLabel})`, navigate);
        }
    };

    const handleDecrease = () => {
        if (!isAvailable || !existingItem) return;
        if (quantity > 1) {
            updateItemQuantity(existingItem.id, quantity - 1);
        } else {
            removeItem(existingItem.id);
        }
    };

    const handleViewFullDetails = () => {
        onClose();
        navigate(`/FoodDetails/${id}`);
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-900 relative">
                
                {/* Header Dish Image Banner */}
                <div className="relative w-full h-56 sm:h-64 bg-slate-950 shrink-0 overflow-hidden">
                    <ImageWithSkeleton
                        src={displayImage}
                        alt={name}
                        aspectRatio="aspect-video"
                        className="w-full h-full object-cover"
                    />

                    {/* Floating Close Button Overlay (Image 2 style X) */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-slate-900/75 hover:bg-slate-900 text-white rounded-full transition-transform active:scale-90 shadow-md backdrop-blur-xs border border-white/20"
                        title="Close Modal"
                    >
                        <X className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {!isAvailable && (
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex items-center justify-center text-white font-extrabold text-sm uppercase tracking-wider">
                            Currently Out of Stock
                        </div>
                    )}
                </div>

                {/* Content Details Body */}
                <div className="p-5 sm:p-6 space-y-4 flex-1">
                    
                    {/* Header Row: Symbol & Badges */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <VegNonVegSymbol isVeg={isVeg} size="md" />
                            {(isPopular || isSpecial) && (
                                <span className="text-amber-700 text-xs font-black flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>{isSpecial ? "Chef's Special" : "Bestseller"}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dish Title & Price */}
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                            {name}
                        </h2>
                        <div className="text-lg font-black text-[#114536] mt-1">
                            ₹{activePrice.toFixed(2)}
                        </div>
                    </div>

                    {/* Description & Preparation */}
                    {description && (
                        <p className="text-slate-600 text-xs leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            {description}
                        </p>
                    )}

                    {preparation && (
                        <div className="text-[11px] text-slate-500 font-semibold flex items-start gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-[#114536] shrink-0 mt-0.5" />
                            <span>{preparation || preparation_details}</span>
                        </div>
                    )}

                    {/* Portion Selection Options (Chips/Cards) */}
                    {portions.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Select Portion Size
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {portions.map((p) => {
                                    const pPrice = p.price !== undefined && p.price !== 0 ? Number(p.price) : rawPrice;
                                    const isSelected = selectedPortion === p.value;
                                    return (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setSelectedPortion(p.value)}
                                            className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${isSelected ? 'border-[#114536] bg-emerald-50/60 ring-2 ring-[#114536]/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className={`text-xs font-extrabold ${isSelected ? 'text-[#114536]' : 'text-slate-800'}`}>
                                                    {p.label || p.value}
                                                </span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-[#114536] stroke-[3]" />}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-500 mt-1">
                                                ₹{pPrice.toFixed(2)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Quantity Stepper / ADD Button */}
                        {quantity > 0 ? (
                            <div className="flex-1 h-12 bg-[#114536] text-white rounded-2xl flex items-center justify-between px-4 shadow-md">
                                <button
                                    type="button"
                                    onClick={handleDecrease}
                                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold active:scale-90 transition-all"
                                >
                                    <Minus className="w-4 h-4 text-white" />
                                </button>
                                <span className="font-extrabold text-sm select-none">
                                    {quantity} in Cart
                                </span>
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold active:scale-90 transition-all"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!isAvailable}
                                onClick={handleAddToCart}
                                className="flex-1 h-12 bg-[#114536] hover:bg-[#0c382b] text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>ADD TO CART • ₹{activePrice.toFixed(2)}</span>
                            </button>
                        )}
                    </div>

                    {/* View Full Details Page Option */}
                    <button
                        type="button"
                        onClick={handleViewFullDetails}
                        className="text-xs font-bold text-[#114536] hover:text-[#0c382b] py-1 flex items-center justify-center gap-1 transition-colors group cursor-pointer"
                    >
                        <span>View Full Dish Details & Ingredients</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
