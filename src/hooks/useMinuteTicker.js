import { useState, useEffect } from 'react';

export function useMinuteTicker() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTick(prev => prev + 1);
    };

    // Update every minute
    const interval = setInterval(handleUpdate, 60 * 1000);

    // Update on visibility change (app resume from background)
    const handleVisibility = () => {
      if (!document.hidden) {
        handleUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Also try to listen to Capacitor App state if available
    let appStateListener = null;
    const setupCapacitorListener = async () => {
      try {
        const { App: CapacitorApp } = await import("@capacitor/app");
        appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            handleUpdate();
          }
        });
      } catch (err) {
        // Not in capacitor or plugin missing
      }
    };
    setupCapacitorListener();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (appStateListener?.remove) {
        appStateListener.remove();
      }
    };
  }, []);

  return tick;
}
