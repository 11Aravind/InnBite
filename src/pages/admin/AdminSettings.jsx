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
        logoUrl: '/logo.svg'
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
                logoUrl: settings.logo_url || '/logo.svg'
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
                logo_url: formData.logoUrl
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
                    </div>
                </div>

                {/* 4. Service & Payment Configuration */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <CreditCard className="w-5 h-5 text-emerald-600" /> Service & Payment Modes
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Service Mode
                            </label>
                            <select
                                value={formData.serviceMode}
                                onChange={(e) => setFormData(prev => ({ ...prev, serviceMode: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            >
                                <option value="TABLE_SERVICE">Table Service (Dine-In Orders)</option>
                                <option value="SELF_SERVICE">Counter Self-Service / Takeaway</option>
                                <option value="BOTH">Hybrid (Both Table Service & Self-Service)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Allowed Payment Options
                            </label>
                            <select
                                value={formData.paymentMode}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#114536]"
                            >
                                <option value="BOTH">Both (Pay at Counter / Cash & Online Razorpay)</option>
                                <option value="ONLINE_ONLY">Online Razorpay / UPI Only</option>
                                <option value="CASH_ONLY">Pay at Counter / Cash Only</option>
                            </select>
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
