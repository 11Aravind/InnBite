import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function NetworkStatusBanner() {
    const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [showRestored, setShowRestored] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            const timer = setTimeout(() => {
                setShowRestored(false);
            }, 3500);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowRestored(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        setIsChecking(true);
        setTimeout(() => {
            if (navigator.onLine) {
                setIsOnline(true);
                setShowRestored(true);
                setTimeout(() => setShowRestored(false), 3500);
            }
            setIsChecking(false);
        }, 600);
    };

    if (isOnline && !showRestored) return null;

    return (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md pointer-events-auto animate-fade-in">
            {!isOnline && (
                <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-rose-500/40 shadow-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                            <WifiOff className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-extrabold text-white text-xs leading-tight">No Internet Connection</h4>
                            <p className="text-[11px] text-slate-300 truncate mt-0.5">Please check your Wi-Fi or mobile network</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRetry}
                        disabled={isChecking}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                        <span>{isChecking ? 'Checking...' : 'Retry'}</span>
                    </button>
                </div>
            )}

            {isOnline && showRestored && (
                <div className="bg-[#114536]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-emerald-400/40 shadow-xl flex items-center gap-2.5 text-xs animate-slide-down">
                    <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                        <Wifi className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-white text-xs">Internet Connection Restored</h4>
                        <p className="text-[10px] text-emerald-100">You are back online</p>
                    </div>
                </div>
            )}
        </div>
    );
}
