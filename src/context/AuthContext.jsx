import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { secureStorage } from '../utils/secureStorage';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'orderly_auth_session';

export const AuthProvider = ({ children }) => {
    const [authSession, setAuthSession] = useState(() => {
        try {
            return secureStorage.getItem(AUTH_STORAGE_KEY);
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState(false);

    const login = async ({ usernameOrEmail, password, authProvider = 'PASSWORD', googleEmail = null, targetRole = null }) => {
        setLoading(true);
        try {
            const res = await apiService.authenticateStaff({
                usernameOrEmail,
                password,
                authProvider,
                googleEmail,
                targetRole
            });

            if (res.success && res.session) {
                setAuthSession(res.session);
                secureStorage.setItem(AUTH_STORAGE_KEY, res.session);
                return { success: true, session: res.session };
            } else {
                return { success: false, error: res.error || 'Authentication failed.' };
            }
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: err.message || 'An unexpected error occurred.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setAuthSession(null);
        secureStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const isAuthenticated = !!authSession?.token;
    const userRole = authSession?.role || null;
    const user = authSession || null;

    return (
        <AuthContext.Provider
            value={{
                authSession,
                user,
                isAuthenticated,
                userRole,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
