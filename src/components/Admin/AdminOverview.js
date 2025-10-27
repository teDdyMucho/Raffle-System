import React, { useState, useEffect } from 'react';
import {
  Users,
  Ticket,
  Trophy,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { recomputeAllAgentBalances } from '../../lib/wallet';

const AdminOverview = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock dashboard data
  const stats = {
    totalUsers: 1247,
    totalTicketsSold: 3456,
    activeRaffles: 3,
    completedRaffles: 12,
    totalRevenue: 17280,
    monthlyGrowth: 12.5,
  };

  const recentActivity = [
    { type: 'user_joined', message: 'New user Sarah M. registered', time: '2 minutes ago' },
    {
      type: 'ticket_sold',
      message: '5 tickets sold for iPhone 15 Pro Giveaway',
      time: '5 minutes ago',
    },
    { type: 'raffle_ended', message: 'iPad Pro 12.9" Giveaway ended', time: '1 hour ago' },
    {
      type: 'winner_selected',
      message: 'Winner selected for AirPods Pro 2 Bundle',
      time: '2 hours ago',
    },
    {
      type: 'raffle_created',
      message: 'New raffle "Gaming Setup Bundle" created',
      time: '3 hours ago',
    },
  ];

  const activeRaffles = [
    {
      id: 1,
      title: 'iPhone 15 Pro Giveaway',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      soldTickets: 743,
      maxTickets: 1000,
      revenue: 3715,
      status: 'active',
    },
    {
      id: 2,
      title: 'Gaming Setup Bundle',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      soldTickets: 234,
      maxTickets: 500,
      revenue: 2340,
      status: 'active',
    },
    {
      id: 3,
      title: 'MacBook Air M3',
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      soldTickets: 456,
      maxTickets: 800,
      revenue: 3648,
      status: 'active',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = endDate => {
    const total = Date.parse(endDate) - Date.parse(currentTime);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

    return { total, days, hours };
  };

  const getActivityIcon = type => {
    switch (type) {
      case 'user_joined':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'ticket_sold':
        return <Ticket className="w-4 h-4 text-green-500" />;
      case 'raffle_ended':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'winner_selected':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'raffle_created':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const [recomputeLoading, setRecomputeLoading] = useState(false);
  const handleRecompute = async () => {
    try {
      setRecomputeLoading(true);
      const r = await recomputeAllAgentBalances();
      if (!r?.success) throw new Error(r?.error || 'Failed to recompute');
      alert('All agent balances have been recomputed.');
    } catch (err) {
      alert(`Error: ${err.message || String(err)}`);
    } finally {
      setRecomputeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="dashboard-header animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-slate-300 text-base sm:text-lg">
                Track, manage, and approve user transactions in real time
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="text-right">
                <div className="text-2xl font-bold">₱{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-slate-300 text-sm">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />+{stats.monthlyGrowth}% this month
            </div>
          </div>

          <div className="stat-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-label">Tickets Sold</div>
            <div className="stat-value">{stats.totalTicketsSold.toLocaleString()}</div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8.2% from last week
            </div>
          </div>

          <div className="stat-card animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-label">Active Raffles</div>
            <div className="stat-value">{stats.activeRaffles}</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              {stats.completedRaffles} completed
            </div>
          </div>

          <div className="stat-card animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value">0</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">Awaiting approval</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Raffles */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Raffles</h2>
              <a
                href="/admin/raffles"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
              >
                View All
              </a>
            </div>

            <div className="space-y-4">
              {activeRaffles.map(raffle => {
                const timeLeft = getTimeRemaining(raffle.endDate);
                const progress = (raffle.soldTickets / raffle.maxTickets) * 100;

                return (
                  <div
                    key={raffle.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {raffle.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {timeLeft.days}d {timeLeft.hours}h remaining
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ₱{raffle.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white">
                          {raffle.soldTickets}/{raffle.maxTickets}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h2>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/admin/reports"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
              >
                View detailed reports →
              </a>
            </div>
          </div>
        </div>

        {/* Transaction Management Section */}
        <div className="card animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="section-title">Transaction Management</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Monitor and approve user cash-in requests
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/raffles"
              className="modern-button bg-blue-600 hover:bg-blue-700 text-center block"
            >
              <Calendar className="w-5 h-5 mx-auto mb-2" />
              Create New Raffle
            </a>

            <a
              href="/admin/users"
              className="modern-button bg-green-600 hover:bg-green-700 text-center block"
            >
              <Users className="w-5 h-5 mx-auto mb-2" />
              Manage Users
            </a>

            <a
              href="/admin/reports"
              className="modern-button bg-purple-600 hover:bg-purple-700 text-center block"
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-2" />
              View Reports
            </a>

            <button
              onClick={handleRecompute}
              disabled={recomputeLoading}
              className="modern-button bg-red-600 hover:bg-red-700 text-center"
            >
              <RefreshCw
                className={`w-5 h-5 mx-auto mb-2 ${recomputeLoading ? 'animate-spin' : ''}`}
              />
              {recomputeLoading ? 'Processing...' : 'Recompute Balances'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
