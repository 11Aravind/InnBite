import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loading } = useAuth();
    const { appName } = useSettings();

    const isSuperAdminRoute = location.pathname.startsWith('/superadmin');

    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const defaultFrom = isSuperAdminRoute ? '/superadmin' : '/admin';
    const from = location.state?.from?.pathname || defaultFrom;
    const targetRole = isSuperAdminRoute ? 'SUPER_ADMIN' : 'ADMIN';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const res = await login({
            usernameOrEmail,
            password,
            authProvider: 'PASSWORD',
            targetRole
        });

        if (res.success) {
            navigate(from, { replace: true });
        } else {
            setErrorMessage(res.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#07241c] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#114536]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    {!isSuperAdminRoute && (
                        <div className="w-14 h-14 bg-[#114536] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#114536]/20">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                    )}
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        {appName} <span className="text-[#114536]">{isSuperAdminRoute ? 'Super Admin' : 'Admin'}</span> Portal
                    </h1>
                    <p className="text-slate-500 text-xs mt-1.5 font-medium">
                        {isSuperAdminRoute
                            ? 'Platform configuration & client management console'
                            : 'Enter authorized credentials to manage restaurant operations'}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>{errorMessage}</div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={isSuperAdminRoute ? "Enter username" : "admin@innbite.com"}
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#114536] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#114536] transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-[#114536] hover:bg-[#185544] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 group mt-2"
                    >
                        {loading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>
                                <span>{isSuperAdminRoute ? 'Sign In as Super Admin' : 'Sign In as Admin'}</span>
                                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

