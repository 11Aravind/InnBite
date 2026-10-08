import { apiService } from './apiService';
import { secureStorage } from './secureStorage';
import { playNotificationSound } from './sound';
import { toast } from 'react-hot-toast';

const ACTIVE_ORDERS_KEY = 'orderly_active_orders';
const ACTIVE_ORDER_SINGLE_KEY = 'orderly_active_order';

export const getActiveOrdersFromStorage = () => {
    try {
        const storedList = secureStorage.getItem(ACTIVE_ORDERS_KEY);
        if (Array.isArray(storedList) && storedList.length > 0) {
            return storedList;
        }
        const singleStored = secureStorage.getItem(ACTIVE_ORDER_SINGLE_KEY);
        if (singleStored && singleStored.id) {
            return [singleStored];
        }
    } catch (e) {
        console.error('Error reading active orders from storage:', e);
    }
    return [];
};

export const saveActiveOrdersToStorage = (orders) => {
    try {
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            secureStorage.removeItem(ACTIVE_ORDERS_KEY);
            secureStorage.removeItem(ACTIVE_ORDER_SINGLE_KEY);
        } else {
            secureStorage.setItem(ACTIVE_ORDERS_KEY, orders);
            secureStorage.setItem(ACTIVE_ORDER_SINGLE_KEY, orders[orders.length - 1]); // Most recent as fallback
        }
    } catch (e) {
        console.error('Error saving active orders to storage:', e);
    }
};

export const addActiveOrderToStorage = (newOrder) => {
    if (!newOrder || !newOrder.id) return;
    const currentOrders = getActiveOrdersFromStorage();
    const existingIndex = currentOrders.findIndex(o => o.id === newOrder.id || o.order_number === newOrder.order_number);
    if (existingIndex >= 0) {
        currentOrders[existingIndex] = newOrder;
    } else {
        currentOrders.push(newOrder);
    }
    saveActiveOrdersToStorage(currentOrders);
    return currentOrders;
};

export const syncActiveOrdersWithServer = async ({ sessionId = null, tableNumber = null, knownOrders = null } = {}) => {
    try {
        const currentStored = knownOrders || getActiveOrdersFromStorage();
        const storedIds = new Set(currentStored.map(o => o.id).filter(Boolean));
        const storedOrderNumbers = new Set(currentStored.map(o => String(o.order_number)).filter(Boolean));

        const allOrders = await apiService.getOrders();
        
        // Filter non-completed active orders
        const activeMatches = (allOrders || []).filter(o => {
            const isCompleted = o.status === 'SERVED' || o.status === 'completed' || o.status === 'CANCELLED';
            if (isCompleted) return false;

            const matchesStoredId = storedIds.has(o.id) || storedOrderNumbers.has(String(o.order_number));
            const matchesSession = sessionId && o.session_id === sessionId;
            const matchesTable = tableNumber && String(o.table_number) === String(tableNumber);

            return matchesStoredId || matchesSession || matchesTable;
        });

        // Check for new READY status notifications
        activeMatches.forEach(newOrder => {
            const prev = currentStored.find(o => o.id === newOrder.id);
            if (newOrder.status === 'READY' && (!prev || prev.status !== 'READY')) {
                playNotificationSound();
                toast.success(`Order #${newOrder.order_number || newOrder.id} is READY!`, { icon: '🎉', duration: 5000 });
            }
        });

        saveActiveOrdersToStorage(activeMatches);
        return activeMatches;
    } catch (e) {
        console.error('Error syncing active orders:', e);
        return knownOrders || getActiveOrdersFromStorage();
    }
};

export const handleOrderRealtimeUpdate = (existingOrdersList, newPayload) => {
    const list = Array.isArray(existingOrdersList) ? [...existingOrdersList] : existingOrdersList ? [existingOrdersList] : [];
    if (!newPayload || !newPayload.id) return list;

    const index = list.findIndex(o => o.id === newPayload.id);
    const isCompleted = newPayload.status === 'SERVED' || newPayload.status === 'completed' || newPayload.status === 'CANCELLED';

    if (isCompleted) {
        if (index >= 0) {
            list.splice(index, 1);
        }
    } else {
        const oldOrder = index >= 0 ? list[index] : null;
        if (newPayload.status === 'READY' && oldOrder?.status !== 'READY') {
            playNotificationSound();
            toast.success(`Order #${newPayload.order_number || newPayload.id} is READY!`, { icon: '🎉', duration: 5000 });
        }

        const updated = oldOrder ? { ...oldOrder, ...newPayload } : newPayload;
        if (index >= 0) {
            list[index] = updated;
        } else {
            list.push(updated);
        }
    }

    saveActiveOrdersToStorage(list);
    return list;
};

// Backward compatibility helper
export const syncActiveOrderWithServer = async (orderToCheck) => {
    if (!orderToCheck || !orderToCheck.id) return null;
    const activeList = await syncActiveOrdersWithServer({ knownOrders: [orderToCheck] });
    return activeList.find(o => o.id === orderToCheck.id) || null;
};

