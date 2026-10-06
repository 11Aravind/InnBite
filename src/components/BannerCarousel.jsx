import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import ImageWithSkeleton from './ImageWithSkeleton';

export default function BannerCarousel({ banners = [], isLoading = false }) {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Reset index if banners array changes
    useEffect(() => {
        if (currentIndex >= banners.length && banners.length > 0) {
            setCurrentIndex(0);
        }
    }, [banners.length]);

    // Autoplay timer
    useEffect(() => {
        if (banners.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [banners.length, isHovered]);

    const handlePrev = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? banners.length - 1 : prevIndex - 1
        );
    };

    const handleNext = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    };

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 40;

        if (diff > minSwipeDistance) {
            // Swiped left -> next
            handleNext();
        } else if (diff < -minSwipeDistance) {
            // Swiped right -> prev
            handlePrev();
        }

        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    if (isLoading) {
        return (
            <div className="px-4 py-3">
                <Skeleton height={210} borderRadius={20} className="w-full" />
            </div>
        );
    }

    if (!banners || banners.length === 0) {
        return null;
    }

    return (
        <div
            className="relative px-4 py-3 select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="relative overflow-hidden rounded-2xl shadow-sm bg-gray-100 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slides Track */}
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id || index}
                            className="w-full shrink-0 cursor-pointer relative"
                            onClick={() => banner.dish_id && navigate(`/FoodDetails/${banner.dish_id}`)}
                        >
                            <div className="relative w-full h-52 sm:h-64 md:h-80 overflow-hidden rounded-2xl">
                                <ImageWithSkeleton
                                    src={banner.image_url}
                                    alt={banner.title || 'Special Banner'}
                                    className="w-full h-full object-cover object-center rounded-2xl"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Left & Right Arrows (shown when >1 slide) */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            aria-label="Previous slide"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 z-10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next slide"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 z-10"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Pagination Indicators (Dots) */}
                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(index);
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`transition-all duration-300 rounded-full ${
                                    index === currentIndex
                                        ? 'w-6 h-2 bg-white shadow-xs'
                                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
