import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function CategoryCard({ id, image, name }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex flex-col items-center justify-center bg-white border border-gray-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] rounded-2xl p-3 sm:p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 group text-center"
            onClick={() => navigate(`/CategoryDetails/${id}`)}
        >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden mb-2.5 shadow-xs group-hover:scale-105 transition-transform duration-200 border border-slate-100">
                <ImageWithSkeleton
                    src={image}
                    alt={name}
                    aspectRatio="aspect-square"
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
            <p className="text-[#171212] text-xs sm:text-sm font-semibold leading-normal text-center line-clamp-2">
                {name}
            </p>
        </div>
    );
}