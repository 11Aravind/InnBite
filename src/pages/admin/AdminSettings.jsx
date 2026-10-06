import React, { useState, useEffect } from 'react';
import { useSettings, THEME_PRESETS } from '../../context/SettingsContext';
import { processAndUploadImage } from '../../utils/apiService';
import {
    Sliders,
    Upload,
    Palette,
    Store,
    Check,
    Phone,
    MapPin,
    FileText,
    CreditCard,
    Save,
    RefreshCw,
    ShieldCheck,
    CheckCircle2,
    ShoppingBag,
    Utensils,
    QrCode,
    Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
export default function AdminSettings() {
    const { settings, updateSettings, refreshSettings } = useSettings();
    const [formData, setFormData] = useState({
        appName: '',
        restaurantName: '',
        phone: '',
        address: '',
        gstNo: '',
        serviceMode: 'TABLE_SERVICE',
        paymentMode: 'BOTH',
        themeColor: 'emerald',
        logoUrl: '/logo.svg',
        cgstRate: 2.5,
        sgstRate: 2.5
    });
    const [logoUploading, setLogoUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
        if (settings) {
            setFormData({
                appName: settings.app_name || settings.restaurant_name || 'InnBite',
                restaurantName: settings.restaurant_name || 'InnBite Restaurant',
                phone: settings.phone || settings.contact_phone || '',
                address: settings.address || '',
                gstNo: settings.gst_no || settings.tax_id || '',
                serviceMode: settings.service_mode || 'TABLE_SERVICE',
                paymentMode: settings.payment_mode || 'BOTH',
                themeColor: settings.theme_color || 'emerald',
                logoUrl: settings.logo_url || '/logo.svg',
                cgstRate: settings.cgst_rate !== undefined ? settings.cgst_rate : 2.5,
                sgstRate: settings.sgst_rate !== undefined ? settings.sgst_rate : 2.5
            });
        }
    }, [settings]);
    const handleLogoFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5 MB limit. Please select a logo image under 5 MB.');
            e.target.value = '';
            return;
        }
        setLogoUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const dataUrl = reader.result;
                const uploadedUrl = await processAndUploadImage(dataUrl, 'logos');
                setFormData(prev => ({ ...prev, logoUrl: uploadedUrl }));
                toast.success('Logo processed & updated!');
            } catch (err) {
                console.error('Logo upload error:', err);
                toast.error('Failed to process logo image');
            } finally {
                setLogoUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                app_name: formData.appName,
                restaurant_name: formData.restaurantName,
                phone: formData.phone,
                contact_phone: formData.phone,
                address: formData.address,
                gst_no: formData.gstNo,
                tax_id: formData.gstNo,
                service_mode: formData.serviceMode,
                payment_mode: formData.paymentMode,
                theme_color: formData.themeColor,
                logo_url: formData.logoUrl,
                cgst_rate: Number(formData.cgstRate) || 0,
                sgst_rate: Number(formData.sgstRate) || 0
            };
            await updateSettings(payload);
            toast.success('Restaurant Settings & Theme updated successfully!');
        } catch (err) {
            console.error('Update settings error:', err);
            toast.error(err.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className="space-y-6 text-slate-900 font-sans max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Restaurant & App Branding <Sliders className="w-6 h-6 text-emerald-600" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Configure app logo, brand name, store details, theme palette, and order modes</p>
                </div>
                <button
                    onClick={refreshSettings}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload Settings</span>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Logo & App Branding */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Store className="w-5 h-5 text-emerald-600" /> Logo & Brand Identity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Logo Preview & Upload */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                            <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center justify-center relative overflow-hidden group">
                                <img
                                    src={formData.logoUrl || '/logo.svg'}
                                    alt="Logo Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                                {logoUploading && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold">
                                        Converting...
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-[#114536] hover:bg-[#0c382b] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Change Logo (WebP)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoFileChange}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, SVG or WebP. Auto-converts to WebP.</span>
                        </div>
                        {/* Name Inputs */}
                        <div className="md:col-span-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Application / Brand Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. InnBite, Haree Sweets"
                                    value={formData.appName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Displayed in browser tab, navigation bars, and customer header.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Full Restaurant Business Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Haree Restaurant & Cafe"
                                    value={formData.restaurantName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Printed at the top of 80mm thermal bills and invoices.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 2. Color Theme Selector */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Palette className="w-5 h-5 text-emerald-600" /> Color Theme & Palette
                    </h2>
                    <p className="text-xs text-slate-500">Choose a primary theme accent for customer menu cards, navigation bars, and admin portal styling.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {Object.entries(THEME_PRESETS).map(([key, theme]) => {
                            const isSelected = formData.themeColor === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, themeColor: key }))}
                                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-900'}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                                            style={{ backgroundColor: theme.colorHex }}
                                        />
                                        <span className="text-xs font-bold">{theme.name}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* 3. Address & Tax Information */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <FileText className="w-5 h-5 text-emerald-600" /> Contact & Billing Receipt Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Contact Phone
                            </label>
                            <input
                                type="text"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                GSTIN / Tax ID
                            </label>
                            <input
                                type="text"
                                placeholder="33AAAAA0000A1Z5"
                                value={formData.gstNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Physical Address
                            </label>
                            <input
                                type="text"
                                placeholder="123 Main Street, City"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                CGST Rate (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="50"
                                placeholder="2.5"
                                value={formData.cgstRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, cgstRate: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Default 2.5% for 5% GST</span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                SGST Rate (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="50"
                                placeholder="2.5"
                                value={formData.sgstRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, sgstRate: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Default 2.5% for 5% GST</span>
                        </div>
                    </div>
                </div>
                {/* 4. Service & Payment Configuration */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <CreditCard className="w-5 h-5 text-emerald-600" /> Service & Payment Modes
                    </h2>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Service Mode Configuration
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            {/* Option 1: TABLE SERVICE */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, serviceMode: 'TABLE_SERVICE' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    (formData.serviceMode || 'TABLE_SERVICE') === 'TABLE_SERVICE'
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                                        <Utensils className="w-5 h-5" />
                                    </div>
                                    {(formData.serviceMode || 'TABLE_SERVICE') === 'TABLE_SERVICE' && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Table Service (Dine-In)</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Orders tied to table QR codes. Waiter & Kitchen live tracking enabled.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 w-fit">
                                    Dine-In Table QR
                                </span>
                            </div>
                            {/* Option 2: SELF SERVICE / COUNTER */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, serviceMode: 'SELF_SERVICE' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    formData.serviceMode === 'SELF_SERVICE'
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    {formData.serviceMode === 'SELF_SERVICE' && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Counter Self-Service</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Express orders placed directly at counter without table assignment.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 w-fit">
                                    Takeaway / Counter
                                </span>
                            </div>
                            {/* Option 3: BOTH / HYBRID */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, serviceMode: 'BOTH' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    formData.serviceMode === 'BOTH'
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                                        <QrCode className="w-5 h-5" />
                                    </div>
                                    {formData.serviceMode === 'BOTH' && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Enable Both Modes</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Supports both dine-in table QR ordering and express counter takeaway.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 w-fit">
                                    Hybrid Service
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Payment Mode Configuration
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            {/* Option 1: BOTH / HYBRID */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'BOTH' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    (formData.paymentMode || 'BOTH') === 'BOTH'
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    {(formData.paymentMode || 'BOTH') === 'BOTH' && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Enable Both Methods</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Customer chooses at checkout: Online UPI or Pay at Cash Counter.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 w-fit">
                                    Hybrid Checkout
                                </span>
                            </div>
                            {/* Option 2: ONLINE ONLY */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'ONLINE_ONLY' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    formData.paymentMode === 'ONLINE_ONLY'
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    {formData.paymentMode === 'ONLINE_ONLY' && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Online Payment Only</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Mandatory online payment via UPI/Razorpay before order goes to kitchen.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 w-fit">
                                    Razorpay Mandatory
                                </span>
                            </div>
                            {/* Option 3: PAY AT COUNTER */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'PAY_AT_COUNTER' }))}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                                    (formData.paymentMode === 'PAY_AT_COUNTER' || formData.paymentMode === 'CASH_ONLY')
                                        ? 'border-[#114536] bg-emerald-50/50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                        <Store className="w-5 h-5" />
                                    </div>
                                    {(formData.paymentMode === 'PAY_AT_COUNTER' || formData.paymentMode === 'CASH_ONLY') && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">Pay at Counter / Shop</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Orders place instantly. Customers pay cash or card directly at counter.
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 w-fit">
                                    Cash / Counter Pay
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Save Button Bar */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-[#114536] hover:bg-[#0c382b] disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving Changes...' : 'Save All Branding & Settings'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}