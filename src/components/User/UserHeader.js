import React, { useEffect, useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import appLogo from '../../images/allen (1).png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import {
  Menu,
  X,
  Sun,
  Moon,
  Ticket,
  Trophy,
  User as UserIcon,
  Home,
  LogOut,
  Bell,
  Flame,
  Timer,
  Sparkles,
  Search as SearchIcon
} from 'lucide-react';

const UserHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [showWinModal, setShowWinModal] = useState(false);
  const [myWins, setMyWins] = useState([]);

  const nav = [
    { to: '/user', label: 'Home', icon: Home },
    { to: '/user/join', label: 'Join Raffles', icon: Ticket },
    { to: '/user/results', label: 'Results', icon: Trophy },
    { to: '/user/profile', label: 'Profile', icon: UserIcon },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const term = e.target.elements.search?.value?.trim();
    if (term) {
      navigate(`/user/results?q=${encodeURIComponent(term)}`);
      setOpen(false);
    }
  };

  // On login (session present) show a winners popup if user has wins
  useEffect(() => {
    const run = async () => {
      try {
        if (!user?.email) return;
        // prevent showing multiple times per session
        const shownKey = `wins_modal_shown_${user.email}`;
        if (sessionStorage.getItem(shownKey)) return;

        const { data, error } = await supabase
          .from('winners')
          .select('*')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        if (Array.isArray(data) && data.length > 0) {
          setMyWins(data);
          setShowWinModal(true);
          sessionStorage.setItem(shownKey, '1');
        }
      } catch (_) {
        // silent
      }
    };
    run();
  }, [user?.email]);

  return (
    <header className="bg-magnolia-50 dark:bg-blackswarm-800 border-b border-magnolia-200 dark:border-blackswarm-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left - Logo */}
          <Link to="/user" className="flex items-center">
            <ImageWithFallback src={appLogo} alt="Raffle Haven" className="h-12 w-12 mr-3 rounded" />
            <span className="text-lg font-bold text-blackswarm-900 dark:text-magnolia-50">Raffle Haven</span>
          </Link>

          {/* Center - Nav (desktop) */}
          <nav className="hidden md:flex items-center space-x-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    isActive(item.to)
                      ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                      : 'text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right - actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded-full bg-bonfire-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-magnolia-50 dark:bg-blackswarm-800 rounded-md shadow-lg border border-magnolia-200 dark:border-blackswarm-700">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-magnolia-200 dark:border-blackswarm-700">
                    <span className="text-sm font-medium text-blackswarm-900 dark:text-magnolia-50">Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-bonfire-600 dark:text-bonfire-400 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-sm text-blackswarm-600 dark:text-magnolia-400">No notifications</div>
                    )}
                    {notifications.map(n => (
                      <Link
                        key={n.id}
                        to={n.href}
                        onClick={() => { markAsRead(n.id); setNotifOpen(false); }}
                        className={`block px-4 py-3 text-sm hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 ${n.unread ? 'bg-bonfire-50/60 dark:bg-bonfire-900/10' : ''}`}
                      >
                        <p className="font-medium text-blackswarm-900 dark:text-magnolia-50">{n.title}</p>
                        <p className="text-xs text-blackswarm-600 dark:text-magnolia-400">{n.desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center ml-2 pl-2 border-l border-magnolia-200 dark:border-blackswarm-700">
              <div className="w-8 h-8 bg-gradient-to-r from-bonfire-400 to-embers-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="text-sm text-blackswarm-900 dark:text-magnolia-50 mr-3">{user?.name || 'User'}</span>
              <button onClick={handleLogout} className="text-bonfire-600 dark:text-bonfire-400 hover:underline flex items-center">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-magnolia-200 dark:border-blackswarm-700 py-2 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.to)
                      ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                      : 'text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            <div className="flex items-center justify-between px-3 pt-2 mt-2 border-t border-magnolia-200 dark:border-blackswarm-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-bonfire-400 to-embers-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="text-sm text-blackswarm-900 dark:text-magnolia-50">{user?.name || 'User'}</span>
              </div>
              <button onClick={handleLogout} className="text-bonfire-600 dark:text-bonfire-400 flex items-center">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        )}
        {/* Winners Popup Modal */}
        {showWinModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-blackswarm-800 rounded-lg shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-magnolia-200 dark:border-blackswarm-700 flex items-center justify-between">
                <span className="text-lg font-semibold text-blackswarm-900 dark:text-magnolia-50 flex items-center">
                  <Trophy className="w-5 h-5 text-bonfire-500 mr-2" />
                  You have winning entries!
                </span>
                <button
                  onClick={() => setShowWinModal(false)}
                  className="text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-auto">
                {myWins.map((w) => (
                  <div key={w.id} className="border border-magnolia-200 dark:border-blackswarm-700 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blackswarm-600 dark:text-magnolia-400">Raffle</p>
                        <p className="font-medium text-blackswarm-900 dark:text-magnolia-50">{w.raffle_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blackswarm-600 dark:text-magnolia-400">Ticket</p>
                        <p className="font-medium text-blackswarm-900 dark:text-magnolia-50">#{w.ticket_number}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-blackswarm-600 dark:text-magnolia-400">Won on {new Date(w.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-magnolia-200 dark:border-blackswarm-700 flex justify-end">
                <Link
                  to="/user/results"
                  onClick={() => setShowWinModal(false)}
                  className="btn-primary"
                >
                  Show Results
                </Link>
              </div>
            </div>
          </div>
        )}
        {/* Secondary quick-actions bar removed as requested */}
      </div>
    </header>
  );
};

export default UserHeader;
