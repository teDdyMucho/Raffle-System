import React, { useState, useEffect } from 'react';
import { Users, Ticket, Trophy, DollarSign, TrendingUp, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
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
    monthlyGrowth: 12.5
  };

  const recentActivity = [
    { type: 'user_joined', message: 'New user Sarah M. registered', time: '2 minutes ago' },
    { type: 'ticket_sold', message: '5 tickets sold for iPhone 15 Pro Giveaway', time: '5 minutes ago' },
    { type: 'raffle_ended', message: 'iPad Pro 12.9" Giveaway ended', time: '1 hour ago' },
    { type: 'winner_selected', message: 'Winner selected for AirPods Pro 2 Bundle', time: '2 hours ago' },
    { type: 'raffle_created', message: 'New raffle "Gaming Setup Bundle" created', time: '3 hours ago' }
  ];

  const activeRaffles = [
    {
      id: 1,
      title: 'iPhone 15 Pro Giveaway',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      soldTickets: 743,
      maxTickets: 1000,
      revenue: 3715,
      status: 'active'
    },
    {
      id: 2,
      title: 'Gaming Setup Bundle',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      soldTickets: 234,
      maxTickets: 500,
      revenue: 2340,
      status: 'active'
    },
    {
      id: 3,
      title: 'MacBook Air M3',
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      soldTickets: 456,
      maxTickets: 800,
      revenue: 3648,
      status: 'active'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (endDate) => {
    const total = Date.parse(endDate) - Date.parse(currentTime);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    
    return { total, days, hours };
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_joined': return <Users className="w-4 h-4 text-blue-500" />;
      case 'ticket_sold': return <Ticket className="w-4 h-4 text-green-500" />;
      case 'raffle_ended': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'winner_selected': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'raffle_created': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 text-white shadow-large">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 animate-slide-in">Admin Dashboard</h1>
          <p className="text-red-100 text-lg animate-slide-in" style={{animationDelay: '0.1s'}}>
            Welcome back! Here's what's happening with your raffles today.
          </p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card group hover:scale-105 animate-slide-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold gradient-text">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-medium group-hover:shadow-large transition-all duration-300 animate-pulse-subtle">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">+{stats.monthlyGrowth}% this month</span>
          </div>
        </div>

        <div className="card group hover:scale-105 animate-slide-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets Sold</p>
              <p className="text-3xl font-bold gradient-text">{stats.totalTicketsSold.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-medium group-hover:shadow-large transition-all duration-300 animate-pulse-subtle">
              <Ticket className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">+8.2% from last week</span>
          </div>
        </div>

        <div className="card group hover:scale-105 animate-slide-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Raffles</p>
              <p className="text-3xl font-bold gradient-text">{stats.activeRaffles}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl shadow-medium group-hover:shadow-large transition-all duration-300 animate-pulse-subtle">
              <Trophy className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stats.completedRaffles} completed</span>
          </div>
        </div>

        <div className="card group hover:scale-105 animate-slide-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold gradient-text">₱{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-medium group-hover:shadow-large transition-all duration-300 animate-pulse-subtle">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">+15.3% this month</span>
          </div>
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
            {activeRaffles.map((raffle) => {
              const timeLeft = getTimeRemaining(raffle.endDate);
              const progress = (raffle.soldTickets / raffle.maxTickets) * 100;

              return (
                <div
                  key={raffle.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{raffle.title}</h3>
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
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

      {/* Quick Actions */}
      <div className="card animate-slide-in" style={{animationDelay: '0.6s'}}>
        <h2 className="text-2xl font-bold gradient-text mb-8">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="/admin/raffles"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Calendar className="w-10 h-10 mb-4 animate-float" />
            <h3 className="font-bold text-lg mb-2">Create New Raffle</h3>
            <p className="text-blue-100 text-sm">Set up a new raffle campaign</p>
          </a>

          <a
            href="/admin/users"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Users className="w-10 h-10 mb-4 animate-float" style={{animationDelay: '0.5s'}} />
            <h3 className="font-bold text-lg mb-2">Manage Users</h3>
            <p className="text-green-100 text-sm">View and manage user accounts</p>
          </a>

          <a
            href="/admin/reports"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <TrendingUp className="w-10 h-10 mb-4 animate-float" style={{animationDelay: '1s'}} />
            <h3 className="font-bold text-lg mb-2">View Reports</h3>
            <p className="text-purple-100 text-sm">Generate detailed analytics</p>
          </a>

          <button
            onClick={handleRecompute}
            disabled={recomputeLoading}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <RefreshCw className={`w-10 h-10 mb-4 ${recomputeLoading ? 'animate-spin' : 'animate-float'}`} style={{animationDelay: '1.5s'}} />
            <h3 className="font-bold text-lg mb-2">Recompute Balances</h3>
            <p className="text-red-100 text-sm">Update all agents' balance_cents</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
