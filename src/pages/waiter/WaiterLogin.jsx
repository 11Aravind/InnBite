import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, LogIn, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config';

export default function WaiterLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loading } = useAuth();

    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const from = location.state?.from?.pathname || '/waiter';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const res = await login({
            usernameOrEmail,
            password,
            authProvider: 'PASSWORD',
            targetRole: 'WAITER'
        });

        if (res.success) {
            navigate(from, { replace: true });
        } else {
            setErrorMessage(res.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#07241c] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#114536]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#114536] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#114536]/20">
                        <UtensilsCrossed className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        {APP_CONFIG.APP_NAME} <span className="text-[#114536]">Waiter</span> App
                    </h1>
                    <p className="text-slate-500 text-xs mt-1.5 font-medium">
                        Log in with authorized staff credentials to receive live orders
                    </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>{errorMessage}</div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Username or Staff Email
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="waiter1 or waiter@innbite.com"
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
                        className="w-full py-3.5 px-4 btn-primary text-sm shadow-md flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>
                                <span>Sign In to Waiter App</span>
                                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
