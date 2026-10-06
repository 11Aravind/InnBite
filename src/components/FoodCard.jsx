import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import ImageWithSkeleton from './ImageWithSkeleton';
import { showAddToCartToast } from '../utils/toastUtils';
import { Leaf, Plus, Minus } from 'lucide-react';

export default function FoodCard({
    id,
    image,
    name,
    price,
    description,
    isAvailable = true,
    isPopular = false,
    isSpecial = false,
    isVeg = true,
    className = ''
}) {
    const navigate = useNavigate();
    const { addItem, updateItemQuantity, removeItem, getItem } = useCart();

    const cartItem = getItem(id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleIncrease = (e) => {
        e.stopPropagation();
        if (!isAvailable) return;
        if (cartItem) {
            updateItemQuantity(id, quantity + 1);
        } else {
            addItem({
                id,
                name,
                price: Number(price || 0),
                image: image || '/placeholderfood.png',
                description
            }, 1);
            showAddToCartToast(name, navigate);
        }
    };

    const handleDecrease = (e) => {
        e.stopPropagation();
        if (!isAvailable) return;
        if (quantity > 1) {
            updateItemQuantity(id, quantity - 1);
        } else if (quantity === 1) {
            removeItem(id);
        }
    };

    const toggleFavorite = (e) => {
        e.stopPropagation();
        setIsFavorite(prev => !prev);
    };

    const formattedPrice = typeof price === 'number' ? price.toFixed(2) : Number(price || 0).toFixed(2);

    return (
        <div
            className={`bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md rounded-3xl p-3 sm:p-3.5 flex gap-3.5 items-center transition-all duration-200 group cursor-pointer ${!isAvailable ? 'opacity-75' : ''} ${className}`}
            onClick={() => navigate(`/FoodDetails/${id}`)}
        >
            {/* Left Food Image Container */}
            <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                <ImageWithSkeleton
                    src={image}
                    alt={name}
                    aspectRatio="aspect-square"
                    className={`w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                />

                {/* Top-Left Compact Special Badge (Theme Emerald - Single line) */}
                {isSpecial && (
                    <span className="absolute top-1.5 left-1.5 bg-[#114536]/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                        Chef's Special
                    </span>
                )}

                {!isAvailable && (
                    <span className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider text-center p-1 rounded-2xl">
                        Out of Stock
                    </span>
                )}
            </div>

            {/* Right Details Container */}
            <div className="flex flex-1 flex-col justify-between self-stretch py-0.5 min-w-0">
                <div className="space-y-0.5">
                    {/* Header: Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-slate-900 text-sm font-extrabold leading-snug line-clamp-2 flex-1">
                            {name}
                        </h3>
                        <span className="text-slate-900 text-base font-black shrink-0 ml-1">
                            ₹{formattedPrice}
                        </span>
                    </div>

                    {/* Description */}
                    {description && (
                        <p className="text-slate-400 text-[11px] font-normal leading-normal line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>

                {/* Bottom Row: Badges (NO STAR ICON) + Quantity Stepper */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {isVeg !== false ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Vegetarian</span>
                            </span>
                        ) : (
                            <span className="bg-rose-50 text-rose-800 border border-rose-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                                <span>Non-Veg</span>
                            </span>
                        )}

                        {isPopular && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Popular
                            </span>
                        )}
                    </div>

                    {/* Quantity Stepper (Theme Emerald Primary + Button - NO ORANGE) */}
                    <div
                        className="bg-slate-50 border border-slate-200/80 rounded-full p-1 flex items-center gap-2 shadow-2xs ml-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="w-6 h-6 rounded-full bg-slate-200/70 hover:bg-slate-300 active:scale-90 transition-all flex items-center justify-center font-bold text-xs text-slate-800 disabled:opacity-40 cursor-pointer"
                            onClick={handleDecrease}
                            disabled={quantity === 0 || !isAvailable}
                        >
                            <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-slate-900 w-3 text-center select-none">
                            {quantity}
                        </span>

                        <button
                            type="button"
                            className="w-6 h-6 rounded-full bg-[#114536] hover:bg-[#0c382b] text-white active:scale-95 transition-all flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                            onClick={handleIncrease}
                            disabled={!isAvailable}
                        >
                            <Plus className="w-3 h-3 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}