import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

// Basic shape: { id, title, desc, href, unread, created_at }
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fallback mock notifications if remote fetch fails
  const mockSeed = useMemo(
    () => [
      {
        id: 'seed-1',
        title: 'Winner announced',
        desc: 'MacBook Air M3 raffle concluded',
        href: '/user/results',
        unread: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'seed-2',
        title: 'Raffle closing soon',
        desc: 'iPhone 15 Pro ends in 2h',
        href: '/user/join',
        unread: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'seed-3',
        title: 'New raffle added',
        desc: 'Gaming Setup Bundle now live',
        href: '/user/join',
        unread: false,
        created_at: new Date().toISOString(),
      },
    ],
    []
  );

  // Transform raffles into a notifications list
  const buildFromRaffles = useCallback((raffles = []) => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const items = [];
    raffles.forEach(r => {
      const createdAt = r.created_at ? new Date(r.created_at) : null;
      const endDate = r.end_date ? new Date(r.end_date) : null;

      // New raffle (created within last 24h)
      if (createdAt && now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000) {
        items.push({
          id: `new-${r.id}`,
          title: 'New raffle added',
          desc: r.title || 'A new raffle is now live',
          href: '/user/join',
          unread: true,
          created_at: r.created_at,
        });
      }

      // Closing soon (within next 24h and active)
      if (endDate && endDate <= in24h && (r.status === 'active' || r.status === 'paused')) {
        items.push({
          id: `soon-${r.id}`,
          title: 'Raffle closing soon',
          desc: `${r.title || 'A raffle'} ends ${endDate.toLocaleString()}`,
          href: '/user/join',
          unread: true,
          created_at: r.created_at,
        });
      }

      // Winner announced
      if (r.status === 'completed') {
        items.push({
          id: `win-${r.id}`,
          title: 'Winner announced',
          desc: r.title ? `${r.title} raffle concluded` : 'A raffle has concluded',
          href: '/user/results',
          unread: true,
          created_at: r.created_at,
        });
      }
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return items.slice(0, 50);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (qErr) throw qErr;
      const items = buildFromRaffles(data || []);
      setNotifications(items);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Notifications] Falling back to mock data from raffles:', e?.message || e);
      setNotifications(mockSeed);
      setError(e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [buildFromRaffles, mockSeed]);

  const markAsRead = useCallback(async id => {
    // Local-only read state, since notifications are derived from raffles
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    // Local-only read state
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const addLocal = useCallback(notif => {
    setNotifications(prev => [
      {
        id: notif.id || Math.random().toString(36).slice(2),
        unread: true,
        created_at: new Date().toISOString(),
        href: '/user',
        ...notif,
      },
      ...prev,
    ]);
  }, []);

  // Subscribe to realtime changes in raffles
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('realtime:raffles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raffles' }, () => {
        fetchNotifications();
      })
      .subscribe(status => {
        // eslint-disable-next-line no-console
        if (status === 'SUBSCRIBED') console.log('[Notifications] Subscribed to raffles changes');
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [fetchNotifications]);

  const value = {
    notifications,
    loading,
    error,
    unreadCount: notifications.filter(n => n.unread).length,
    markAsRead,
    markAllRead,
    addLocal,
    refresh: fetchNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
