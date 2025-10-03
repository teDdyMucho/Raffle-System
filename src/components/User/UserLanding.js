import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, Trophy, Users, ArrowRight, Star, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { resolveImageUrl, TRANSPARENT_PIXEL } from '../../lib/imageUrl';

const UserLanding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [activeRaffles, setActiveRaffles] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loadingRaffles, setLoadingRaffles] = useState(true);

  const fetchActive = async () => {
    try {
      setLoadingRaffles(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', today)
        .order('end_date', { ascending: true })
        .limit(6);
      if (error) throw error;
      setActiveRaffles(data || []);

      // Fetch total count of active raffles (not limited)
      const { count, error: countError } = await supabase
        .from('raffles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('end_date', today);
      if (countError) throw countError;
      setActiveCount(count || 0);
    } catch (err) {
      console.error('Fetch active raffles (landing) error:', err);
    } finally {
      setLoadingRaffles(false);
    }
  };

  useEffect(() => {
    fetchActive();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (endDate) => {
    const total = Date.parse(endDate) - Date.parse(currentTime);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { total, days, hours, minutes, seconds };
  };

  const CountdownTimer = ({ endDate }) => {
    const timeLeft = getTimeRemaining(endDate);

    if (timeLeft.total <= 0) {
      return <span className="text-red-500 font-semibold">Ended</span>;
    }

    return (
      <div className="flex space-x-2 text-sm">
        <div className="bg-bonfire-100 dark:bg-bonfire-900/30 px-2 py-1 rounded">
          <span className="font-bold text-bonfire-700 dark:text-bonfire-300">{timeLeft.days}</span>
          <span className="text-xs text-bonfire-600 dark:text-bonfire-400 ml-1">d</span>
        </div>
        <div className="bg-bonfire-100 dark:bg-bonfire-900/30 px-2 py-1 rounded">
          <span className="font-bold text-bonfire-700 dark:text-bonfire-300">{timeLeft.hours}</span>
          <span className="text-xs text-bonfire-600 dark:text-bonfire-400 ml-1">h</span>
        </div>
        <div className="bg-bonfire-100 dark:bg-bonfire-900/30 px-2 py-1 rounded">
          <span className="font-bold text-bonfire-700 dark:text-bonfire-300">{timeLeft.minutes}</span>
          <span className="text-xs text-bonfire-600 dark:text-bonfire-400 ml-1">m</span>
        </div>
        <div className="bg-bonfire-100 dark:bg-bonfire-900/30 px-2 py-1 rounded">
          <span className="font-bold text-bonfire-700 dark:text-bonfire-300">{timeLeft.seconds}</span>
          <span className="text-xs text-bonfire-600 dark:text-bonfire-400 ml-1">s</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-2xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Gift className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to Raffle System!
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-bonfire-100">
            Your chance to win amazing prizes starts here, {user?.name}!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/user/join')} className="bg-magnolia-50 text-bonfire-600 px-8 py-3 rounded-lg font-semibold hover:bg-magnolia-100 transition-colors duration-200 flex items-center justify-center">
              Join Active Raffles
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button onClick={() => navigate('/user/results')} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-200 flex items-center justify-center">
              View Past Winners
              <Trophy className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 border border-magnolia-200 dark:border-blackswarm-700">
          <div className="bg-gradient-to-br from-bonfire-100 to-bonfire-200 dark:from-bonfire-900/30 dark:to-bonfire-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Ticket className="w-8 h-8 text-bonfire-600 dark:text-bonfire-400" />
          </div>
          <h3 className="text-3xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-3">{activeCount}</h3>
          <p className="text-blackswarm-600 dark:text-magnolia-400 font-medium">Active Raffles</p>
        </div>
        
        <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 border border-magnolia-200 dark:border-blackswarm-700">
          <div className="bg-gradient-to-br from-embers-100 to-embers-200 dark:from-embers-900/30 dark:to-embers-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-8 h-8 text-embers-600 dark:text-embers-400" />
          </div>
          <h3 className="text-3xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-3">1,433</h3>
          <p className="text-blackswarm-600 dark:text-magnolia-400 font-medium">Total Participants</p>
        </div>

      </div>

      {/* Active Raffles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50">🔥 Hot Raffles</h2>
          <button onClick={() => navigate('/user/join')} className="text-bonfire-600 dark:text-bonfire-400 hover:text-bonfire-700 dark:hover:text-bonfire-300 font-medium flex items-center">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingRaffles && (
            <div className="col-span-full text-center py-12 text-blackswarm-600 dark:text-magnolia-400">
              <div className="animate-spin w-8 h-8 border-2 border-bonfire-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading hot raffles...
            </div>
          )}
          {!loadingRaffles && activeRaffles.length === 0 && (
            <div className="col-span-full text-center py-16 text-blackswarm-600 dark:text-magnolia-400">
              <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No active raffles</h3>
              <p className="text-sm">Check back soon for exciting new prizes!</p>
            </div>
          )}
          {!loadingRaffles && activeRaffles.map((raffle, index) => (
            <div
              key={raffle.id}
              className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-magnolia-200 dark:border-blackswarm-700"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">
                  {raffle.image_url ? (
                    <img
                      src={resolveImageUrl(raffle.image_url) || TRANSPARENT_PIXEL}
                      alt={raffle.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                      onError={(e) => { e.currentTarget.src = TRANSPARENT_PIXEL; }}
                    />
                  ) : (
                    '🎁'
                  )}
                </div>
                <h3 className="text-lg font-semibold text-blackswarm-900 dark:text-magnolia-50 mb-2">
                  {raffle.title}
                </h3>
                <p className="text-blackswarm-600 dark:text-magnolia-400 text-sm mb-3">
                  {raffle.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-blackswarm-500 dark:text-magnolia-400 mb-1">Time Remaining</p>
                    <CountdownTimer endDate={raffle.end_date} />
                  </div>
                </div>

                <button onClick={() => navigate('/user/join')} className="w-full bg-gradient-to-r from-bonfire-500 to-embers-500 text-white py-2 px-4 rounded-lg hover:from-bonfire-600 hover:to-embers-600 transition-all duration-200">
                  Join Raffle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Winners */}
      <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 text-bonfire-500 mr-2" />
          <h2 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50">Recent Winners</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'Sarah M.', prize: 'iPad Pro 12.9"', date: '2 days ago' },
            { name: 'John D.', prize: 'AirPods Pro 2', date: '5 days ago' },
            { name: 'Emma L.', prize: 'Nintendo Switch OLED', date: '1 week ago' },
          ].map((winner, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-bonfire-400 to-embers-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {winner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-blackswarm-900 dark:text-magnolia-50">{winner.name}</p>
                  <p className="text-sm text-blackswarm-600 dark:text-magnolia-400">Won {winner.prize}</p>
                </div>
              </div>
              <span className="text-sm text-blackswarm-500 dark:text-magnolia-400">{winner.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserLanding;
