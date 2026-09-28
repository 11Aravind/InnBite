import React from 'react';
import QuantityControl from './QuantityControl';
import { Sparkles, MessageSquare } from 'lucide-react';

const CartItem = ({
    image,
    name,
    price,
    portion,
    quantity,
    customizations,
    special_instruction,
    specialInstruction,
    onIncrease,
    onDecrease,
    onRemove
}) => {
    const activeInstructions = special_instruction || specialInstruction || '';
    const customEntries = Object.entries(customizations || {});

    return (
        <div className="flex gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm justify-between items-center mb-3">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl w-16 h-16 shrink-0 border border-slate-100"
                    style={{
                        backgroundImage: `url("${image || '/placeholderfood.png'}")`
                    }}
                />
                <div className="flex flex-1 flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-slate-900 text-sm font-extrabold truncate">
                            {name}
                        </p>
                    </div>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">
                        ₹{price} <span className="text-slate-300">•</span> {portion}
                    </p>

                    {/* Customizations tags */}
                    {customEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {customEntries.map(([k, v]) => (
                                <span
                                    key={k}
                                    className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60"
                                >
                                    {v === 'No' ? `No ${k}` : `${k}: ${v}`}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Special instruction text */}
                    {activeInstructions && (
                        <p className="text-[11px] text-indigo-700 italic mt-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">"{activeInstructions}"</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
                <QuantityControl
                    quantity={quantity}
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                />
                <button
                    onClick={onRemove}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 transition-colors"
                >
                    Remove
                </button>
            </div>
        </div>
    );
};

export default CartItem;