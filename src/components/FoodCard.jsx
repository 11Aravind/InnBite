import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import ImageWithSkeleton from './ImageWithSkeleton';
import VegNonVegSymbol from './VegNonVegSymbol';
import DishPreviewModal from './DishPreviewModal';
import { showAddToCartToast } from '../utils/toastUtils';
import { Plus, Minus } from 'lucide-react';

export default function FoodCard({
    id,
    image,
    images,
    name,
    price,
    basePrice,
    base_price,
    description,
    preparation,
    isAvailable = true,
    isPopular = false,
    isSpecial = false,
    isVeg = true,
    portions,
    className = ''
}) {
    const navigate = useNavigate();
    const { addItem, updateItemQuantity, removeItem, getItem } = useCart();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const cartItem = getItem(id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const displayImage = (images && images.length > 0) ? images[0] : (image || '/placeholderfood.png');
    const rawPrice = Number(basePrice || base_price || price || 0);
    const formattedPrice = rawPrice.toFixed(2);

    const hasPortions = portions && portions.length > 1;

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (!isAvailable) return;
        if (hasPortions) {
            setIsPreviewOpen(true);
        } else {
            if (cartItem) {
                updateItemQuantity(id, quantity + 1);
            } else {
                addItem({
                    id,
                    name,
                    price: rawPrice,
                    image: displayImage,
                    description
                }, 1);
                showAddToCartToast(name, navigate);
            }
        }
    };

    const handleIncrease = (e) => {
        e.stopPropagation();
        if (!isAvailable) return;
        if (hasPortions) {
            setIsPreviewOpen(true);
        } else if (cartItem) {
            updateItemQuantity(id, quantity + 1);
        } else {
            addItem({
                id,
                name,
                price: rawPrice,
                image: displayImage,
                description
            }, 1);
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

    const handleOpenPreview = (e) => {
        e.stopPropagation();
        setIsPreviewOpen(true);
    };

    return (
        <>
            <div
                className={`bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md rounded-3xl p-3.5 flex gap-4 items-start justify-between transition-all duration-200 group cursor-pointer relative ${!isAvailable ? 'opacity-75' : ''} ${className}`}
                onClick={handleOpenPreview}
            >
                {/* Left Side: Details Column */}
                <div className="flex flex-col justify-between flex-1 min-w-0 pr-1 self-stretch">
                    <div className="space-y-1">
                        {/* Top Indicator & Bestseller Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <VegNonVegSymbol isVeg={isVeg} size="sm" />
                            {(isPopular || isSpecial) && (
                                <span className="text-rose-600 font-extrabold text-[11px] tracking-tight flex items-center gap-0.5">
                                    <span className="text-rose-500">🌟</span>
                                    <span>{isSpecial ? "Chef's Special" : "Bestseller"}</span>
                                </span>
                            )}
                        </div>

                        {/* Dish Name */}
                        <h3 className="text-slate-900 text-base font-extrabold leading-snug line-clamp-2 group-hover:text-[#114536] transition-colors">
                            {name}
                        </h3>

                        {/* Price */}
                        <div className="text-slate-900 text-sm font-black tracking-tight">
                            ₹{formattedPrice}
                        </div>

                        {/* Short Description + Clickable "... more" */}
                        {description && (
                            <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2 mt-1">
                                {description}{' '}
                                <button
                                    type="button"
                                    onClick={handleOpenPreview}
                                    className="text-slate-900 font-bold hover:underline ml-0.5 inline-block cursor-pointer"
                                >
                                    more
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side: Image & Overlaid ADD Button (Swiggy / Zomato style) */}
                <div className="relative w-32 sm:w-36 h-32 sm:h-36 shrink-0 flex flex-col items-center">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xs relative">
                        <ImageWithSkeleton
                            src={displayImage}
                            alt={name}
                            aspectRatio="aspect-square"
                            className={`w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                        />

                        {!isAvailable && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider text-center p-1 rounded-2xl">
                                Out of Stock
                            </div>
                        )}
                    </div>

                    {/* Overlaid ADD Button / Quantity Control Pill */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                        {quantity > 0 ? (
                            <div
                                className="bg-white border border-slate-200/90 rounded-xl px-2 py-1 flex items-center gap-2 shadow-md text-[#114536]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={handleDecrease}
                                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all flex items-center justify-center font-bold text-slate-800"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>

                                <span className="text-xs font-extrabold text-[#114536] w-4 text-center select-none">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleIncrease}
                                    className="w-6 h-6 rounded-lg bg-[#114536] text-white hover:bg-[#0c382b] active:scale-95 transition-all flex items-center justify-center font-bold shadow-xs"
                                >
                                    <Plus className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!isAvailable}
                                onClick={handleAddClick}
                                className="bg-white hover:bg-emerald-50/60 border border-slate-200/90 text-[#114536] font-extrabold text-xs px-5 py-1.5 rounded-xl shadow-md uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                                ADD
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Dish Preview & Portion Selection Popup Modal */}
            {isPreviewOpen && (
                <DishPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    dish={{
                        id,
                        name,
                        image,
                        images,
                        price,
                        basePrice,
                        base_price,
                        description,
                        preparation,
                        isAvailable,
                        isPopular,
                        isSpecial,
                        isVeg,
                        portions
                    }}
                />
            )}
        </>
    );
}