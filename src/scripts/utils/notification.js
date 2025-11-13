import CONFIG from '../config.js';
import { getServiceWorkerRegistration } from './sw-register.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
    console.log('[Notification] Starting push subscription...');

    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported in this browser');
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission denied');
    }

    try {
        // Get service worker registration
        const registration = await getServiceWorkerRegistration();
        if (!registration) {
            throw new Error('Service Worker not registered');
        }

        console.log('[Notification] Service Worker ready, subscribing...');

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('[Notification] Push subscription successful:', subscription);

        // Send subscription to server
        await sendSubscriptionToServer(subscription);

        return subscription;
    } catch (error) {
        console.error('[Notification] Subscribe failed:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
    console.log('[Notification] Unsubscribing from push...');

    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported');
    }

    try {
        const registration = await getServiceWorkerRegistration();
        if (!registration) {
            throw new Error('Service Worker not registered');
        }

        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            console.log('[Notification] No active subscription found');
            return true;
        }

        // Remove subscription from server first
        await removeSubscriptionFromServer(subscription);

        // Unsubscribe
        const success = await subscription.unsubscribe();
        console.log('[Notification] Unsubscribe successful:', success);

        return success;
    } catch (error) {
        console.error('[Notification] Unsubscribe failed:', error);
        throw error;
    }
}

/**
 * Check if user is currently subscribed
 */
export async function isSubscribed() {
    if (!isPushNotificationSupported()) {
        return false;
    }

    try {
        const registration = await getServiceWorkerRegistration();
        if (!registration) {
            return false;
        }

        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch (error) {
        console.error('[Notification] Failed to check subscription:', error);
        return false;
    }
}

/**
 * Get current subscription
 */
export async function getSubscription() {
    if (!isPushNotificationSupported()) {
        return null;
    }

    try {
        const registration = await getServiceWorkerRegistration();
        if (!registration) {
            return null;
        }

        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('[Notification] Failed to get subscription:', error);
        return null;
    }
}

/**
 * Send subscription to server
 */
async function sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!token) {
        console.warn('[Notification] No auth token, skipping server sync');
        return;
    }

    try {
        const subscriptionJSON = subscription.toJSON();

        // Format sesuai API Dicoding Story Notification
        const requestBody = {
            endpoint: subscriptionJSON.endpoint,
            keys: {
                p256dh: subscriptionJSON.keys.p256dh,
                auth: subscriptionJSON.keys.auth
            }
        };

        console.log('[Notification] Sending subscription to server:', requestBody);

        const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            console.warn('[Notification] Server subscription failed:', result);
            throw new Error(result.message || 'Failed to subscribe to server');
        } else {
            console.log('[Notification] Subscription sent to server successfully:', result);
        }
    } catch (error) {
        console.error('[Notification] Failed to send subscription to server:', error);
        throw error; // Throw error agar user tahu kalau gagal
    }
}

/**
 * Remove subscription from server
 */
async function removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!token) {
        console.warn('[Notification] No auth token, skipping server sync');
        return;
    }

    try {
        const subscriptionJSON = subscription.toJSON();

        // Format sesuai API Dicoding Story Notification
        const requestBody = {
            endpoint: subscriptionJSON.endpoint
        };

        console.log('[Notification] Removing subscription from server:', requestBody);

        const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            console.warn('[Notification] Server unsubscription failed:', result);
        } else {
            console.log('[Notification] Subscription removed from server:', result);
        }
    } catch (error) {
        console.warn('[Notification] Failed to remove subscription from server:', error);
    }
}

/**
 * Show a test notification
 */
export async function showTestNotification() {
    if (getNotificationPermission() !== 'granted') {
        throw new Error('Notification permission not granted');
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
        throw new Error('Service Worker not registered');
    }

    await registration.showNotification('Test Notification', {
        body: 'This is a test notification from Story App',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    });
}
