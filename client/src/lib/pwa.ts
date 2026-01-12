import { registerSW } from 'virtual:pwa-register';

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] New content available, auto-updating...');
      },
      onOfflineReady() {
        console.log('[PWA] App ready to work offline');
      },
    });
    return updateSW;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This is a placeholder VAPID public key - in production, generate your own
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrpcPBblQaw4MZu7SvTQBGWxsGNGRdQVLi5gPc4FLqx7wpIfDeU'
      ) as any,
    });

    console.log('[PWA] Push subscription successful:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Show install prompt for PWA
 */
export function setupInstallPrompt() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
  });

  return {
    showPrompt: async () => {
      if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return false;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      deferredPrompt = null;
      return outcome === 'accepted';
    },
    isAvailable: () => deferredPrompt !== null,
  };
}

