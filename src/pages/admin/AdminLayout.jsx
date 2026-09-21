import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
        { path: '/kitchen', label: 'Kitchen View', icon: '👨‍🍳' },
        { path: '/admin/dishes', label: 'Dishes / Menu', icon: '🍔' },
        { path: '/admin/categories', label: 'Categories', icon: '📁' },
        { path: '/admin/banners', label: 'Banners & Promos', icon: '🖼️' },
        { path: '/admin/tables', label: 'Tables & QR Codes', icon: '📲' },
        { path: '/admin/orders', label: 'Orders & Payments', icon: '🧾' },
    ];

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-md">
                                O
                            </div>
                            <div>
                                <h1 className="font-bold text-base tracking-tight text-white">Orderly Admin</h1>
                                <span className="text-[10px] text-amber-400 font-medium">Management Portal</span>
                            </div>
                        </div>
                    </div>

                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${isActive(item)
                                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Footer Link */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                    >
                        <span>🏠 View Customer Menu</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Body */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
