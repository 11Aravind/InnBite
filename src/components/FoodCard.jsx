import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function FoodCard({ image, name, price, id, isAvailable = true }) {
    const navigate = useNavigate();

    return (
        <div
            className={`flex h-full w-40 shrink-0 flex-col gap-4 rounded-lg cursor-pointer group hover:scale-[1.02] transition-transform ${!isAvailable ? 'opacity-75' : ''}`}
            onClick={() => navigate(`/FoodDetails/${id}`)}
        >
            <div className="relative w-full">
                <ImageWithSkeleton
                    src={image}
                    alt={name}
                    aspectRatio="aspect-square"
                    className={`w-full bg-center bg-no-repeat bg-cover rounded-xl flex flex-col ${!isAvailable ? 'grayscale-[50%]' : ''}`}
                />
                {!isAvailable && (
                    <span className="absolute bottom-2 left-2 right-2 bg-rose-900/90 text-white text-[10px] font-extrabold uppercase tracking-wider text-center py-1 rounded-md backdrop-blur-xs shadow-xs border border-rose-700/50">
                        Out of Stock
                    </span>
                )}
            </div>
            <div>
                <p className="text-[#171212] text-base font-medium leading-normal line-clamp-1">{name}</p>
                <div className="flex items-center justify-between gap-1">
                    <p className="text-[#82686a] text-sm font-normal leading-normal">₹{Number(price || 0).toFixed(2)}</p>
                    {!isAvailable && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            Unavailable
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}