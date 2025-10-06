import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  BarChart3, 
  Users, 
  Ticket, 
  Clock, 
  TrendingUp,
  UserPlus,
  Headphones,
  Eye,
  Megaphone,
  Calendar,
  Target,
  Activity,
  X
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  // Register participant modal state
  const [showRegister, setShowRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  // Mock data for agent dashboard
  const stats = [
    {
      title: 'Total Raffles Managed',
      value: '12',
      change: '+2 this week',
      icon: BarChart3,
      color: 'bonfire'
    },
    {
      title: 'Tickets Sold Today',
      value: '247',
      change: '+18% from yesterday',
      icon: Ticket,
      color: 'embers'
    },
    {
      title: 'Active Participants',
      value: '1,834',
      change: '+156 this month',
      icon: Users,
      color: 'bonfire'
    },
    {
      title: 'Raffles Closing Soon',
      value: '3',
      change: 'Next closes in 2h',
      icon: Clock,
      color: 'embers'
    }
  ];

  const [activeRaffles, setActiveRaffles] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const fetchActiveRaffles = async () => {
    try {
      setLoadingActive(true);
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', nowIso)
        .order('end_date', { ascending: true })
        .limit(10);
      if (error) throw error;
      const rows = (data || []).map(r => ({
        id: r.id,
        title: r.title || 'Raffle',
        endDate: r.end_date || r.ends_at || r.end || r.close_at || new Date().toISOString(),
        ticketsSold: r.tickets_sold ?? r.sold ?? 0,
        maxTickets: r.max_tickets ?? r.capacity ?? 0,
        participants: r.participants_count ?? r.participants ?? 0,
      }));
      setActiveRaffles(rows);
    } catch (e) {
      console.warn('[AgentDashboard] failed to fetch active raffles:', e?.message || e);
      setActiveRaffles([]);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchActiveRaffles();
  }, []);

  const getTimeRemaining = (endDate) => {
    const total = Date.parse(endDate) - Date.parse(currentTime);
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { total, hours, minutes, seconds };
  };

  const CountdownTimer = ({ endDate }) => {
    const timeLeft = getTimeRemaining(endDate);

    if (timeLeft.total <= 0) {
      return <span className="text-bonfire-500 font-semibold">Ended</span>;
    }

    return (
      <div className="flex space-x-1 text-sm">
        <span className="bg-bonfire-100 dark:bg-bonfire-900/30 px-2 py-1 rounded text-bonfire-700 dark:text-bonfire-300 font-medium">
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  };

  const getColorClasses = (color) => {
    const colors = {
      bonfire: {
        bg: 'bg-bonfire-100 dark:bg-bonfire-900/30',
        text: 'text-bonfire-600 dark:text-bonfire-400',
        icon: 'text-bonfire-600 dark:text-bonfire-400'
      },
      embers: {
        bg: 'bg-embers-100 dark:bg-embers-900/30',
        text: 'text-embers-600 dark:text-embers-400',
        icon: 'text-embers-600 dark:text-embers-400'
      }
    };
    return colors[color] || colors.bonfire;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name || 'Agent'}! 👋
        </h1>
        <p className="text-bonfire-100">
          Here's what's happening with your raffles today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          
          return (
            <div
              key={index}
              className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-blackswarm-600 dark:text-magnolia-400 mb-2">
                {stat.title}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Raffles Section */}
        <div className="lg:col-span-2">
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-bonfire-500" />
                Active Raffles
              </h2>
              <span className="text-sm text-blackswarm-500 dark:text-magnolia-400">
                {loadingActive ? 'Loading…' : `${activeRaffles.length} active`}
              </span>
            </div>

            <div className="space-y-4">
              {loadingActive && (
                <div className="text-center text-sm text-blackswarm-500 dark:text-magnolia-400 py-6">Loading active raffles…</div>
              )}
              {!loadingActive && activeRaffles.length === 0 && (
                <div className="text-center text-sm text-blackswarm-500 dark:text-magnolia-400 py-6">No active raffles found.</div>
              )}
              {!loadingActive && activeRaffles.map((raffle) => (
                <div
                  key={raffle.id}
                  className="border border-magnolia-200 dark:border-blackswarm-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blackswarm-900 dark:text-magnolia-50">
                      {raffle.title}
                    </h3>
                    <CountdownTimer endDate={raffle.endDate} />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blackswarm-600 dark:text-magnolia-400">
                        Tickets: {raffle.ticketsSold}/{raffle.maxTickets}
                      </span>
                      <span className="text-blackswarm-600 dark:text-magnolia-400">
                        {Math.round((raffle.ticketsSold / raffle.maxTickets) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-magnolia-200 dark:bg-blackswarm-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-bonfire-500 to-embers-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(raffle.ticketsSold / raffle.maxTickets) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-blackswarm-500 dark:text-magnolia-400">
                      <Users className="w-4 h-4 mr-1" />
                      {raffle.participants} participants
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => show(`Viewing details for: ${raffle.title}`, { type: 'info' })}
                        className="flex items-center px-3 py-1 text-xs bg-bonfire-100 dark:bg-bonfire-900/30 text-bonfire-600 dark:text-bonfire-400 rounded-md hover:bg-bonfire-200 dark:hover:bg-bonfire-900/50 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => show(`Announcement sent for: ${raffle.title}`, { type: 'success' })}
                        className="flex items-center px-3 py-1 text-xs bg-embers-100 dark:bg-embers-900/30 text-embers-600 dark:text-embers-400 rounded-md hover:bg-embers-200 dark:hover:bg-embers-900/50 transition-colors"
                      >
                        <Megaphone className="w-3 h-3 mr-1" />
                        Announce
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-bonfire-500" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => { setShowRegister(true); setRegisterError(''); }}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-bonfire-500 to-embers-500 text-white rounded-lg hover:from-bonfire-600 hover:to-embers-600 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Register New User
              </button>
              <button
                onClick={() => show('Opening support tools (coming soon).', { type: 'info' })}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-bonfire-500 text-bonfire-600 dark:text-bonfire-400 rounded-lg hover:bg-bonfire-50 dark:hover:bg-bonfire-900/20 transition-all duration-200"
              >
                <Headphones className="w-5 h-5 mr-2" />
                Assist User
              </button>
            </div>
          </div>

          {/* Insights Preview */}
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-bonfire-500" />
              Insights Preview
            </h2>
            
            {/* Mock Chart Placeholder */}
            <div className="bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg p-4 mb-4">
              <div className="flex items-end justify-between h-24">
                {[40, 65, 45, 80, 55, 70, 85].map((height, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-bonfire-500 to-embers-500 rounded-t"
                    style={{ height: `${height}%`, width: '12%' }}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-blackswarm-500 dark:text-magnolia-400 mt-2 text-center">
                Participation trends (last 7 days)
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blackswarm-600 dark:text-magnolia-400">Peak participation:</span>
                <span className="font-medium text-blackswarm-900 dark:text-magnolia-50">2-4 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blackswarm-600 dark:text-magnolia-400">Top category:</span>
                <span className="font-medium text-blackswarm-900 dark:text-magnolia-50">Electronics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blackswarm-600 dark:text-magnolia-400">Avg. tickets/user:</span>
                <span className="font-medium text-blackswarm-900 dark:text-magnolia-50">2.4</span>
              </div>
            </div>

            <button
              onClick={() => show('Navigating to full insights (coming soon).', { type: 'info' })}
              className="w-full mt-4 px-4 py-2 text-sm text-bonfire-600 dark:text-bonfire-400 border border-bonfire-500 rounded-lg hover:bg-bonfire-50 dark:hover:bg-bonfire-900/20 transition-colors"
            >
              View Full Insights
            </button>
          </div>
        </div>
      </div>
      {/* Register Participant Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-magnolia-50 dark:bg-blackswarm-800 rounded-xl shadow-2xl p-6 relative">
            <button
              className="absolute top-3 right-3 text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400"
              onClick={() => setShowRegister(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">Register New Participant</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRegisterError('');
                const name = form.name?.trim();
                const email = form.email?.trim();
                const phone = form.phone?.trim();
                const password = form.password?.trim();
                if (!name || !email || !password) {
                  setRegisterError('Name and Email are required');
                  return;
                }
                if (password.length < 6) {
                  setRegisterError('Password must be at least 6 characters');
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setRegisterError('Please enter a valid email');
                  return;
                }
                try {
                  setRegisterLoading(true);
                  const payload = {
                    name,
                    email,
                    phone: phone || null,
                    password,
                  };
                  const { error } = await supabase.from('app_users').insert(payload);
                  if (error) throw error;
                  show('Participant registered', { type: 'success' });
                  setShowRegister(false);
                  setForm({ name: '', email: '', phone: '', password: '' });
                } catch (err) {
                  setRegisterError(err.message || String(err));
                } finally {
                  setRegisterLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-700 text-blackswarm-900 dark:text-magnolia-50 focus:outline-none focus:ring-2 focus:ring-bonfire-500"
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-700 text-blackswarm-900 dark:text-magnolia-50 focus:outline-none focus:ring-2 focus:ring-bonfire-500"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-700 text-blackswarm-900 dark:text-magnolia-50 focus:outline-none focus:ring-2 focus:ring-bonfire-500"
                  placeholder="Set a password"
                  required
                />
                <p className="mt-1 text-xs text-blackswarm-500 dark:text-magnolia-400">Minimum 6 characters.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-700 text-blackswarm-900 dark:text-magnolia-50 focus:outline-none focus:ring-2 focus:ring-bonfire-500"
                  placeholder="e.g., +63 900 123 4567"
                />
              </div>
              {registerError && (
                <div className="text-sm text-red-600 dark:text-red-400">{registerError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="px-4 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-300 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-bonfire-500 to-embers-500 text-white disabled:opacity-60"
                >
                  {registerLoading ? 'Registering…' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
