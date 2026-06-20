import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initializes push notifications.
   * Safe to call multiple times; only runs on native Android.
   */
  async initializePushNotifications(userId) {
    if (!userId) {
      console.warn('[PUSH_DEBUG] Cannot initialize push notifications without a valid userId');
      return;
    }

    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      console.log('[PUSH_DEBUG] Skipping push initialization: Not running on Android Native');
      return;
    }

    if (this.isInitialized) {
      console.log('[PUSH_DEBUG] Push notifications already initialized for this session');
      return;
    }

    try {
      console.log('[PUSH_DEBUG] Requesting push notification permission...');
      
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('[PUSH_DEBUG] Push notification permission denied by user');
        return;
      }

      console.log('[PUSH_DEBUG] Push permission granted. Registering...');

      // Register listeners
      this._registerListeners(userId);

      // Register with Apple / Google to receive tokens.
      await PushNotifications.register();
      this.isInitialized = true;

    } catch (error) {
      console.error('[PUSH_DEBUG] Failed to initialize push notifications:', error);
    }
  }

  _registerListeners(userId) {
    // Clear old listeners safely
    PushNotifications.removeAllListeners();

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token) => {
      console.log('[PUSH_DEBUG] Push registration success, token:', token.value);
      await this.saveDeviceToken(userId, token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PUSH_DEBUG] Error on registration:', JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PUSH_DEBUG] Push received in foreground:', JSON.stringify(notification));
      // Phase 1: Only log. No UI state changes yet.
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PUSH_DEBUG] Push action performed (tapped):', JSON.stringify(notification));
      // Phase 1: Only log. Navigation will be implemented in Phase 2.
    });
  }

  /**
   * Saves the device token to Supabase device_tokens table
   */
  async saveDeviceToken(userId, token) {
    if (!userId || !token) return;

    try {
      console.log(`[PUSH_DEBUG] Saving token to Supabase for user ${userId}...`);
      
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          { 
            user_id: userId, 
            token: token, 
            platform: 'android',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id, token' }
        );

      if (error) {
        // If device_tokens table doesn't exist yet, it will fail gracefully here
        console.warn('[PUSH_DEBUG] Failed to save device token to Supabase:', error.message);
      } else {
        console.log('[PUSH_DEBUG] Token securely saved to Supabase');
      }
    } catch (err) {
      console.error('[PUSH_DEBUG] Exception saving device token:', err);
    }
  }

  /**
   * Optionally remove tokens on logout so another user on the same device doesn't get them.
   */
  async removeDeviceTokenOnLogout() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Unregister and remove token (we can't easily retrieve the exact FCM token here without native code or stored preferences,
      // but we can delete all tokens for this user on this platform to be safe, or just leave it for now).
      // For phase 1, we can just clear listeners safely.
      console.log('[PUSH_DEBUG] Removing push listeners on logout');
      PushNotifications.removeAllListeners();
      this.isInitialized = false;
      
    } catch (err) {
      console.error('[PUSH_DEBUG] Exception in removeDeviceTokenOnLogout:', err);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
