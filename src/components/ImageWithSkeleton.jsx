import React, { useState } from 'react';

export default function ImageWithSkeleton({ src, alt, className = '', imgClassName = '', aspectRatio = 'aspect-square' }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const fallbackSrc = '/placeholderfood.png';

    return (
        <div className={`relative overflow-hidden bg-slate-100 ${aspectRatio} ${className}`}>
            {/* Shimmer Skeleton Placeholder while loading */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:400%_100%] animate-pulse" />
            )}

            <img
                src={error ? fallbackSrc : src}
                alt={alt || 'Food image'}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    setLoaded(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
            />
        </div>
    );
}
