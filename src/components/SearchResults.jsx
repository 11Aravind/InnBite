import React from 'react';
import FoodCard from './FoodCard';

export default function SearchResults({ results, isLoading }) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="text-[#82686a]">Searching...</div>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="bg-[#f4f1f1] rounded-full p-6 mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="#82686a"
                        viewBox="0 0 256 256"
                    >
                        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                </div>
                <p className="text-[#171212] text-base font-medium leading-normal">
                    No items found
                </p>
                <p className="text-[#82686a] text-sm text-center mt-2">
                    Try searching for something else
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3.5 p-4 max-w-2xl mx-auto w-full">
            {results.map((food) => (
                <FoodCard
                    key={food.id}
                    id={food.id}
                    image={food.images?.[0] || food.image || '/placeholderfood.png'}
                    name={food.name}
                    price={food.basePrice || food.base_price}
                    description={food.description}
                    isAvailable={food.is_available !== false}
                />
            ))}
        </div>
    );
}