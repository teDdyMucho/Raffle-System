import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  Activity
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const activeRaffles = [
    {
      id: 1,
      title: 'iPhone 15 Pro Giveaway',
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      ticketsSold: 743,
      maxTickets: 1000,
      participants: 654
    },
    {
      id: 2,
      title: 'Gaming Setup Bundle',
      endDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      ticketsSold: 234,
      maxTickets: 500,
      participants: 198
    },
    {
      id: 3,
      title: 'MacBook Air M3',
      endDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      ticketsSold: 456,
      maxTickets: 800,
      participants: 389
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
                {activeRaffles.length} active
              </span>
            </div>

            <div className="space-y-4">
              {activeRaffles.map((raffle) => (
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
                      <button className="flex items-center px-3 py-1 text-xs bg-bonfire-100 dark:bg-bonfire-900/30 text-bonfire-600 dark:text-bonfire-400 rounded-md hover:bg-bonfire-200 dark:hover:bg-bonfire-900/50 transition-colors">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                      <button className="flex items-center px-3 py-1 text-xs bg-embers-100 dark:bg-embers-900/30 text-embers-600 dark:text-embers-400 rounded-md hover:bg-embers-200 dark:hover:bg-embers-900/50 transition-colors">
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
              <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-bonfire-500 to-embers-500 text-white rounded-lg hover:from-bonfire-600 hover:to-embers-600 transition-all duration-200">
                <UserPlus className="w-5 h-5 mr-2" />
                Register New Participant
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 border-2 border-bonfire-500 text-bonfire-600 dark:text-bonfire-400 rounded-lg hover:bg-bonfire-50 dark:hover:bg-bonfire-900/20 transition-all duration-200">
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

            <button className="w-full mt-4 px-4 py-2 text-sm text-bonfire-600 dark:text-bonfire-400 border border-bonfire-500 rounded-lg hover:bg-bonfire-50 dark:hover:bg-bonfire-900/20 transition-colors">
              View Full Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
