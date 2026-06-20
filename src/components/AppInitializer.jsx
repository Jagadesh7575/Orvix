import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNativeTheme } from '../theme/NativeThemeContext';
import OrvixSplashScreen from './OrvixSplashScreen';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

const MINIMUM_SPLASH_TIME = 1200; // 1.2 seconds

const AppInitializer = ({ children }) => {
  const { loading: authLoading } = useAuth();
  const nativeThemeContext = useNativeTheme();
  const loadingTheme = nativeThemeContext ? nativeThemeContext.loadingTheme : false;
  
  const [splashVisible, setSplashVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Hide the native Capacitor splash screen quickly so we can show our React splash
    // which has smooth animations.
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(console.warn);
    }
  }, []);

  useEffect(() => {
    // Enforce minimum splash time
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MINIMUM_SPLASH_TIME);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Determine when we are fully ready
    // We are ready when auth is done loading, theme is done loading, AND minimum time has elapsed.
    if (!authLoading && !loadingTheme && minTimeElapsed) {
      setSplashVisible(false);
    }
  }, [authLoading, loadingTheme, minTimeElapsed]);

  return (
    <>
      <OrvixSplashScreen isVisible={splashVisible} />
      {/* We only render the children (router) once we are about to dismiss the splash.
          This prevents any Cyber Violet flash from showing in the DOM before the theme applies. */}
      {(!authLoading && !loadingTheme) ? children : null}
    </>
  );
};

export default AppInitializer;
