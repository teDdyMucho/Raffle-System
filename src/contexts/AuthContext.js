import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Note: We now use Supabase table `public.app_users` for auth

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('raffle_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, selectedRole) => {
    try {
      const cleanEmail = (email || '').trim();
      if (!cleanEmail || !password) {
        throw new Error('Email and password are required');
      }

      // Fetch user by email (citext supports case-insensitive eq)
      const { data: row, error: qErr } = await supabase
        .from('app_users')
        .select('id, email, password, role, name, is_banned')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (qErr) throw qErr;
      if (!row) throw new Error('Invalid credentials');
      if (row.is_banned) throw new Error('Your account has been banned');
      if (row.password !== password) throw new Error('Invalid credentials');

      const userData = {
        id: row.id,
        email: row.email,
        role: row.role,
        name: row.name,
      };

      // Store session
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('raffle_user', JSON.stringify(userData));
      return { success: true, role: userData.role };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Provide signup to align with SignUp.js usage
  const signUp = async ({ email, password, role = 'user', name = '' }) => {
    try {
      const cleanEmail = (email || '').trim();
      const cleanRole = (role === 'agent' ? 'agent' : 'user');
      if (!cleanEmail || !password) {
        throw new Error('Email and password are required');
      }

      const finalName = name && name.trim() ? name.trim() : (cleanEmail.split('@')[0] || 'User');

      // Insert new user
      const { data, error: insErr } = await supabase
        .from('app_users')
        .insert([{ email: cleanEmail, password, role: cleanRole, name: finalName }])
        .select('id, email, role, name')
        .single();

      if (insErr) throw insErr;

      const userData = {
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name,
      };

      // Auto sign-in after signup
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('raffle_user', JSON.stringify(userData));

      return { success: true, role: userData.role };
    } catch (error) {
      // Handle unique email violation gracefully
      const msg = /duplicate key value/i.test(error.message) ? 'Email is already registered' : (error.message || 'Failed to sign up');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('raffle_user');
  };

  // Update minimal profile fields in Supabase and local session
  const updateProfile = async (updates) => {
    try {
      if (!user?.id) throw new Error('No authenticated user');
      const payload = {};
      if (typeof updates?.name === 'string') payload.name = updates.name.trim();
      // Only proceed if there is something to update
      if (Object.keys(payload).length === 0) return { success: true };

      const { error } = await supabase
        .from('app_users')
        .update(payload)
        .eq('id', user.id);
      if (error) throw error;

      // Update local state and storage
      const newUser = { ...user, ...payload };
      setUser(newUser);
      localStorage.setItem('raffle_user', JSON.stringify(newUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    signUp,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
