import { apiService } from './apiService';
import { secureStorage } from './secureStorage';
import { playNotificationSound } from './audio';
import { toast } from 'react-hot-toast';

export const handleOrderRealtimeUpdate = (oldOrder, newPayload) => {
    if (newPayload.status === 'SERVED' || newPayload.status === 'completed' || newPayload.status === 'CANCELLED') {
        secureStorage.removeItem('orderly_active_order');
        return null; // Signals that the active order should be cleared
    } else {
        if (newPayload.status === 'READY' && oldOrder?.status !== 'READY') {
            playNotificationSound();
            toast.success('Your order is READY!', { icon: '🎉', duration: 5000 });
        }
        const updatedOrder = { ...oldOrder, ...newPayload };
        secureStorage.setItem('orderly_active_order', updatedOrder);
        return updatedOrder;
    }
};

export const syncActiveOrderWithServer = async (orderToCheck) => {
    if (!orderToCheck || !orderToCheck.id) return null;
    
    try {
        const allOrders = await apiService.getOrders();
        const found = allOrders.find(o => o.id === orderToCheck.id || o.order_number === orderToCheck.order_number);

        if (!found || found.status === 'SERVED' || found.status === 'completed' || found.status === 'CANCELLED') {
            secureStorage.removeItem('orderly_active_order');
            return null;
        } else {
            if (found.status === 'READY' && orderToCheck.status !== 'READY') {
                playNotificationSound();
                toast.success('Your order is READY!', { icon: '🎉', duration: 5000 });
            }
            secureStorage.setItem('orderly_active_order', found);
            return found;
        }
    } catch (e) {
        console.error("Error syncing active order", e);
        return orderToCheck;
    }
};
