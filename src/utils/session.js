// Session management for customer guest ordering
// Enforces: QR, Table, Customer Session, Cart, and Order are distinct entities!
import { secureStorage } from './secureStorage';

const SESSION_KEY = 'orderly_customer_session';

const getEnvServiceMode = () => {
    return import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';
};

export const getOrCreateCustomerSession = () => {
    let session = null;
    try {
        session = secureStorage.getSessionItem(SESSION_KEY);
    } catch (e) {
        console.error('Failed to parse customer session:', e);
    }

    const defaultMode = getEnvServiceMode();

    if (!session || !session.session_id) {
        session = {
            session_id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            service_mode: defaultMode,
            table_id: defaultMode === 'SELF_SERVICE' ? null : null,
            table_number: defaultMode === 'SELF_SERVICE' ? null : null,
            active_order_id: null
        };
        saveCustomerSession(session);
    }

    return session;
};

export const saveCustomerSession = (session) => {
    try {
        secureStorage.setSessionItem(SESSION_KEY, session);
    } catch (e) {
        console.error('Failed to save customer session:', e);
    }
};

export const updateCustomerSessionTable = (tableId, tableNumber, serviceMode) => {
    const session = getOrCreateCustomerSession();
    const activeMode = serviceMode || getEnvServiceMode();
    session.service_mode = activeMode;
    session.table_id = activeMode === 'SELF_SERVICE' ? null : tableId;
    session.table_number = activeMode === 'SELF_SERVICE' ? null : tableNumber;
    saveCustomerSession(session);
    return session;
};

export const updateCustomerSessionMode = (serviceMode) => {
    const session = getOrCreateCustomerSession();
    session.service_mode = serviceMode;
    if (serviceMode === 'SELF_SERVICE') {
        session.table_id = null;
        session.table_number = null;
    }
    saveCustomerSession(session);
    return session;
};

export const setActiveOrderInSession = (orderId) => {
    const session = getOrCreateCustomerSession();
    session.active_order_id = orderId;
    saveCustomerSession(session);
};

export const clearCustomerSession = () => {
    try {
        secureStorage.removeSessionItem(SESSION_KEY);
    } catch (e) {
        console.error('Failed to clear customer session:', e);
    }
};
