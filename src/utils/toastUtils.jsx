import React from 'react';
import { toast } from 'react-hot-toast';
import { Check, ChevronRight } from 'lucide-react';

export const showAddToCartToast = (itemName, navigate) => {
    toast.custom(
        (t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-[calc(100vw-32px)] sm:w-auto bg-[#114536] text-white shadow-xl rounded-2xl pointer-events-auto flex items-center justify-between px-4 py-3 border border-[#195947] gap-3 z-50 transition-all duration-300`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold truncate text-white">
                        {itemName ? `${itemName} added to cart` : 'Item added to cart'}
                    </span>
                </div>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        if (navigate) navigate('/cart');
                    }}
                    className="shrink-0 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-white/20 cursor-pointer"
                >
                    View Cart
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        ),
        {
            position: 'bottom-center',
            duration: 3000,
            id: 'cart-toast'
        }
    );
};
