import React, { useState, useEffect } from 'react';
import { useSettings, THEME_PRESETS } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import {
    Sliders,
    CreditCard,
    Store,
    Palette,
    CheckCircle2,
    Save,
    Sparkles,
    RefreshCw,
    Building2,
    Smartphone,
    ShoppingBag,
    Image as ImageIcon
} from 'lucide-react';

export default function SuperAdminDashboard() {
    const { settings, updateSettings } = useSettings();

    const [formState, setFormState] = useState({
        app_name: '',
        service_mode: 'TABLE_SERVICE',
        theme_color: 'emerald',
        is_closed: false
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormState({
                app_name: settings.app_name || settings.restaurant_name || 'InnBite',
                service_mode: settings.service_mode || 'TABLE_SERVICE',
                theme_color: settings.theme_color || 'emerald',
                is_closed: Boolean(settings.is_closed)
            });
        }
    }, [settings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings({
                restaurant_name: formState.app_name,
                app_name: formState.app_name,
                logo_url: '/logo.svg',
                service_mode: formState.service_mode,
                theme_color: formState.theme_color,
                is_closed: formState.is_closed
            });
            toast.success('Client SaaS configuration updated live!');
        } catch (err) {
            console.error('Failed to save settings:', err);
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 text-slate-900 font-sans max-w-5xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Sliders className="w-6 h-6 text-[#114536]" /> Configuration
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Master controls to onboard new clients, customize branding, and switch themes.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Application Name & Branding */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Client App Branding</h2>
                            <p className="text-xs text-slate-500">Set the brand title for this restaurant client (e.g. "InnBite", "SpiceVilla", "UrbanBites").</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Application Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formState.app_name}
                            onChange={(e) => setFormState({ ...formState, app_name: e.target.value })}
                            placeholder="e.g. InnBite, Orderly, Cafe Delight"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#114536] focus:bg-white transition-all"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">This name updates the browser document title, customer header brand title, and customer receipts instantly. Application logo defaults to /logo.svg in public folder.</p>
                    </div>
                </div>

                {/* 2. Service Mode Configuration */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Service Mode Operation</h2>
                            <p className="text-xs text-slate-500">Set if this client operates as Table Service, Self-Service, or Hybrid.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {/* Table Service */}
                        <div
                            onClick={() => setFormState({ ...formState, service_mode: 'TABLE_SERVICE' })}
                            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${formState.service_mode === 'TABLE_SERVICE'
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-slate-900">Table Service</span>
                                {formState.service_mode === 'TABLE_SERVICE' && (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Customer scans Table QR code. Orders are tied to specific table numbers.
                            </p>
                            <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded w-fit">
                                Dine-In QR
                            </span>
                        </div>

                        {/* Self Service */}
                        <div
                            onClick={() => setFormState({ ...formState, service_mode: 'SELF_SERVICE' })}
                            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${formState.service_mode === 'SELF_SERVICE'
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-slate-900">Self-Service / Takeaway</span>
                                {formState.service_mode === 'SELF_SERVICE' && (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Single common QR code for counter orders. Token order numbers generated.
                            </p>
                            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded w-fit">
                                Counter Token
                            </span>
                        </div>

                        {/* Hybrid */}
                        <div
                            onClick={() => setFormState({ ...formState, service_mode: 'HYBRID' })}
                            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${formState.service_mode === 'HYBRID'
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-slate-900">Hybrid (Both)</span>
                                {formState.service_mode === 'HYBRID' && (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Supports both Table QR scanning and Common Takeaway QR scanning seamlessly.
                            </p>
                            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded w-fit">
                                Flexible
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Visual Application Theme Changing */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                                <Palette className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Client Theme Preset</h2>
                                <p className="text-xs text-slate-500">Assign a visual theme color or enter a custom hex color to match client brand identity.</p>
                            </div>
                        </div>

                        {/* Custom Hex Color Quick Input */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                            <input
                                type="color"
                                value={formState.theme_color.startsWith('#') ? formState.theme_color : '#10b981'}
                                onChange={(e) => setFormState({ ...formState, theme_color: e.target.value })}
                                className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
                                title="Pick Custom Color"
                            />
                            <input
                                type="text"
                                placeholder="#10b981"
                                value={formState.theme_color}
                                onChange={(e) => setFormState({ ...formState, theme_color: e.target.value })}
                                className="w-28 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#114536]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                        {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                            const isSelected = formState.theme_color === key;
                            return (
                                <div
                                    key={key}
                                    onClick={() => setFormState({ ...formState, theme_color: key })}
                                    className={`cursor-pointer p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 ${isSelected
                                        ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full shadow-inner border border-white/50 flex items-center justify-center text-white font-bold text-xs"
                                        style={{ backgroundColor: preset.colorHex }}
                                    >
                                        {isSelected && <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 leading-tight">
                                        {preset.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Submit Bar */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-[#114536] hover:bg-[#185544] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#114536]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Updating Client Configuration...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Client Configuration</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
