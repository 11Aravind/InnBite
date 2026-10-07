import React from 'react';

/**
 * Standard Swiggy/Zomato style Veg & Non-Veg symbol indicator
 */
export default function VegNonVegSymbol({ isVeg = true, size = 'md', className = '' }) {
    const isVegetarian = Boolean(isVeg !== false);

    const boxDimensions = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    const dotDimensions = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

    if (isVegetarian) {
        return (
            <span
                className={`${boxDimensions} border-2 border-emerald-600 rounded-[4px] flex items-center justify-center shrink-0 bg-white shadow-2xs ${className}`}
                title="Vegetarian"
            >
                <span className={`${dotDimensions} rounded-full bg-emerald-600 shrink-0`} />
            </span>
        );
    }

    return (
        <span
            className={`${boxDimensions} border-2 border-rose-600 rounded-[4px] flex items-center justify-center shrink-0 bg-white shadow-2xs ${className}`}
            title="Non-Vegetarian"
        >
            <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-rose-600 shrink-0 mb-[0.5px]" />
        </span>
    );
}
