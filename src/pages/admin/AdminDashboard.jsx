import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/apiService';
import AdminSkeletonTable from '../../components/AdminSkeletonTable';
import { toast } from 'react-hot-toast';
import {
    DollarSign,
    ShoppingBag,
    Flame,
    Utensils,
    TrendingUp,
    ChevronRight,
    Clock,
    QrCode,
    Sparkles,
    CheckCircle2,
    Sliders,
    CreditCard,
    Store
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { useSettings } from '../../context/SettingsContext';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { appName, updateSettings } = useSettings();
    const [orders, setOrders] = useState([]);
    const [settings, setSettings] = useState(null);
    const [dishesCount, setDishesCount] = useState(0);
    const [tablesCount, setTablesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        setLoading(true);
        const [ordersData, dishesData, tablesData, settingsData] = await Promise.all([
            apiService.getOrders(),
            apiService.getDishes(),
            apiService.getTables(),
            apiService.getRestaurantSettings()
        ]);

        setOrders(ordersData || []);
        setDishesCount((dishesData || []).length);
        setTablesCount((tablesData || []).length);
        setSettings(settingsData);
        setLoading(false);
    };

    useEffect(() => {
        loadDashboardData();

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('admin_dashboard_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadDashboardData())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => loadDashboardData())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => loadDashboardData())
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'SERVED' || o.status === 'completed').length;
    
    const serviceModeLabel = settings?.service_mode || import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Admin Dashboard <TrendingUp className="w-5 h-5 text-themePrimary" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Live metrics and operational control for {appName} Platform ({serviceModeLabel})</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            const newStatus = !settings?.is_closed;
                            await apiService.updateRestaurantSettings({ 
                                ...settings, 
                                is_closed: newStatus 
                            });
                            setSettings({ ...settings, is_closed: newStatus });
                            toast.success(newStatus ? 'Store closed for orders' : 'Store opened for orders');
                        }}
                        className={`px-4 py-3 rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-2 transition-colors ${
                            settings?.is_closed 
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                    >
                        <Sliders className="w-4 h-4" />
                        <span>{settings?.is_closed ? 'Shop is CLOSED (Click to Open)' : 'Shop is OPEN (Click to Close)'}</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-6 py-3 btn-primary text-xs shrink-0 cursor-pointer flex items-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4 text-emerald-200" />
                        <span>View Orders & Payments</span>
                    </button>
                </div>
            </div>


            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">₹{totalRevenue.toFixed(2)}</div>
                    <span className="text-[11px] text-emerald-600 font-medium mt-1.5 block">
                        Verified payment revenue
                    </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{orders.length}</div>
                    <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
                        {completedCount} fulfilled orders
                    </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Queue</span>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                            <Flame className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
                    <span className="text-[11px] text-amber-600 font-medium mt-1.5 block">
                        Active in kitchen/waiter view
                    </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Menu Items</span>
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                            <Utensils className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{dishesCount}</div>
                    <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
                        {tablesCount} registered tables
                    </span>
                </div>
            </div>



            {/* Recent Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-500" /> Recent Confirmed Orders
                    </h2>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="text-xs font-bold text-slate-900 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                        <span>View All Orders</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <AdminSkeletonTable rows={4} cols={6} />
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold text-xs">No orders placed yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Order #</th>
                                    <th className="px-4 py-3">Service Mode / Table</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Total Paid</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Order Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {orders.slice(0, 5).map((order) => {
                                    const isSelf = order.service_mode === 'SELF_SERVICE' || (!order.table_number && !order.table_id);
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900">#{order.order_number || order.id}</td>
                                            <td className="px-4 py-3.5 font-bold">
                                                {isSelf ? (
                                                    <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                        Self-Service (No Table)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-900">
                                                        Table #{order.table_number}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-slate-800">{order.customer_name || 'Guest'}</td>
                                            <td className="px-4 py-3.5 font-bold text-slate-900">₹{Number(order.total_amount).toFixed(2)}</td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Verified (SUCCESS)
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs font-extrabold uppercase text-slate-900">
                                                    {order.status || 'CONFIRMED'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}