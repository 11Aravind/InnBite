import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function CategoryCard({ id, image, name }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex items-center gap-4 bg-white px-4 py-2.5 hover:bg-slate-50 min-h-14 justify-between cursor-pointer rounded-xl border border-transparent hover:border-slate-100 transition-all mb-1"
            onClick={() => navigate(`/CategoryDetails/${id}`)}
        >
            <div className="flex items-center gap-3.5">
                <ImageWithSkeleton
                    src={image}
                    alt={name}
                    aspectRatio="aspect-square"
                    className="w-11 h-11 rounded-xl shadow-2xs border border-slate-100 shrink-0"
                />
                <p className="text-slate-900 text-sm font-bold leading-tight flex-1 truncate">
                    {name}
                </p>
            </div>
            <div className="shrink-0 text-slate-400">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                >
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                </svg>
            </div>
        </div>
    );
}