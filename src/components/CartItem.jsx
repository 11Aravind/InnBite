import React, { useState } from 'react';
import QuantityControl from './QuantityControl';
import VegNonVegSymbol from './VegNonVegSymbol';
import { Trash2 } from 'lucide-react';

const CartItem = ({
    image,
    name,
    price,
    portion,
    quantity,
    customizations,
    special_instruction,
    specialInstruction,
    isVeg,
    is_veg,
    isAvailable = true,
    onIncrease,
    onDecrease,
    onRemove,
    onUpdateNotes
}) => {
    const activeInstructions = special_instruction || specialInstruction || '';
    const customEntries = Object.entries(customizations || {});

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [noteInput, setNoteInput] = useState(activeInstructions);

    const isItemVeg = isVeg !== undefined ? isVeg : (is_veg !== undefined ? is_veg : true);

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
            <div className="flex gap-3 bg-white px-4 py-3 justify-between items-center relative group">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                        className={`bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-[68px] shrink-0 border border-slate-100 ${!isAvailable ? 'grayscale-[60%]' : ''}`}
                        style={{ backgroundImage: `url("${image || '/placeholderfood.png'}")` }}
                    />
                    <div className="flex flex-1 flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <VegNonVegSymbol isVeg={isItemVeg} size="sm" />
                            <p className="text-[#171312] text-sm font-extrabold leading-snug truncate">{name}</p>
                            {!isAvailable && (
                                <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        <p className="text-[#114536] text-sm font-black leading-normal mt-0.5">₹{price}</p>
                        {portion && portion !== 'Regular' && (
                            <p className="text-slate-500 text-[11px] font-semibold leading-tight">{portion}</p>
                        )}
                    </div>
                </div>

                {/* Right Side: Quantity Stepper & Trash Delete Icon */}
                <div className="shrink-0 flex items-center gap-2">
                    <QuantityControl
                        quantity={quantity}
                        onIncrease={onIncrease}
                        onDecrease={onDecrease}
                        disabled={!isAvailable}
                    />

                    <button 
                        type="button"
                        onClick={onRemove}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-90 transition-all flex items-center justify-center border border-rose-100/80 cursor-pointer shrink-0 shadow-2xs"
                        title="Remove item"
                        aria-label="Remove item"
                    >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                </div>
            </div>

            {/* Interactive Notes & Details Section */}
            {isEditingNotes ? (
                <div className="bg-amber-50/80 p-3 border-t border-amber-200/80 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-800 font-bold">
                        <span>Special Instructions for {name}:</span>
                        <button 
                            type="button"
                            onClick={() => setIsEditingNotes(false)}
                            className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            autoFocus
                            placeholder="e.g. Less oil, extra spicy, no onions..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (onUpdateNotes) onUpdateNotes(noteInput);
                                    setIsEditingNotes(false);
                                }
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (onUpdateNotes) onUpdateNotes(noteInput);
                                setIsEditingNotes(false);
                            }}
                            className="px-4 py-2 bg-[#114536] hover:bg-[#0c382b] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    onClick={() => {
                        setNoteInput(activeInstructions);
                        setIsEditingNotes(true);
                    }}
                    className="flex items-center gap-4 bg-[#fcfbfa] hover:bg-slate-100/80 cursor-pointer px-4 py-2.5 min-h-11 justify-between border-t border-dashed border-[#f4f1f1] text-xs transition-colors group"
                    title="Click to add or edit special instructions"
                >
                    <p className={`font-medium leading-normal flex-1 truncate ${activeInstructions ? 'text-amber-900 font-semibold' : 'text-slate-400'}`}>
                        {notesText}
                    </p>
                    <div className="shrink-0 flex items-center gap-1.5 text-[#114536] font-bold text-[11px] group-hover:underline">
                        <span>{activeInstructions ? 'Edit' : 'Add Note'}</span>
                        <div className="text-[#114536] flex size-4 items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartItem;