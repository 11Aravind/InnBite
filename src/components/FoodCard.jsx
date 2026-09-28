import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function FoodCard({ image, name, price, id }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex h-full w-40 shrink-0 flex-col gap-4 rounded-lg cursor-pointer group hover:scale-[1.02] transition-transform"
            onClick={() => navigate(`/FoodDetails/${id}`)}
        >
            <ImageWithSkeleton
                src={image}
                alt={name}
                aspectRatio="aspect-square"
                className="w-full bg-center bg-no-repeat bg-cover rounded-xl flex flex-col"
            />
            <div>
                <p className="text-[#171212] text-base font-medium leading-normal line-clamp-1">{name}</p>
                <p className="text-[#82686a] text-sm font-normal leading-normal">₹{Number(price || 0).toFixed(2)}</p>

            </div>
        </div>
    );
}