import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const SettingsContext = createContext(null);

export const THEME_PRESETS = {
    emerald: {
        name: 'Forest Emerald',
        colorHex: '#10b981',
        primary: '#114536',
        hover: '#0c382b',
        light: '#e6f4f0',
        border: '#195947',
        sidebarBg: '#114536',
        sidebarBorder: '#195947',
        sidebarActive: '#0a2e23',
        sidebarActiveBorder: '#165644',
        sidebarHover: '#185544'
    },
    teal: {
        name: 'Ocean Teal',
        colorHex: '#14b8a6',
        primary: '#0f766e',
        hover: '#115e59',
        light: '#ccfbf1',
        border: '#0d9488',
        sidebarBg: '#114b46',
        sidebarBorder: '#14635c',
        sidebarActive: '#09332f',
        sidebarActiveBorder: '#15756d',
        sidebarHover: '#165d56'
    },
    indigo: {
        name: 'Royal Indigo',
        colorHex: '#6366f1',
        primary: '#4338ca',
        hover: '#3730a3',
        light: '#e0e7ff',
        border: '#4f46e5',
        sidebarBg: '#1e1b4b',
        sidebarBorder: '#312e81',
        sidebarActive: '#12103b',
        sidebarActiveBorder: '#3730a3',
        sidebarHover: '#2e2a72'
    },
    midnight: {
        name: 'Midnight Blue',
        colorHex: '#2563eb',
        primary: '#1d4ed8',
        hover: '#1e40af',
        light: '#dbeafe',
        border: '#2563eb',
        sidebarBg: '#0f172a',
        sidebarBorder: '#1e293b',
        sidebarActive: '#020617',
        sidebarActiveBorder: '#3b82f6',
        sidebarHover: '#1e293b'
    },
    cyan: {
        name: 'Cyber Cyan',
        colorHex: '#06b6d4',
        primary: '#0e7490',
        hover: '#155e75',
        light: '#cffafe',
        border: '#0891b2',
        sidebarBg: '#154854',
        sidebarBorder: '#185868',
        sidebarActive: '#0b2d35',
        sidebarActiveBorder: '#1b677a',
        sidebarHover: '#195362'
    },
    violet: {
        name: 'Amethyst Violet',
        colorHex: '#8b5cf6',
        primary: '#6d28d9',
        hover: '#5b21b6',
        light: '#f3e8ff',
        border: '#7c3aed',
        sidebarBg: '#2e1065',
        sidebarBorder: '#4c1d95',
        sidebarActive: '#1c0942',
        sidebarActiveBorder: '#5b21b6',
        sidebarHover: '#3b1680'
    },
    rose: {
        name: 'Ruby Rose',
        colorHex: '#f43f5e',
        primary: '#be123c',
        hover: '#9f1239',
        light: '#ffe4e6',
        border: '#e11d48',
        sidebarBg: '#4c0519',
        sidebarBorder: '#881337',
        sidebarActive: '#2e030f',
        sidebarActiveBorder: '#9f1239',
        sidebarHover: '#700926'
    },
    crimson: {
        name: 'Spice Crimson',
        colorHex: '#dc2626',
        primary: '#991b1b',
        hover: '#7f1d1d',
        light: '#fee2e2',
        border: '#b91c1c',
        sidebarBg: '#450a0a',
        sidebarBorder: '#7f1d1d',
        sidebarActive: '#2c0505',
        sidebarActiveBorder: '#991b1b',
        sidebarHover: '#5c0d0d'
    },
    amber: {
        name: 'Sunset Amber',
        colorHex: '#f59e0b',
        primary: '#b45309',
        hover: '#92400e',
        light: '#fef3c7',
        border: '#d97706',
        sidebarBg: '#451a03',
        sidebarBorder: '#78350f',
        sidebarActive: '#290f02',
        sidebarActiveBorder: '#92400e',
        sidebarHover: '#632605'
    },
    coffee: {
        name: 'Espresso Bronze',
        colorHex: '#b45309',
        primary: '#78350f',
        hover: '#451a03',
        light: '#ffedd5',
        border: '#92400e',
        sidebarBg: '#2e1005',
        sidebarBorder: '#542008',
        sidebarActive: '#1c0902',
        sidebarActiveBorder: '#78350f',
        sidebarHover: '#3d1607'
    },
    slate: {
        name: 'Dark Obsidian',
        colorHex: '#334155',
        primary: '#1e293b',
        hover: '#0f172a',
        light: '#f1f5f9',
        border: '#334155',
        sidebarBg: '#0f172a',
        sidebarBorder: '#1e293b',
        sidebarActive: '#020617',
        sidebarActiveBorder: '#334155',
        sidebarHover: '#1e293b'
    }
};

