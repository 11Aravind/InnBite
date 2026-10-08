import { playOrderChimeSound } from './sound';

let swRegistration = null;

// Register Service Worker for Background & Lock Screen Notifications
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            swRegistration = reg;
            console.log('[SW] Service worker registered successfully with scope:', reg.scope);
            return reg;
        } catch (err) {
            console.warn('[SW] Service worker registration failed:', err);
        }
    }
    return null;
};

// Request Notification Permission from User
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('System notifications are not supported in this browser.');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
};

// Get current permission status
export const getNotificationPermissionStatus = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

// Send System Native Lock Screen & Pop-up Notification
export const sendSystemNotification = async ({
    title,
    body,
    tag = 'new-order',
    url = '/kitchen',
    playSound = true
}) => {
    // 1. Play chime audio alert
    if (playSound) {
        try {
            playOrderChimeSound();
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }

    // 2. Trigger vibration on mobile device (pattern: beep-beep-BEEP)
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate([200, 100, 200, 100, 300]);
        } catch (e) {
            // Ignore vibration error on unsupported platforms
        }
    }

    // 3. Show native system notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: tag,
            renotify: true,
            requireInteraction: true, // Keeps alert visible on lock screen until user interacts
            data: { url: url },
            vibrate: [200, 100, 200, 100, 300]
        };

        try {
            // Try Service Worker registration notification first (best for lock screen & background)
            if (!swRegistration && 'serviceWorker' in navigator) {
                swRegistration = await navigator.serviceWorker.ready.catch(() => null);
            }

            if (swRegistration && 'showNotification' in swRegistration) {
                await swRegistration.showNotification(title, options);
            } else {
                const notif = new Notification(title, options);
                notif.onclick = () => {
                    window.focus();
                    if (url) window.location.href = url;
                    notif.close();
                };
            }
        } catch (err) {
            console.warn('Failed to display system notification:', err);
        }
    }
};
