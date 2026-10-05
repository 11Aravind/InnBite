import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import ImageWithSkeleton from './ImageWithSkeleton';
import { showAddToCartToast } from '../utils/toastUtils';

export default function FoodCard({ id, image, name, price, description, isAvailable = true, className = '' }) {
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

    const formattedPrice = typeof price === 'number' ? price.toFixed(2) : Number(price || 0).toFixed(2);

    return (
        <div
            className={`bg-white border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 items-center justify-between hover:shadow-md transition-all duration-200 group cursor-pointer ${!isAvailable ? 'opacity-75' : ''} ${className}`}
            onClick={() => navigate(`/FoodDetails/${id}`)}
        >
            {/* Left Food Image */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-2xl bg-slate-50 shadow-2xs border border-slate-100">
                <ImageWithSkeleton
                    src={image}
                    alt={name}
                    aspectRatio="aspect-square"
                    className={`w-full h-full object-cover rounded-2xl ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                />
                {!isAvailable && (
                    <span className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider text-center p-1 rounded-2xl">
                        Out of Stock
                    </span>
                )}
            </div>

            {/* Right Details Container */}
            <div className="flex flex-1 flex-col justify-between self-stretch py-0.5 min-w-0">
                <div>
                    {/* Top Row: Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[#171212] text-base sm:text-lg font-bold leading-tight line-clamp-2 flex-1">
                            {name}
                        </h3>
                        <span className="text-[#171212] text-base sm:text-lg font-bold shrink-0 ml-1">
                            ₹{formattedPrice}
                        </span>
                    </div>

                    {/* Description */}
                    {description && (
                        <p className="text-[#6e6b6a] text-xs sm:text-sm font-normal leading-snug mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>

                {/* Bottom Row: Quantity Control Pill */}
                <div className="mt-2 flex items-center justify-end">
                    <div
                        className="bg-slate-50 border border-slate-200/80 rounded-full px-2.5 py-1 flex items-center gap-3 shadow-2xs text-[#171212]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all flex items-center justify-center font-bold text-sm text-[#171212] disabled:opacity-40 cursor-pointer shadow-2xs"
                            onClick={handleDecrease}
                            disabled={quantity === 0 || !isAvailable}
                        >
                            -
                        </button>
                        <span className="text-sm font-bold w-4 text-center select-none">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all flex items-center justify-center font-bold text-sm text-[#171212] disabled:opacity-40 cursor-pointer shadow-2xs"
                            onClick={handleIncrease}
                            disabled={!isAvailable}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}