export function resolveTheme(themeKey) {
    if (THEME_PRESETS[themeKey]) {
        return THEME_PRESETS[themeKey];
    }
    if (typeof themeKey === 'string' && themeKey.startsWith('#')) {
        const hex = themeKey;
        return {
            name: 'Custom Hex Theme',
            colorHex: hex,
            primary: hex,
            hover: hex,
            light: `${hex}18`,
            border: hex,
            sidebarBg: hex,
            sidebarBorder: `${hex}dd`,
            sidebarActive: `${hex}44`,
            sidebarActiveBorder: hex,
            sidebarHover: `${hex}ee`
        };
    }
    return THEME_PRESETS.emerald;
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        restaurant_id: 'R001',
        restaurant_name: 'InnBite Restaurant',
        app_name: 'InnBite',
        service_mode: 'TABLE_SERVICE',
        payment_mode: 'BOTH',
        theme_color: 'emerald',
        logo_url: '/logo.svg',
        is_closed: false
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const data = await apiService.getRestaurantSettings();
            if (data) {
                const merged = {
                    ...data,
                    app_name: data.app_name || data.restaurant_name || 'InnBite',
                    payment_mode: data.payment_mode || 'BOTH',
                    service_mode: data.service_mode || 'TABLE_SERVICE',
                    theme_color: data.theme_color || 'emerald',
                    logo_url: data.logo_url || '/logo.svg'
                };
                setSettings(merged);
                applyThemeAndBranding(merged);
            }
        } catch (err) {
            console.error('Error loading settings in SettingsContext:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyThemeAndBranding = (currSettings) => {
        const title = currSettings.app_name || currSettings.restaurant_name || 'InnBite';
        document.title = `${title} - Smart Ordering`;

        if (currSettings.logo_url) {
            let favicon = document.querySelector("link[rel*='icon']");
            if (favicon) {
                favicon.href = currSettings.logo_url;
            }
        }

        const themeKey = currSettings.theme_color || 'emerald';
        document.documentElement.setAttribute('data-theme', themeKey);

        const preset = resolveTheme(themeKey);
        if (preset) {
            document.documentElement.style.setProperty('--color-primary', preset.primary);
            document.documentElement.style.setProperty('--color-primary-hover', preset.hover);
            document.documentElement.style.setProperty('--color-primary-light', preset.light);
            document.documentElement.style.setProperty('--color-primary-border', preset.border);

            document.documentElement.style.setProperty('--color-[#114536]', preset.primary);
            document.documentElement.style.setProperty('--color-sidebar-bg', preset.sidebarBg);
            document.documentElement.style.setProperty('--color-sidebar-border', preset.sidebarBorder);
            document.documentElement.style.setProperty('--color-sidebar-active', preset.sidebarActive);
            document.documentElement.style.setProperty('--color-sidebar-active-border', preset.sidebarActiveBorder);
            document.documentElement.style.setProperty('--color-sidebar-hover', preset.sidebarHover);
        }
    };

    useEffect(() => {
        fetchSettings();

        let subscription;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('realtime_restaurant_settings')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, () => {
                    fetchSettings();
                })
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    const updateSettings = async (newSettingsPayload) => {
        const updated = { ...settings, ...newSettingsPayload };
        setSettings(updated);
        applyThemeAndBranding(updated);
        await apiService.updateRestaurantSettings(updated);
        await fetchSettings();
    };

    const themePreset = resolveTheme(settings.theme_color);
    const appName = settings.app_name || settings.restaurant_name || 'InnBite';
    const logoUrl = settings.logo_url || '/logo.svg';

    return (
        <SettingsContext.Provider
            value={{
                settings,
                loading,
                updateSettings,
                refreshSettings: fetchSettings,
                themePreset,
                appName,
                logoUrl
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
