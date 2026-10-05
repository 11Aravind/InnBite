import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import SearchResults from '../components/SearchResults';
import CallButton from '../components/CallButton';
import FoodCard from '../components/FoodCard';
import CategoryCard from '../components/CategoryCard';
import BottomNavigation from '../components/BottomNavigation';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { apiService } from '../utils/apiService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { secureStorage } from '../utils/secureStorage';
import { APP_CONFIG } from '../config';
import { useSettings } from '../context/SettingsContext';
import { Utensils, ChevronRight, Clock, ChefHat, Sparkles } from 'lucide-react';
import { handleOrderRealtimeUpdate, syncActiveOrderWithServer } from '../utils/orderUtils';

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { appName, logoUrl } = useSettings();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);

    useEffect(() => {
        if (location.hash === '#categories' || searchParams.get('menu') === 'true') {
            setShowAllCategories(true);
            setTimeout(() => {
                const el = document.getElementById('categories-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    }, [location.hash, searchParams]);

    useEffect(() => {
        const handleShowAll = () => {
            setShowAllCategories(true);
        };
        window.addEventListener('show-all-categories', handleShowAll);
        return () => window.removeEventListener('show-all-categories', handleShowAll);
    }, []);

    // Active order modal state
    const [activeOrder, setActiveOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Table detection from QR Code URL (?table=X)
    const [tableNumber, setTableNumber] = useState(() => {
        const urlTable = searchParams.get('table');
        if (urlTable) {
            secureStorage.setItem('orderly_table_number', urlTable);
            return urlTable;
        }
        return secureStorage.getItem('orderly_table_number') || '1';
    });

    // API Data state
    const [homeData, setHomeData] = useState(null);
    const [allDishes, setAllDishes] = useState([]);
    const [apiLoading, setApiLoading] = useState(true);

    const validateActiveOrder = async (orderToCheck) => {
        if (!orderToCheck || !orderToCheck.id) return;
        const updated = await syncActiveOrderWithServer(orderToCheck);
        if (!updated) {
            setActiveOrder(null);
        } else {
            setActiveOrder(updated);
        }
    };

    useEffect(() => {
        const storedOrder = secureStorage.getItem('orderly_active_order');
        if (storedOrder) {
            try {
                if (storedOrder && storedOrder.id) {
                    validateActiveOrder(storedOrder);
                }
            } catch (e) {
                console.error('Error parsing stored active order:', e);
            }
        }
    }, []);

    useEffect(() => {
        let subscription;
        if (isSupabaseConfigured && supabase && activeOrder?.id) {
            subscription = supabase
                .channel(`home_order_track_${activeOrder.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                    if (payload.eventType === 'DELETE' && (payload.old?.id === activeOrder.id)) {
                        secureStorage.removeItem('orderly_active_order');
                        setActiveOrder(null);
                        setShowOrderModal(false);
                    } else if (payload.eventType === 'UPDATE' && payload.new?.id === activeOrder.id) {
                        const updated = handleOrderRealtimeUpdate(activeOrder, payload.new);
                        if (!updated) {
                            setActiveOrder(null);
                            setShowOrderModal(false);
                        } else {
                            setActiveOrder(updated);
                        }
                    }
                })
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [activeOrder?.id]);

    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            secureStorage.setItem('orderly_table_number', tableFromUrl);
            setTableNumber(tableFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        setApiLoading(true);
        apiService.getHomePageData()
            .then((data) => {
                if (data) {
                    setHomeData(data);
                    setAllDishes(data.all_dishes || data.popular_dishes || []);
                }
            })
            .catch((err) => console.error('Data load error:', err))
            .finally(() => setApiLoading(false));

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('home_dishes_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
                    apiService.getHomePageData(true).then((data) => {
                        if (data) {
                            setHomeData({ ...data });
                            setAllDishes(data.all_dishes || data.popular_dishes || []);
                        }
                    });
                })
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
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
                    disableSubscription={true}
                />
            )}

            <div>
                {/* Header with Brand & Table Badge */}
                <div className="flex items-center bg-white p-4 pb-2 justify-between">
                    <div
                        className="text-[#171212] flex size-12 shrink-0 items-center cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <img src={logoUrl || '/logo.svg'} alt={appName} className="w-8 h-8 object-contain rounded-lg" />
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <h2 className="text-[#171212] text-lg font-bold leading-tight tracking-[-0.015em]">
                            {appName}
                        </h2>
                        <div className="flex items-center gap-1 bg-[#f4f1f1] px-2 py-0.5 rounded-full mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[#171212] text-xs font-semibold">Table #{tableNumber}</span>
                        </div>
                    </div>
                    <CallButton />
                </div>

                {/* Shop Closed Banner */}
                {homeData?.settings?.is_closed && (
                    <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex items-start gap-3 sticky top-0 z-10 shadow-sm">
                        <div className="mt-0.5 bg-rose-100 text-rose-600 rounded-full p-1 shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[#171212] text-sm font-bold leading-tight">We are currently closed</p>
                            <p className="text-rose-600 text-xs font-semibold mt-0.5">Online ordering is temporarily paused because the shop is closed.</p>
                        </div>
                    </div>
                )}

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
                                            {activeOrder.status}
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
                                        </div>
                                    ))
                                ) : (
                                    banners.map((banner) => (
                                        <div
                                            key={banner.id}
                                            className="flex h-full w-[280px] sm:w-[320px] shrink-0 flex-col gap-4 rounded-lg snap-start cursor-pointer"
                                            onClick={() => banner.dish_id && navigate(`/FoodDetails/${banner.dish_id}`)}
                                        >
                                            <ImageWithSkeleton
                                                src={banner.image_url}
                                                alt={banner.title}
                                                aspectRatio="aspect-video"
                                                className="w-full bg-center bg-no-repeat bg-cover rounded-xl flex flex-col"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Main Categories Section (Grid System) */}
                        <div id="categories-section" className="px-4 pt-5 pb-3 scroll-mt-4">
                            <div className="flex items-center justify-between mb-3.5">
                                <h2 className="text-[#171212] text-[20px] sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">
                                    Main Categories
                                </h2>
                                {categories.length > 6 ? (
                                    <button
                                        onClick={() => setShowAllCategories(!showAllCategories)}
                                        className="text-xs sm:text-sm font-semibold text-[#82686a] hover:text-[#171212] flex items-center gap-1 transition-colors group"
                                    >
                                        {showAllCategories ? 'Show Less' : 'View All'}
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showAllCategories ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                                    </button>
                                ) : (
                                    <div className="text-xs sm:text-sm font-semibold text-[#82686a] flex items-center gap-1 cursor-pointer hover:text-[#171212]">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {apiLoading ? (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                    {Array(6).fill(0).map((_, idx) => (
                                        <div key={idx} className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 shadow-xs">
                                            <Skeleton circle width={56} height={56} className="mb-2" />
                                            <Skeleton width={50} height={14} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                    {(showAllCategories ? categories : categories.slice(0, 6)).map((category) => (
                                        <CategoryCard
                                            key={category.id}
                                            id={category.id}
                                            image={category.image_url || category.image || '/placeholderfood.png'}
                                            name={category.name}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Popular Dishes Section */}
                        <h2 className="text-[#171212] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                            Popular Dishes
                        </h2>
                        <div className="flex overflow-x-auto overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch px-4 py-2 gap-3.5">
                                {apiLoading ? (
                                    Array(3).fill(0).map((_, idx) => (
                                        <div key={idx} className="w-[300px] shrink-0">
                                            <Skeleton height={110} borderRadius={24} />
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
                                            isAvailable={dish.is_available !== false}
                                            className="w-[300px] sm:w-[340px] shrink-0"
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Today's Specials Section */}
                        <h2 className="text-[#171212] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                            Today's Specials
                        </h2>
                        <div className="flex overflow-x-auto overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch px-4 py-2 gap-3.5">
                                {apiLoading ? (
                                    Array(2).fill(0).map((_, idx) => (
                                        <div key={idx} className="w-[300px] shrink-0">
                                            <Skeleton height={110} borderRadius={24} />
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
                                            isAvailable={item.is_available !== false}
                                            className="w-[300px] sm:w-[340px] shrink-0"
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <BottomNavigation />
            <div className="pb-[72px]" />
        </div>
    );
}
