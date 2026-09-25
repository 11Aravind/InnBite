import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function FoodCard({ image, name, price, id }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex h-full flex-1 flex-col gap-2.5 rounded-2xl min-w-[150px] sm:min-w-[170px] cursor-pointer group hover:scale-[1.02] transition-all"
            onClick={() => navigate(`/FoodDetails/${id}`)}
        >
            <ImageWithSkeleton
                src={image}
                alt={name}
                aspectRatio="aspect-square"
                className="rounded-2xl shadow-2xs border border-slate-100 group-hover:shadow-md transition-shadow"
            />
            <div className="px-0.5">
                <p className="text-slate-900 text-sm font-bold leading-tight line-clamp-1 group-hover:text-black">{name}</p>
                <p className="text-slate-600 text-xs font-extrabold leading-normal mt-0.5">₹{Number(price || 0).toFixed(2)}</p>
            </div>
        </div>
    );
}