import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Ticket, Users, Search, Filter } from 'lucide-react';
import { resolveImageUrl, TRANSPARENT_PIXEL } from '../../lib/imageUrl';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const PastResults = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const categories = ['all', 'Electronics', 'Gaming', 'Luxury', 'Fashion', 'Home'];


  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let query = supabase
        .from('raffles')
        .select('*')
        .order('end_date', { ascending: false });
      // Filter for completed raffles (status or end_date in the past)
      const now = new Date().toISOString();
      query = query.or('status.eq.completed,end_date.lt.' + now);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
      setLoading(false);
    };
    // seed search from ?q=
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchTerm(q);
    fetchResults();
  }, [location.search]);

  const filteredRaffles = results.filter((raffle) => {
    const matchesSearch = (raffle.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || raffle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Past Raffle Results</h1>
        <p className="text-gray-600 dark:text-gray-400">Check out our previous winners and their lucky numbers!</p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by raffle name, winner, or ticket number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredRaffles.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading results...
            </div>
          )}
          {!loading && filteredRaffles.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No past raffles yet</h3>
              <p className="text-sm">Winners will appear here once raffles are completed!</p>
            </div>
          )}
          {!loading && filteredRaffles.map((raffle) => (
            <div
              key={raffle.id}
              className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-l-green-500"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  {raffle.image_url && (
                    <img
                      src={resolveImageUrl(raffle.image_url) || TRANSPARENT_PIXEL}
                      alt={raffle.title}
                      className="w-16 h-16 object-cover rounded mr-3"
                      onError={(e) => { e.currentTarget.src = TRANSPARENT_PIXEL; }}
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {raffle.title}
                    </h3>
                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                      {raffle.category}
                    </span>
                  </div>
                </div>
                
              </div>

              {/* Winner Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-3">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="font-semibold text-gray-900 dark:text-white">Winner</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {(raffle.winner && raffle.winner[0]) || 'W'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{raffle.winner || 'TBA'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ticket #—</p>
                    </div>
                  </div>
                  <div className="text-2xl">🎉</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Participants</p>
                    <p className="font-medium text-gray-900 dark:text-white">—</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Ticket className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Max Tickets</p>
                    <p className="font-medium text-gray-900 dark:text-white">{raffle.max_tickets}</p>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Ended on {formatDate(raffle.end_date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Summary */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Overall Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{results.length}</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Completed Raffles</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">—</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Total Participants</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Ticket className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{results.reduce((sum, r) => sum + (r.max_tickets || 0), 0)}</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Tickets Sold</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PastResults;
