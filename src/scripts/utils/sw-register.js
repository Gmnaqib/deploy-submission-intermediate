/**
 * Register Service Worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported in this browser');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Service Worker update found');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('✨ New Service Worker available. Refresh to update.');

                    // Optional: Show update notification to user
                    if (window.confirm('New version available! Reload to update?')) {
                        window.location.reload();
                    }
                }
            });
        });

        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Unregister Service Worker (for development/testing)
 * @returns {Promise<boolean>}
 */
export async function unregisterServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const success = await registration.unregister();
            console.log('Service Worker unregistered:', success);
            return success;
        }
        return false;
    } catch (error) {
        console.error('Failed to unregister Service Worker:', error);
        return false;
    }
}

/**
 * Get Service Worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function getServiceWorkerRegistration() {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        return registration;
    } catch (error) {
        console.error('Failed to get Service Worker registration:', error);
        return null;
    }
}
