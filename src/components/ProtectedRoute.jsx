import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, userRole } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const loginPath = requiredRole === 'ADMIN' ? '/admin/login' : '/waiter/login';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600 text-sm mb-6">
                        You are logged in as <span className="font-semibold capitalize">{userRole?.toLowerCase()}</span>, but this page requires <span className="font-semibold uppercase">{requiredRole}</span> privileges.
                    </p>
                    <a
                        href={requiredRole === 'ADMIN' ? '/admin/login' : '/waiter/login'}
                        className="inline-block px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md"
                    >
                        Switch Account / Login as {requiredRole}
                    </a>
                </div>
            </div>
        );
    }

    return children;
};
