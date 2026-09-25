import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchResults from '../components/SearchResults';
import CallButton from '../components/CallButton';
import FoodCard from '../components/FoodCard';
import CategoryCard from '../components/CategoryCard';
import BottomNavigation from '../components/BottomNavigation';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { apiService } from '../utils/apiService';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { Utensils, ChevronRight, Clock, ChefHat, Sparkles } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Active order modal state
    const [activeOrder, setActiveOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Table detection from QR Code URL (?table=X)
    const [tableNumber, setTableNumber] = useState(() => {
        const urlTable = searchParams.get('table');
        if (urlTable) {
            localStorage.setItem('orderly_table_number', urlTable);
            return urlTable;
        }
        return localStorage.getItem('orderly_table_number') || '1';
    });

    // API Data state
    const [homeData, setHomeData] = useState(null);
    const [allDishes, setAllDishes] = useState([]);
    const [apiLoading, setApiLoading] = useState(true);

    useEffect(() => {
        const storedOrder = localStorage.getItem('orderly_active_order');
        if (storedOrder) {
            try {
                const parsed = JSON.parse(storedOrder);
                if (parsed && parsed.id) {
                    setActiveOrder(parsed);
                }
            } catch (e) {
                console.error('Error parsing stored active order:', e);
            }
        }
    }, []);

    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            localStorage.setItem('orderly_table_number', tableFromUrl);
            setTableNumber(tableFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        setApiLoading(true);
        Promise.all([
            apiService.getHomePageData(),
            apiService.getDishes()
        ])
            .then(([data, dishes]) => {
                if (data) setHomeData(data);
                if (dishes) setAllDishes(dishes);
            })
            .catch((err) => console.error('Data load error:', err))
            .finally(() => setApiLoading(false));
    }, []);

    // Debounce search
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const searchFoods = useCallback(
        debounce(() => {
            setIsSearching(true);
            setTimeout(() => {
                setIsSearching(false);
            }, 250);
        }, 300),
        []
    );

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            searchFoods(query);
        }
    };

    // Filter dishes based on search query
    const searchResults = searchQuery.length > 2
        ? allDishes.filter(food =>
            food.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (food.ingredients && food.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase())))
        )
        : [];

    const banners = homeData?.banners || [];
    const popularDishes = homeData?.popular_dishes || [];
    const todaysSpecials = homeData?.todays_specials || [];
    const categories = homeData?.categories || [];

    return (
        <div
            className="relative flex size-full min-h-screen flex-col bg-white justify-between group/design-root overflow-x-hidden"
            style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
        >
            {/* Customer Order Details Modal */}
            {showOrderModal && activeOrder && (
                <CustomerOrderDetailsModal
                    order={activeOrder}
                    onClose={() => setShowOrderModal(false)}
                    onOrderMore={() => setShowOrderModal(false)}
                />
            )}

            <div>
                {/* Header with Brand & Table Badge */}
                <div className="flex items-center bg-white p-4 pb-2 justify-between">
                    <div
                        className="text-[#171212] flex size-12 shrink-0 items-center cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <h2 className="text-[#171212] text-lg font-bold leading-tight tracking-[-0.015em]">
                            InnBite
                        </h2>
                        <div className="flex items-center gap-1 bg-[#f4f1f1] px-2 py-0.5 rounded-full mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[#171212] text-xs font-semibold">Table #{tableNumber}</span>
                        </div>
                    </div>
                    <CallButton />
                </div>

                {/* Active Order Banner for Customer (Yellow/Gold Modal Theme) */}
                {activeOrder && (
                    <div className="px-4 pt-2">
                        <div
                            onClick={() => setShowOrderModal(true)}
                            className="bg-gradient-to-r from-[#c89346] via-[#bd873b] to-[#a87431] text-white rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:brightness-105 transition-all shadow-md border border-[#b87d35]"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-white text-[#8b5e2b] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                                    <Utensils className="w-4.5 h-4.5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-white">Active Table #{activeOrder.table_number} Order</span>
                                        <span className="text-[10px] uppercase font-extrabold bg-[#1a1815] text-[#f5d796] border border-[#3b3226] px-2 py-0.5 rounded-full">
                                            {activeOrder.status === 'pending' ? 'Pending' : activeOrder.status === 'preparing' ? 'Preparing' : 'Served'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-amber-100 font-semibold block mt-0.5">
                                        Total: ₹{Number(activeOrder.total_amount).toFixed(2)} · Tap for details & live tracking
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white shrink-0" />
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="px-4 pb-3 pt-2">
                    <label className="relative flex w-full items-center">
                        <div className="flex h-12 w-full items-center overflow-hidden rounded-xl bg-[#f4f1f1]">
                            <div className="absolute left-3 flex items-center justify-center text-[#82686a]">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20px"
                                    height="20px"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                >
                                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                                </svg>
                            </div>

                            <input
                                placeholder="Search for food, ingredients..."
                                className="h-full w-full bg-[#f4f1f1] pl-12 pr-10 text-base font-normal leading-normal text-[#171212] placeholder:text-[#82686a] focus:outline-none"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />

                            {searchQuery && (
                                <button
                                    className="absolute right-3 text-[#82686a] hover:text-[#171212] transition-colors"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        fill="currentColor"
                                        viewBox="0 0 256 256"
                                    >
                                        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </label>
                </div>

                {/* Main Content or Search Results */}
                {searchQuery.length > 2 ? (
                    <SearchResults
                        results={searchResults}
                        isLoading={isSearching}
                    />
                ) : (
                    <>
                        {/* Banners */}
                        <div className="flex overflow-x-auto overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch p-4 gap-3 snap-x snap-mandatory">
                                {apiLoading ? (
                                    Array(2).fill(0).map((_, idx) => (
                                        <div key={idx} className="flex h-full flex-1 flex-col gap-2 rounded-2xl min-w-[280px] sm:min-w-60 snap-start">
                                            <Skeleton height={140} borderRadius={16} />
                                            <Skeleton width={140} height={18} />
                                        </div>
                                    ))
                                ) : (
                                    banners.map((banner) => (
                                        <div
                                            key={banner.id}
                                            className="flex h-full flex-1 flex-col gap-2 rounded-2xl min-w-[280px] sm:min-w-[320px] snap-start cursor-pointer group"
                                            onClick={() => banner.dish_id && navigate(`/FoodDetails/${banner.dish_id}`)}
                                        >
                                            <ImageWithSkeleton
                                                src={banner.image_url}
                                                alt={banner.title}
                                                aspectRatio="aspect-video"
                                                className="w-full rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow"
                                            />
                                            <p className="text-slate-900 text-sm font-bold leading-tight px-1">
                                                {banner.title}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Popular Dishes Section */}
                        <h2 className="text-[#171212] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                            Popular Dishes
                        </h2>
                        <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch p-4 gap-3">
                                {apiLoading ? (
                                    Array(3).fill(0).map((_, idx) => (
                                        <div key={idx} className="w-40">
                                            <Skeleton height={100} borderRadius={12} />
                                            <Skeleton height={20} width={80} style={{ marginTop: 8 }} />
                                            <Skeleton height={16} width={60} />
                                        </div>
                                    ))
                                ) : (
                                    popularDishes.map((dish) => (
                                        <FoodCard
                                            key={dish.id}
                                            id={dish.id}
                                            image={dish.images?.[0] || dish.image || '/placeholderfood.png'}
                                            name={dish.name}
                                            price={dish.basePrice || dish.base_price}
                                            description={dish.description}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Today's Specials Section */}
                        <h2 className="text-[#171212] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                            Today's Specials
                        </h2>
                        <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch p-4 gap-3">
                                {apiLoading ? (
                                    Array(2).fill(0).map((_, idx) => (
                                        <div key={idx} className="w-40">
                                            <Skeleton height={100} borderRadius={12} />
                                            <Skeleton height={20} width={80} style={{ marginTop: 8 }} />
                                            <Skeleton height={16} width={60} />
                                        </div>
                                    ))
                                ) : todaysSpecials.length === 0 ? (
                                    <div className="text-[#82686a] px-4">No specials available today</div>
                                ) : (
                                    todaysSpecials.map((item) => (
                                        <FoodCard
                                            key={item.id}
                                            id={item.id}
                                            image={item.images?.[0] || item.image || '/placeholderfood.png'}
                                            name={item.name}
                                            price={item.basePrice || item.base_price}
                                            description={item.description}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Categories Section */}
                        <h2 className="text-[#171212] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                            Categories
                        </h2>
                        <div className="pb-4">
                            {apiLoading ? (
                                Array(4).fill(0).map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-3 px-4 mb-3">
                                        <Skeleton circle width={48} height={48} />
                                        <Skeleton width={120} height={20} />
                                    </div>
                                ))
                            ) : (
                                categories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        id={category.id}
                                        image={category.image_url || category.image || '/placeholderfood.png'}
                                        name={category.name}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
            <BottomNavigation />
            <div className="pb-[72px]" />
        </div>
    );
}
