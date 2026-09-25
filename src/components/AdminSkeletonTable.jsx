import React from 'react';

export function AdminSkeletonTable({ rows = 5, cols = 5 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden animate-pulse">
            <div className="bg-slate-50 border-b border-slate-200/80 p-4 flex gap-4">
                {Array.from({ length: cols }).map((_, idx) => (
                    <div key={idx} className="h-4 bg-slate-200 rounded-md flex-1"></div>
                ))}
            </div>
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rIdx) => (
                    <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                                <div className="h-3 bg-slate-100 rounded-md w-2/3"></div>
                            </div>
                        </div>
                        <div className="h-4 bg-slate-200 rounded-md w-20"></div>
                        <div className="h-4 bg-slate-200 rounded-md w-16"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AdminSkeletonCards({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: count }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex flex-col items-center gap-4">
                    <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100">
                        <div className="h-3 bg-slate-200 rounded-md w-24"></div>
                        <div className="h-6 w-6 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="w-32 h-32 bg-slate-200 rounded-2xl my-2"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                </div>
            ))}
        </div>
    );
}

export default AdminSkeletonTable;
