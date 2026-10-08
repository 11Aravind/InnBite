import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/' && !location.hash;
    const isCart = location.pathname === '/cart';

    const handleHomeClick = (e) => {
        e.preventDefault();
        if (location.pathname !== '/') {
            navigate('/');
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (location.hash) {
                navigate('/', { replace: true });
            }
        }
    };

    const handleCartClick = (e) => {
        e.preventDefault();
        navigate('/cart');
    };

    return (
        <div className="flex gap-2 border-t border-[#f4f1f1] bg-white px-4 pb-2 pt-2 fixed bottom-0 left-0 right-0 z-40">
            {/* Home Option */}
            <a
                className={`flex flex-1 flex-col items-center justify-end gap-1 ${isHome ? 'text-[#114536]' : 'text-[#82686a]'}`}
                href="/"
                onClick={handleHomeClick}
            >
                <div
                    className={`flex h-8 items-center justify-center ${isHome ? 'text-[#114536]' : 'text-[#82686a]'}`}
                    data-icon="House"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                    </svg>
                </div>
                <p className={`text-xs font-medium leading-normal tracking-[0.015em] ${isHome ? 'text-[#114536] font-bold' : 'text-[#82686a]'}`}>
                    Home
                </p>
            </a>


            {/* Cart Option */}
            <a
                className={`flex flex-1 flex-col items-center justify-end gap-1 ${isCart ? 'text-[#114536]' : 'text-[#82686a]'}`}
                href="/cart"
                onClick={handleCartClick}
            >
                <div
                    className={`flex h-8 items-center justify-center ${isCart ? 'text-[#114536]' : 'text-[#82686a]'}`}
                    data-icon="ShoppingCart"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-74.57A8,8,0,0,1,188.1,136H69.22L57.59,72H206.41Z"></path>
                    </svg>
                </div>
                <p className={`text-xs font-medium leading-normal tracking-[0.015em] ${isCart ? 'text-[#114536] font-bold' : 'text-[#82686a]'}`}>
                    Cart
                </p>
            </a>
        </div>
    );
}