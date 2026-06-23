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

      // Required Fix 2 - Android Notification Channel
      await this.createNotificationChannel();

      // Register listeners
      this._registerListeners(userId);

      // Register with Apple / Google to receive tokens.
      await PushNotifications.register();
      this.isInitialized = true;

    } catch (error) {
      console.error('[PUSH_DEBUG] Failed to initialize push notifications:', error);
    }
  }

  async createNotificationChannel() {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      await PushNotifications.createChannel({
        id: "orvix_messages",
        name: "Orvix Messages",
        description: "Message notifications",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true
      });
      console.log('[PUSH_DEBUG] Channel orvix_messages created');
    } catch (e) {
      console.error('[PUSH_DEBUG] Error creating notification channel:', e);
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
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log("REAL_PUSH_RECEIVED", JSON.stringify(notification));
      
      // Required Fix 3 - Foreground Notification Handling
      try {
        const payloadData = notification.data || {};
        const parsedTitle = notification.title || payloadData.title || "New Message";
        const parsedBody = notification.body || payloadData.body || "You received a new message";
        
        // Don't show notification if we are already in that specific chat
        const currentPath = window.location.pathname;
        if (payloadData.chat_id && currentPath.includes(`/app/chat/${payloadData.chat_id}`)) {
          console.log('[PUSH_DEBUG] Already in chat, skipping local notification');
          return;
        }

        // Dispatch custom event to trigger InAppNotificationBanner component
        window.dispatchEvent(new CustomEvent('in-app-notification', {
          detail: {
            title: parsedTitle,
            body: parsedBody,
            data: payloadData
          }
        }));
        
        console.log(JSON.stringify({
          real_push_received: true,
          banner_dispatched: true,
          title: parsedTitle,
          body: parsedBody,
          chat_id: payloadData.chat_id,
          sender_id: payloadData.sender_id
        }, null, 2));
        
      } catch (e) {
        console.error('[PUSH_DEBUG] Failed to dispatch in-app banner event:', e);
      }
    });

    // Method called when tapping on a push notification (from background)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PUSH_DEBUG] Push action performed (tapped):', JSON.stringify(notification));
      this.handleNotificationTap(notification.notification.data);
    });
  }

  handleNotificationTap(data) {
    if (!data) return;
    if (data.chat_id) {
      window.location.href = `/app/chat/${data.chat_id}`;
    }
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
            device_id: 'default', // Using 'default' as requested
            is_active: true,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id, platform, device_id' }
        );

      if (error) {
        console.warn('[PUSH_DEBUG] Failed to save device token to Supabase:', error.message);
      } else {
        console.log('[PUSH_DEBUG] Token securely saved to Supabase');
      }
    } catch (err) {
      console.error('[PUSH_DEBUG] Exception saving device token:', err);
    }
  }

  /**
   * Optionally remove tokens on logout
   */
  async removeDeviceTokenOnLogout() {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      console.log('[PUSH_DEBUG] Removing push listeners on logout');
      PushNotifications.removeAllListeners();
      this.isInitialized = false;
      
    } catch (err) {
      console.error('[PUSH_DEBUG] Exception in removeDeviceTokenOnLogout:', err);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
