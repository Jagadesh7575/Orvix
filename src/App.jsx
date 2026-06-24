import React, { Component, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './hooks/useAuth';

// Eagerly load critical authentication pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load heavy native app pages for performance
const AppLayout = lazy(() => import('./components/AppLayout'));
const Home = lazy(() => import('./pages/Home'));
const ChatsList = lazy(() => import('./pages/ChatsList'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const ThemeSettings = lazy(() => import('./pages/ThemeSettings'));
const TypographySettings = lazy(() => import('./pages/TypographySettings'));
const Chat = lazy(() => import('./pages/Chat'));
const Activity = lazy(() => import('./pages/Activity'));
const Discover = lazy(() => import('./pages/Discover'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ConnectionsList = lazy(() => import('./pages/ConnectionsList'));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'));

// Lazy load web pages
const Landing = lazy(() => import('./pages/Landing'));
const ThemePreview = lazy(() => import('./pages/ThemePreview'));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center z-50 absolute inset-0">
          <div className="glass-panel p-8 rounded-3xl border border-red-500/20 max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-2 font-display">Something went wrong</h2>
            <p className="text-sm text-muted mb-6">Orvix could not load this screen.</p>
            <div className="space-y-3">
              <button onClick={() => window.location.href = '/login'} className="w-full py-3 bg-primary text-white rounded-xl font-medium shadow-glow hover:scale-105 transition-transform">Go to Login</button>
              <button onClick={() => window.location.reload()} className="w-full py-3 bg-surface border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-colors">Retry</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PremiumLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center absolute inset-0 z-50">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-glow"></div>
      <div className="absolute inset-0 w-16 h-16 rounded-full bg-primary/10 animate-pulse mix-blend-screen blur-xl"></div>
    </div>
    <div className="mt-6 text-white font-display font-bold tracking-widest uppercase text-sm animate-pulse shadow-glow">Loading Orvix...</div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PremiumLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PremiumLoader />;
  if (user) return <Navigate to="/app" replace />;
  return children;
};

const NativeRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<PremiumLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="chats" element={<ChatsList />} />
          <Route path="chat/:chatId" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/blocked-users" element={<BlockedUsers />} />
          <Route path="themes" element={<ThemeSettings />} />
          <Route path="typography" element={<TypographySettings />} />
          <Route path="activity" element={<Activity />} />
          <Route path="discover" element={<Discover />} />
          <Route path="user/:userId" element={<UserProfile />} />
          <Route path="user/:userId/connections/:type" element={<ConnectionsList />} />
        </Route>
        
        <Route path="/dashboard" element={<Navigate to="/app/home" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

const WebRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<PremiumLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/preview/:themeId" element={<ThemePreview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

import { NativeThemeProvider } from './theme/NativeThemeContext';
import { TypographyProvider } from './theme/TypographyContext';
import { ThemeProvider as WebThemeProvider } from './theme/ThemeContext';
import { App as CapacitorApp } from '@capacitor/app';
import { useLocation, useNavigate } from 'react-router-dom';
import AppInitializer from './components/AppInitializer';
import { CallProvider } from './components/calls/CallProvider';

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = ({ canGoBack }) => {
      const path = location.pathname;
      const isMainTab = ['/app/home', '/app/discover', '/app/chats', '/app/activity', '/app/profile'].includes(path);
      
      if (path === '/app/home') {
        CapacitorApp.exitApp();
        return;
      }
      
      if (isMainTab) {
        navigate('/app/home');
        return;
      }
      
      if (path.startsWith('/app/chat/')) {
        navigate(location.state?.from || '/app/chats');
        return;
      }
      
      if (path.startsWith('/app/user/')) {
        if (path.includes('/connections/')) {
          const userId = path.split('/')[3];
          navigate(`/app/user/${userId}`);
          return;
        }
        navigate(location.state?.from || '/app/discover');
        return;
      }
      
      if (path.startsWith('/app/settings') || path.startsWith('/app/themes') || path.startsWith('/app/typography')) {
        navigate('/app/profile');
        return;
      }

      if (canGoBack) {
        navigate(-1);
      } else {
        navigate('/app/home');
      }
    };

    const listener = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location]);

  return null;
};

function App() {
  const isNative = Capacitor.isNativePlatform();

  return (
    <Router>
      <BackButtonHandler />
      {isNative ? (
        <NativeThemeProvider>
          <TypographyProvider>
            <CallProvider>
              <AppInitializer>
                <NativeRoutes />
              </AppInitializer>
            </CallProvider>
          </TypographyProvider>
        </NativeThemeProvider>
      ) : (
        <WebThemeProvider>
          <WebRoutes />
        </WebThemeProvider>
      )}
    </Router>
  );
}

export default App;
