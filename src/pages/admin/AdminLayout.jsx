import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Utensils,
    FolderKanban,
    Image as ImageIcon,
    QrCode,
    Receipt,
    Users,
    LogOut,
    ExternalLink
} from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/orders', label: 'Orders', icon: Receipt },
        { path: '/admin/dishes', label: 'Menu', icon: Utensils },
        { path: '/admin/categories', label: 'Categories', icon: FolderKanban },
        { path: '/admin/tables', label: 'Tables', icon: QrCode },
        { path: '/admin/waiters', label: 'Waiters & Staff', icon: Users },
        { path: '/admin/banners', label: 'Promos & Banners', icon: ImageIcon },
    ];

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-emerald-900 selection:text-white">
            {/* Deep Emerald Forest Green Sidebar (Matching User Reference Image) */}
            <aside className="w-full md:w-64 bg-[#114536] text-white flex-shrink-0 flex flex-col justify-between shadow-xl z-20 border-r border-[#195947]">
                <div>
                    {/* Brand Header */}
                    <div className="p-6 border-b border-[#195947] flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-white text-[#114536] flex items-center justify-center font-black text-lg shadow-md shrink-0">
                                I
                            </div>
                            <div>
                                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                                    InnBite <span className="text-[10px] uppercase font-bold bg-[#1b5d4b] text-emerald-200 px-1.5 py-0.5 rounded-md border border-[#267761]">Admin</span>
                                </h1>
                                <span className="text-[11px] text-emerald-200/80 font-medium">Management Portal</span>
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
                                    className={`relative group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${active
                                        ? 'bg-[#0a2e23] text-white shadow-inner font-bold border border-[#165644]'
                                        : 'text-emerald-100/85 hover:bg-[#185544]/70 hover:text-white'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-emerald-200/80 group-hover:text-white'}`} />
                                    <span>{item.label}</span>

                                    {active && (
                                        <span className="absolute right-3 w-1.5 h-4 bg-emerald-400 rounded-full opacity-90 shadow-sm" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer User Info & Logout Button */}
                <div className="p-4 border-t border-[#195947] space-y-2">
                    <div className="px-2 py-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-100 truncate">
                            {user?.name || 'Administrator'}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/30">
                            Active
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#185544] hover:bg-[#1f6753] text-white text-xs font-bold rounded-xl transition-all border border-[#22725c] group shadow-sm"
                    >
                        <span>Customer Menu</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:text-white" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900/80 text-rose-200 text-xs font-bold rounded-xl transition-all border border-rose-800/80"
                    >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Logout Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
