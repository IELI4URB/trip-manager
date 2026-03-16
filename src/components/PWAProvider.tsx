'use client';

import { useEffect, useState } from 'react';
import { Download, X, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner if not already installed and not dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      if (!dismissed || dismissedTime < oneDayAgo) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    // Listen for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineIndicator(false);
      toast.success('Back online!', { icon: '🌐' });
      
      // Trigger background sync
      if (registration && 'sync' in registration) {
        (registration as any).sync.register('sync-offline-actions');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineIndicator(true);
      toast('You are offline. Changes will sync when back online.', {
        icon: '📡',
        duration: 5000,
      });
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      toast.success('App installed successfully!', { icon: '🎉' });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Set initial online state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowOfflineIndicator(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [registration]);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      setRegistration(reg);
      console.log('[PWA] Service worker registered');

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          toast.success('Changes synced!', { icon: '✅' });
        }
        if (event.data.type === 'TRIP_CACHED') {
          toast.success('Trip available offline', { icon: '📱' });
        }
      });

      // Request notification permission proactively (optional)
      if (Notification.permission === 'default') {
        // Don't ask immediately, wait for user action
      }

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setShowInstallBanner(false);
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      
      // Subscribe to push notifications
      if (registration) {
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          
          // Send subscription to server
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });
        } catch (error) {
          console.error('[PWA] Push subscription failed:', error);
        }
      }
    } else {
      toast.error('Notification permission denied');
    }
  };

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-2xl p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">Install Trip Manager</h3>
                <p className="text-sm text-primary-100 mt-1">
                  Add to your home screen for quick access and offline support
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-white text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismissInstall}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {showOfflineIndicator && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
          <button
            onClick={() => setShowOfflineIndicator(false)}
            className="ml-2 p-1 hover:bg-amber-400 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
          <div className="bg-blue-600 text-white rounded-xl shadow-xl p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Update available!</p>
                <p className="text-sm text-blue-100">Tap to refresh and get the latest version.</p>
              </div>
              <button
                onClick={handleUpdate}
                className="bg-white text-blue-600 font-medium py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Indicator (subtle) */}
      {!isOnline && !showOfflineIndicator && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-slate-800 text-slate-200 rounded-full py-1.5 px-3 flex items-center gap-2 text-xs shadow-lg">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        </div>
      )}
    </>
  );
}

// Export utility functions for use in other components
export function usePWA() {
  const cacheTrip = (tripId: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_TRIP',
        tripId
      });
    }
  };

  const clearCache = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
    }
  };

  return { cacheTrip, clearCache };
}
