import React, { useState, useEffect } from 'react';
import { Users, Ticket, Trophy, DollarSign, TrendingUp, Calendar, Clock, AlertCircle } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your raffles today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+{stats.monthlyGrowth}% this month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTicketsSold.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Ticket className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+8.2% from last week</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Raffles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRaffles}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{stats.completedRaffles} completed</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+15.3% this month</span>
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
                        ${raffle.revenue.toLocaleString()}
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
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/raffles"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-400 transition-colors duration-200 group"
          >
            <Calendar className="w-8 h-8 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Create New Raffle</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set up a new raffle campaign</p>
            </div>
          </a>

          <a
            href="/admin/users"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-400 transition-colors duration-200 group"
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage Users</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and manage user accounts</p>
            </div>
          </a>

          <a
            href="/admin/reports"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-400 transition-colors duration-200 group"
          >
            <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">View Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate detailed analytics</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
