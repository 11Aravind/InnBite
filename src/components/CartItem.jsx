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
    isAvailable = true,
    onIncrease,
    onDecrease,
    onRemove
}) => {
    const activeInstructions = special_instruction || specialInstruction || '';
    const customEntries = Object.entries(customizations || {});

    // Combine customizations and instructions for the notes display
    const notesText = [
        ...customEntries.map(([k, v]) => (v === 'No' ? `No ${k}` : `${k}: ${v}`)),
        activeInstructions
    ].filter(Boolean).join(' • ') || 'Add Notes';

    return (
        <div className={`border-b border-[#f4f1f1] last:border-none ${!isAvailable ? 'bg-rose-50/40' : ''}`}>
            {!isAvailable && (
                <div className="bg-rose-100 border-b border-rose-200 px-4 py-1.5 flex items-center justify-between text-rose-800 text-xs font-bold">
                    <span>⚠️ Item Out of Stock - Please remove to checkout</span>
                    <button onClick={onRemove} className="text-rose-700 underline font-black hover:text-rose-900">
                        Remove Item
                    </button>
                </div>
            )}
            <div className="flex gap-4 bg-white px-4 py-3 justify-between flex-wrap sm:flex-nowrap relative group">
                <div className="flex items-start gap-4">
                    <div
                        className={`bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[70px] ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                        style={{ backgroundImage: `url("${image || '/placeholderfood.png'}")` }}
                    />
                    <div className="flex flex-1 flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <p className="text-[#171312] text-base font-medium leading-normal">{name}</p>
                            {!isAvailable && (
                                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        <p className="text-[#836c67] text-sm font-normal leading-normal">₹{price}</p>
                        <p className="text-[#836c67] text-sm font-normal leading-normal">{portion}</p>
                    </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                    <button 
                        onClick={onRemove}
                        className="text-[#ef4f3f] text-xs font-medium bg-rose-50 px-2 py-0.5 rounded-full mb-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Remove
                    </button>
                    <div className="flex items-center gap-2 text-[#171312]">
                        <button
                            onClick={onDecrease}
                            className="text-base font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1f1] cursor-pointer"
                        >
                            -
                        </button>
                        <div className="text-base font-medium leading-normal w-4 text-center">
                            {quantity}
                        </div>
                        <button
                            onClick={onIncrease}
                            className="text-base font-medium leading-normal flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1f1] cursor-pointer"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 min-h-14 justify-between border-t border-dashed border-[#f4f1f1]/50">
                <p className="text-[#171312] text-base font-normal leading-normal flex-1 truncate">
                    {notesText}
                </p>
                <div className="shrink-0">
                    <div className="text-[#171312] flex size-7 items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;