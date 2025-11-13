import {
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isSubscribed,
    getNotificationPermission,
    isPushNotificationSupported
} from './notification.js';

class NotificationToggle {
    constructor() {
        this._isSubscribed = false;
        this._permission = 'default';
        this._supported = isPushNotificationSupported();
    }

    async render() {
        console.log('[NotificationToggle] Rendering...');

        if (!this._supported) {
            return `
        <div class="notification-toggle">
          <button class="notification-btn" disabled title="Push notifications not supported">
            Not Supported
          </button>
        </div>
      `;
        }

        await this._updateState();

        const buttonClass = this._isSubscribed ? 'notification-btn active' : 'notification-btn';
        const buttonText = this._getButtonText();
        const isDisabled = this._permission === 'denied';

        return `
      <div class="notification-toggle">
        <button 
          id="notification-toggle-btn" 
          class="${buttonClass}"
          ${isDisabled ? 'disabled' : ''}
          title="${this._getButtonTitle()}"
        >
          ${buttonText}
        </button>
      </div>
    `;
    }

    async afterRender() {
        console.log('[NotificationToggle] After render...');

        if (!this._supported) return;

        const button = document.getElementById('notification-toggle-btn');
        if (!button) {
            console.error('[NotificationToggle] Button not found');
            return;
        }

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('[NotificationToggle] Button clicked');
            await this._handleToggle(button);
        });
    }

    async _updateState() {
        this._permission = getNotificationPermission();
        this._isSubscribed = await isSubscribed();
        console.log('[NotificationToggle] State:', {
            permission: this._permission,
            subscribed: this._isSubscribed
        });
    }

    _getButtonText() {
        if (this._permission === 'denied') {
            return '🔕 Blocked';
        }
        return this._isSubscribed ? '🔔' : '🔔';
    }

    _getButtonTitle() {
        if (this._permission === 'denied') {
            return 'Notifications blocked. Please enable in browser settings.';
        }
        return this._isSubscribed
            ? 'Click to disable notifications'
            : 'Click to enable notifications';
    }

    async _handleToggle(button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⏳ Loading...';

        try {
            await this._updateState();

            if (this._isSubscribed) {
                // Unsubscribe
                console.log('[NotificationToggle] Unsubscribing...');
                await unsubscribeFromPushNotifications();
                this._isSubscribed = false;
                button.classList.remove('active');
                button.textContent = '🔔';
                this._showToast('Notifications disabled', 'info');
            } else {
                // Subscribe
                console.log('[NotificationToggle] Subscribing...');
                await subscribeToPushNotifications();
                this._isSubscribed = true;
                button.classList.add('active');
                button.textContent = '🔔';
                this._showToast('🔔 Notifications enabled!', 'success');
            }
        } catch (error) {
            console.error('[NotificationToggle] Toggle failed:', error);
            button.textContent = originalText;

            let errorMessage = 'Failed to update notification settings';
            if (error.message.includes('denied')) {
                errorMessage = 'Notification permission denied';
            } else if (error.message.includes('not supported')) {
                errorMessage = 'Push notifications not supported';
            }

            this._showToast(`${errorMessage}`, 'error');
        } finally {
            button.disabled = this._permission === 'denied';
        }
    }

    _showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export default NotificationToggle;
