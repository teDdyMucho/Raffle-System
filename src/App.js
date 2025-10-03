import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/UI/ToastContainer';
import Login from './components/Auth/Login';
import UserLanding from './components/User/UserLanding';
import JoinRaffles from './components/User/JoinRaffles';
import PastResults from './components/User/PastResults';
import UserProfile from './components/User/UserProfile';
import AgentLayout from './components/Agent/AgentLayout';
import UserLayout from './components/User/UserLayout';
import './index.css';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuth();
  
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
      {/* Public */}
      <Route path="/login" element={<Login />} />

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
          isAuthenticated
            ? <Navigate to={user.role === 'agent' ? '/agent' : '/user'} replace />
            : <Navigate to="/login" replace />
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
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
