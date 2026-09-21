import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Flame,
    Utensils,
    FolderKanban,
    Image as ImageIcon,
    QrCode,
    Receipt,
    ExternalLink
} from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/kitchen', label: 'Kitchen View', icon: Flame },
        { path: '/admin/dishes', label: 'Dishes / Menu', icon: Utensils },
        { path: '/admin/categories', label: 'Categories', icon: FolderKanban },
        { path: '/admin/banners', label: 'Banners & Promos', icon: ImageIcon },
        { path: '/admin/tables', label: 'Tables & QR Codes', icon: QrCode },
        { path: '/admin/orders', label: 'Orders & Payments', icon: Receipt },
    ];

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-rose-500 selection:text-white">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between shadow-xl z-20">
                <div>
                    {/* Brand Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-rose-500/20 ring-1 ring-white/20">
                                O
                            </div>
                            <div>
                                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                                    Orderly <span className="text-[10px] uppercase font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-500/30">Admin</span>
                                </h1>
                                <span className="text-[11px] text-slate-400 font-medium">Management Portal</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="p-3.5 space-y-1.5">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            const active = isActive(item);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${active
                                            ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25 font-bold'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'}`} />
                                    <span>{item.label}</span>

                                    {active && (
                                        <span className="absolute right-3 w-1.5 h-5 bg-white rounded-full opacity-90" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Switch Button */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/50 shadow-sm group"
                    >
                        <span>View Customer Menu</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                    </button>
                </div>
            </aside>

            {/* Main Content Area with Clean Light / White Background */}
            <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
