import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QuantityControl = ({ quantity, onIncrease, onDecrease, disabled = false, className = '' }) => {
    return (
        <div className={`shrink-0 ${className}`}>
            <div className="bg-white border border-slate-200/90 rounded-2xl px-2 py-1 flex items-center gap-2 shadow-sm text-[#114536]">
                <button
                    type="button"
                    disabled={disabled}
                    className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all flex items-center justify-center font-bold text-slate-800 disabled:opacity-50 cursor-pointer select-none"
                    onClick={onDecrease}
                    aria-label="Decrease quantity"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="text-sm font-extrabold text-[#114536] w-5 text-center select-none">
                    {quantity}
                </span>

                <button
                    type="button"
                    disabled={disabled}
                    className="w-7 h-7 rounded-xl bg-[#114536] text-white hover:bg-[#0c382b] active:scale-95 transition-all flex items-center justify-center font-bold shadow-xs disabled:opacity-50 cursor-pointer select-none"
                    onClick={onIncrease}
                    aria-label="Increase quantity"
                >
                    <Plus className="w-3.5 h-3.5 text-white" />
                </button>
            </div>
        </div>
    );
};

export default QuantityControl;