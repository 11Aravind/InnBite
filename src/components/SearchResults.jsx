import React from 'react';
import FoodCard from './FoodCard';
import { SearchX, Sparkles } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

export default function SearchResults({ results, isLoading, searchQuery, onClear }) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3.5 p-4 max-w-2xl mx-auto w-full">
                {Array(3).fill(0).map((_, idx) => (
                    <Skeleton key={idx} height={110} borderRadius={24} />
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <SearchX className="w-8 h-8" />
                </div>
                <h3 className="text-[#171212] text-base font-bold">
                    No dishes found matching "{searchQuery}"
                </h3>
                <p className="text-[#82686a] text-xs mt-1 max-w-xs">
                    Try searching for ingredients, category names, or check your spelling.
                </p>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="mt-4 px-4 py-2 bg-[#114536] text-white text-xs font-bold rounded-xl hover:bg-[#0d362a] transition-all shadow-sm active:scale-95"
                    >
                        Clear Search & View Menu
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto w-full">
            {/* Search Header Banner */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#114536]" />
                    <span className="text-xs font-bold text-[#171212]">
                        Found {results.length} {results.length === 1 ? 'dish' : 'dishes'}
                    </span>
                    {searchQuery && (
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                            for "{searchQuery}"
                        </span>
                    )}
                </div>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-xs font-bold text-[#114536] hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Dish Cards List */}
            <div className="flex flex-col gap-3.5">
                {results.map((food) => (
                    <FoodCard
                        key={food.id}
                        id={food.id}
                        image={food.images?.[0] || food.image || '/placeholderfood.png'}
                        name={food.name}
                        price={food.basePrice || food.base_price}
                        description={food.description}
                        isAvailable={food.is_available !== false}
                        isPopular={Boolean(food.is_popular || food.isPopular)}
                        isSpecial={Boolean(food.is_special || food.isSpecial)}
                        isVeg={food.is_veg}
                    />
                ))}
            </div>
        </div>
    );
}