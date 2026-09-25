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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-slate-900 selection:text-white">
            {/* White Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white text-slate-900 flex-shrink-0 flex flex-col justify-between shadow-sm z-20 border-r border-slate-200">
                <div>
                    {/* Brand Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            {/* <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-xl shadow-md">
                                O
                            </div> */}
                            <img src="/logo.svg" alt="InnBite Logo" className="w-9 h-9 shrink-0 object-contain" />
                            <div>
                                <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                                    InnBite <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200">Admin</span>
                                </h1>
                                <span className="text-[11px] text-slate-500 font-medium">Management Portal</span>
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
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                                    <span>{item.label}</span>

                                    {active && (
                                        <span className="absolute right-3 w-1.5 h-5 bg-white rounded-full opacity-90 shadow-sm" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Switch Button */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm group"
                    >
                        <span>View Customer Menu</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
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
