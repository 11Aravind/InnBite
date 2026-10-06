import React from 'react';
import { toast } from 'react-hot-toast';
import { Check, ChevronRight, X } from 'lucide-react';

export const showAddToCartToast = (itemName, navigate) => {
    // Dismiss existing cart toast to avoid stacking
    toast.dismiss('cart-toast');

    const toastId = toast.custom(
        (t) => (
            <div
                className={`${
                    t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } max-w-md w-[calc(100vw-32px)] sm:w-auto bg-[#114536] text-white shadow-xl rounded-2xl pointer-events-auto flex items-center justify-between px-3.5 py-3 border border-[#195947] gap-2.5 z-50 transition-all duration-300`}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold truncate text-white">
                        {itemName ? `${itemName}` : 'Item added to cart'}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (navigate) navigate('/cart');
                        }}
                        className="bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-white/20 cursor-pointer"
                    >
                        View Cart
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ),
        {
            position: 'bottom-center',
            duration: 3000,
            id: 'cart-toast'
        }
    );

    // Fail-safe auto dismiss after 3 seconds
    setTimeout(() => {
        toast.dismiss('cart-toast');
        toast.dismiss(toastId);
    }, 3000);
};
