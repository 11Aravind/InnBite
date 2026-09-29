import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
    LayoutDashboard,
    Utensils,
    FolderKanban,
    Image as ImageIcon,
    QrCode,
    Receipt,
    Users,
    Sliders,
    LogOut,
    ExternalLink
} from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { appName, logoUrl } = useSettings();

    const isSuperAdminRoute = location.pathname.startsWith('/superadmin');

    const superAdminNavItems = [
        { path: '/superadmin', label: 'Client Configuration', icon: Sliders, exact: true },
        { path: '/superadmin/admins', label: 'Admin Accounts', icon: Users },
    ];

    const adminNavItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/orders', label: 'Orders', icon: Receipt },
        { path: '/admin/dishes', label: 'Menu', icon: Utensils },
        { path: '/admin/categories', label: 'Categories', icon: FolderKanban },
        { path: '/admin/waiters', label: 'Waiters', icon: Users },
        { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
        { path: '/admin/tables', label: 'Tables', icon: QrCode },
    ];

    const navItems = isSuperAdminRoute ? superAdminNavItems : adminNavItems;
    const portalTitle = isSuperAdminRoute ? 'Super Admin' : 'Admin';
    const portalSub = isSuperAdminRoute ? 'SaaS Console' : 'Management Portal';

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    const handleLogout = () => {
        logout();
        const loginPath = isSuperAdminRoute ? '/superadmin/login' : '/admin/login';
        navigate(loginPath, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-slate-900 selection:text-white">
            {/* Dynamic Theme Sidebar (Fixed / Sticky on viewport scroll) */}
            <aside className="w-full md:w-64 bg-sidebar text-white flex-shrink-0 flex flex-col justify-between shadow-xl z-20 border-r border-sidebar md:h-screen md:sticky md:top-0">
                <div>
                    {/* Brand Header */}
                    <div className="p-6 border-b border-sidebar flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <img src={logoUrl || 'logo/innbite-logo.png'} alt={appName} className="w-9 h-9 object-contain shrink-0 rounded-lg bg-white/10 p-1" />
                            <div>
                                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                                    {appName} <span className="text-[10px] uppercase font-bold bg-sidebar-active text-white px-1.5 py-0.5 rounded-md border border-sidebar-active">{portalTitle}</span>
                                </h1>
                                <span className="text-[11px] text-white/80 font-medium">{portalSub}</span>
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
                                        ? 'bg-sidebar-active text-white shadow-inner font-bold border border-sidebar-active'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                                    <span>{item.label}</span>

                                    {active && (
                                        <span className="absolute right-3 w-1.5 h-4 bg-white rounded-full opacity-90 shadow-sm" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer User Info & Logout Button */}
                <div className="p-4 border-t border-sidebar space-y-2">
                    <div className="px-2 py-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                            {user?.name || 'Administrator'}
                        </span>
                        <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded border border-white/30">
                            {portalTitle}
                        </span>
                    </div>

                    <button
                        onClick={() => navigate(isSuperAdminRoute ? '/admin' : '/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sidebar-active hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-sidebar-active group shadow-sm cursor-pointer"
                    >
                        <span>{isSuperAdminRoute ? 'Restaurant Admin View' : 'Customer Menu'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900/80 text-rose-200 text-xs font-bold rounded-xl transition-all border border-rose-800/80 cursor-pointer"
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
