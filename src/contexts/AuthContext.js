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
        .select('id, email, password, role, name, phone, location, is_banned')
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
        phone: row.phone || '',
        location: row.location || '',
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
  const signUp = async ({ email, password, role = 'user', name = '', phone = '', location = '' }) => {
    try {
      const cleanEmail = (email || '').trim();
      // Enforce that only regular users can sign up via the public form
      const cleanRole = 'user';
      if (!cleanEmail || !password) {
        throw new Error('Email and password are required');
      }

      const finalName = name && name.trim() ? name.trim() : (cleanEmail.split('@')[0] || 'User');

      // Insert new user
      const { data, error: insErr } = await supabase
        .from('app_users')
        .insert([{ email: cleanEmail, password, role: cleanRole, name: finalName, phone, location }])
        .select('id, email, role, name, phone, location')
        .single();

      if (insErr) throw insErr;

      const userData = {
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name,
        phone: data.phone || '',
        location: data.location || '',
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
      // Build candidate payload from known fields
      let payload = {};
      if (typeof updates?.name === 'string') payload.name = updates.name.trim();
      // Email updates are disallowed from the profile UI
      if (typeof updates?.phone === 'string') payload.phone = updates.phone.trim();
      if (typeof updates?.location === 'string') payload.location = updates.location.trim();

      if (Object.keys(payload).length === 0) return { success: true };

      // Attempt update; if a column is missing in the DB, remove it and retry.
      const maxRetries = 4;
      let attempt = 0;
      let lastError = null;
      // clone to avoid mutating caller-provided object
      let currentPayload = { ...payload };

      while (attempt < maxRetries && Object.keys(currentPayload).length > 0) {
        const { error } = await supabase
          .from('app_users')
          .update(currentPayload)
          .eq('id', user.id);
        if (!error) {
          // success
          const newUser = { ...user, ...currentPayload };
          setUser(newUser);
          localStorage.setItem('raffle_user', JSON.stringify(newUser));
          // Inform caller if we dropped any keys silently
          const dropped = Object.keys(payload).filter(k => !(k in currentPayload));
          return { success: true, dropped };
        }

        lastError = error;
        // Try to parse missing column from error message
        const msg = (error.message || '').toLowerCase();
        const m = msg.match(/column\s+\"?(\w+)\"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+(\w+)\s+column/i);
        const missingCol = (m && (m[1] || m[2])) ? (m[1] || m[2]) : null;
        if (missingCol && missingCol in currentPayload) {
          // Drop the offending key and retry
          // eslint-disable-next-line no-unused-vars
          const { [missingCol]: _omit, ...rest } = currentPayload;
          currentPayload = rest;
        } else {
          // If we can't parse which column, fall back to trying fewer keys: prefer name, then email
          if ('name' in currentPayload) currentPayload = { name: currentPayload.name };
          else if ('email' in currentPayload) currentPayload = { email: currentPayload.email };
          else break;
        }
        attempt += 1;
      }

      throw new Error(lastError?.message || 'Failed to update profile');
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
