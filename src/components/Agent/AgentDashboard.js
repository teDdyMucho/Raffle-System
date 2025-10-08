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
  Eye,
  Megaphone,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import AgentCommissionTracker from './AgentCommissionTracker';

const AgentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { show } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  // Removed register participant feature

  // Declare state first (used by stats below)
  const [activeRaffles, setActiveRaffles] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Derived stats from DB (active raffles query)
  const stats = React.useMemo(() => {
    const activeCount = activeRaffles.length;
    const totalTicketsActive = activeRaffles.reduce((sum, r) => sum + (Number(r.ticketsSold) || 0), 0);
    // Total participants from DB (app_users where role='user')
    const totalParticipants = totalUsersCount;
    const closingSoonHrs = 24; // next 24 hours
    const now = new Date();
    const soonCount = activeRaffles.filter(r => {
      const end = new Date(r.endDate);
      const diffH = (end - now) / (1000*60*60);
      return diffH > 0 && diffH <= closingSoonHrs;
    }).length;

    return [
      {
        title: 'Active Raffles',
        value: String(activeCount),
        change: loadingActive ? 'Loading…' : `${activeCount} active now`,
        icon: BarChart3,
        color: 'bonfire'
      },
      {
        title: 'Tickets Sold (Active)',
        value: totalTicketsActive.toLocaleString(),
        change: loadingActive ? '' : 'Across active raffles',
        icon: Ticket,
        color: 'embers'
      },
      {
        title: 'Total Participants',
        value: totalParticipants.toLocaleString(),
        change: loadingUsers ? 'Loading…' : 'All registered users',
        icon: Users,
        color: 'bonfire'
      },
      {
        title: 'Raffles Closing Soon',
        value: String(soonCount),
        change: loadingActive ? '' : `Within ${closingSoonHrs}h`,
        icon: Clock,
        color: 'embers'
      }
    ];
  }, [activeRaffles, loadingActive, totalUsersCount, loadingUsers]);

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

  const fetchTotalUsers = async () => {
    try {
      setLoadingUsers(true);
      // Strategy:
      // 1) Count explicit role='user'
      let total = 0;
      let { count, error } = await supabase
        .from('app_users')
        .select('id', { count: 'exact' })
        .eq('role', 'user')
        .range(0, 0); // request minimal rows but get accurate count
      if (error) throw error;
      total = Number(count || 0);

      // 2) If zero, try case-insensitive match (some DBs store 'User'/'USER')
      if (total === 0) {
        const { error: e2, count: c2 } = await supabase
          .from('app_users')
          .select('id', { count: 'exact' })
          .ilike('role', 'user')
          .range(0, 0);
        if (!e2 && (typeof c2 === 'number')) {
          total = Number(c2 || 0);
        }
      }

      // 3) Fallback: exclude agents (still excludes agents even if admin exists)
      if (total === 0) {
        const { count: c3, error: e3 } = await supabase
          .from('app_users')
          .select('id', { count: 'exact' })
          .neq('role', 'agent')
          .range(0, 0);
        if (!e3 && typeof c3 === 'number') {
          total = Number(c3 || 0);
        }
      }

      setTotalUsersCount(total);
    } catch (e) {
      console.warn('[AgentDashboard] failed to count users:', e?.message || e);
      setTotalUsersCount(0);
    } finally {
      setLoadingUsers(false);
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
    fetchTotalUsers();
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
      {/* Welcome + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name || 'Agent'}! 👋
          </h1>
          <p className="text-bonfire-100">
            Here's what's happening with your raffles today.
          </p>
        </div>
        <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-bonfire-500" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate && onNavigate('commission')}
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-bonfire-500 text-bonfire-600 dark:text-bonfire-400 rounded-lg hover:bg-bonfire-50 dark:hover:bg-bonfire-900/20 transition-all duration-200"
            >
              <span className="mr-2 inline-flex items-center justify-center w-5 h-5 font-semibold" aria-label="Philippine Peso">₱</span>
              Commission Tracker
            </button>
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Raffles Section */}
        <div>
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

        {/* Quick Actions & Commission Tracker */}
        <div className="space-y-6">
          {/* Commission Tracker card */}
          <AgentCommissionTracker />
        </div>
      </div>
      {/* Register Participant Modal removed */}
    </div>
  );
};

export default AgentDashboard;
