import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/UI/ToastContainer';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import UserLanding from './components/User/UserLanding';
import JoinRaffles from './components/User/JoinRaffles';
import PastResults from './components/User/PastResults';
import UserProfile from './components/User/UserProfile';
import AgentLayout from './components/Agent/AgentLayout';
import UserLayout from './components/User/UserLayout';
import './index.css';
import CopyReferral from './components/Shared/CopyReferral';
import PopupAds from './components/PopupAds';

function PopupAdsGate() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const prevAuthRef = React.useRef(false);
  const prevRoleRef = React.useRef(undefined);
  useEffect(() => {
    // Show once per login event into a user account (not agent)
    const isUserLogin = isAuthenticated && user?.role === 'user';
    const wasAuthed = prevAuthRef.current;
    const wasRole = prevRoleRef.current;
    if (isUserLogin && (!wasAuthed || wasRole !== 'user')) {
      setOpen(true);
    }
    prevAuthRef.current = isAuthenticated;
    prevRoleRef.current = user?.role;
  }, [isAuthenticated, user?.role]);
  return <PopupAds open={open} onClose={() => setOpen(false)} />;
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();

  // Wait for auth state to hydrate from localStorage on refresh
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mr-3" />
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Copy referral helper (public) */}
      <Route path="/copy-ref" element={<CopyReferral />} />
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* User routes */}
      <Route
        path="/user"
        element={
          <ProtectedRoute requiredRole="user">
            <UserLayout>
              <UserLanding />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/join"
        element={
          <ProtectedRoute requiredRole="user">
            <UserLayout>
              <JoinRaffles />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/results"
        element={
          <ProtectedRoute requiredRole="user">
            <UserLayout>
              <PastResults />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute requiredRole="user">
            <UserLayout>
              <UserProfile />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* Agent routes */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute requiredRole="agent">
            <AgentLayout />
          </ProtectedRoute>
        }
      />

      {/* Default redirect based on auth */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={user.role === 'agent' ? '/agent' : '/user'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
                <AppRoutes />
                <ToastContainer />
                <PopupAdsGate />
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
