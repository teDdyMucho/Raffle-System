import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Ticket, Users, Search, Filter } from 'lucide-react';
import { resolveImageUrl, TRANSPARENT_PIXEL } from '../../lib/imageUrl';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import winnerAds from '../../images/winnerads.png';
import PopupAds from '../PopupAds';
import { useAuth } from '../../contexts/AuthContext';

const PastResults = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [results, setResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(null);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [participantsByRaffleName, setParticipantsByRaffleName] = useState({});
  const [showAd, setShowAd] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [myWins, setMyWins] = useState([]);
  const { user } = useAuth();
  // Per-raffle winners modal state
  const [showRaffleWinners, setShowRaffleWinners] = useState(false);
  const [raffleWinnersLoading, setRaffleWinnersLoading] = useState(false);
  const [raffleWinners, setRaffleWinners] = useState([]);
  const [selectedRaffleName, setSelectedRaffleName] = useState('');
  const [consolationWinners, setConsolationWinners] = useState([]);

  const location = useLocation();
  const categories = ['all', 'Electronics', 'Gaming', 'Luxury', 'Fashion', 'Home'];


  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let query = supabase
        .from('raffles')
        .select('*')
        .order('end_date', { ascending: false });
      // Filter for ended raffles (status inactive, or end_date in the past)
      const now = new Date().toISOString();
      query = query.or('status.eq.inactive,end_date.lt.' + now);
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

  // Tick every second for real-time end detection
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch participants per raffle using tickets.raffle_name
  useEffect(() => {
    const fetchPerRaffleParticipants = async () => {
      if (!Array.isArray(results) || results.length === 0) {
        setParticipantsByRaffleName({});
        return;
      }
      try {
        const counts = await Promise.all(
          results.map(async (r) => {
            const name = r.title || '';
            if (!name) return { name, count: 0 };
            const { count, error } = await supabase
              .from('tickets')
              .select('id', { count: 'exact', head: true })
              .eq('raffle_name', name);
            if (error) {
              return { name, count: 0 };
            }
            return { name, count: Number(count || 0) };
          })
        );
        const map = {};
        counts.forEach(({ name, count }) => { if (name) map[name] = count; });
        setParticipantsByRaffleName(map);
      } catch (e) {
        setParticipantsByRaffleName({});
      }
    };
    fetchPerRaffleParticipants();
  }, [results]);

  // Fetch total participants from app_users (row count)
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { count, error } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setTotalParticipants(typeof count === 'number' ? count : 0);
      } catch (e) {
        setTotalParticipants(0);
        // Optional: console.warn('Failed to load participants count', e);
      }
    };
    fetchParticipants();
  }, []);

  // Fetch total tickets sold (row count from tickets)
  useEffect(() => {
    const fetchTicketsSold = async () => {
      try {
        const { count, error } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true });
        if (error) throw error;
        setTotalTicketsSold(Number(count || 0));
      } catch (e) {
        setTotalTicketsSold(0);
      }
    };
    fetchTicketsSold();
  }, []);

  // Always show popup ad when this page is opened
  useEffect(() => {
    setShowAd(true);
  }, []);

  // When ad closes, check if current user has wins and prompt
  const handleAdClosed = async () => {
    setShowAd(false);
    try {
      const email = user?.email;
      if (!email) return;
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        setMyWins(data);
        setShowWinnersModal(true);
      }
    } catch (e) {
      // Silent fail; do not block UI
    }
  };

  // Normalize date-only to local end-of-day then compute remaining
  const getTimeRemaining = (endDate) => {
    let end;
    if (typeof endDate === 'string') {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endDate);
      end = new Date(isDateOnly ? `${endDate}T23:59:59` : endDate);
    } else {
      end = endDate;
    }
    return Date.parse(end) - Date.parse(currentTime);
  };

  const filteredRaffles = results.filter((raffle) => {
    const matchesSearch = (raffle.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || raffle.category === selectedCategory;
    const isEndedNow = (raffle.status === 'inactive') || (getTimeRemaining(raffle.end_date) <= 0);
    return matchesSearch && matchesCategory && isEndedNow;
  });

  // Open per-raffle winners modal and fetch rows from winners table
  const openRaffleWinners = async (raffle) => {
    if (!raffle) return;
    setSelectedRaffleName(raffle.title || '');
    setShowRaffleWinners(true);
    setRaffleWinnersLoading(true);
    try {
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .eq('raffle_name', raffle.title || '')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRaffleWinners(Array.isArray(data) ? data : []);
      // Try to load consolation winners by common patterns
      let cons = [];
      // Attempt 1: boolean flag is_consolation
      const { data: cons1, error: consErr1 } = await supabase
        .from('winners')
        .select('*')
        .eq('raffle_name', raffle.title || '')
        .eq('is_consolation', true)
        .order('created_at', { ascending: false });
      if (!consErr1 && Array.isArray(cons1)) cons = cons1;
      // Attempt 2: prize_type field
      if (cons.length === 0) {
        const { data: cons2, error: consErr2 } = await supabase
          .from('winners')
          .select('*')
          .eq('raffle_name', raffle.title || '')
          .eq('prize_type', 'consolation')
          .order('created_at', { ascending: false });
        if (!consErr2 && Array.isArray(cons2)) cons = cons2;
      }
      setConsolationWinners(cons);
    } catch (e) {
      setRaffleWinners([]);
      setConsolationWinners([]);
    } finally {
      setRaffleWinnersLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Popup Ad using shared component for consistent design */}
      <PopupAds open={showAd} onClose={handleAdClosed} images={[winnerAds]} />
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Raffle Results</h1>
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
              <h3 className="text-lg font-medium mb-2">No raffles yet</h3>
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

              {/* View Winner button only */}
              <div className="mb-4">
                <button
                  onClick={() => openRaffleWinners(raffle)}
                  className="btn-primary text-sm w-full"
                >
                  View Winners
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Participants</p>
                    <p className="font-medium text-gray-900 dark:text-white">{(participantsByRaffleName[raffle.title] ?? 0).toLocaleString()}</p>
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

      {/* Per-raffle Winners Modal */}
      {showRaffleWinners && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                Winner{Array.isArray(raffleWinners) && raffleWinners.length !== 1 ? 's' : ''} — {selectedRaffleName || 'Raffle'}
              </h3>
              <button
                onClick={() => { setShowRaffleWinners(false); setRaffleWinners([]); setConsolationWinners([]); }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-auto">
              {raffleWinnersLoading && (
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading winners…</div>
              )}
              {!raffleWinnersLoading && Array.isArray(raffleWinners) && raffleWinners.length === 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">No winner recorded yet.</div>
              )}
              {!raffleWinnersLoading && Array.isArray(raffleWinners) && raffleWinners.map((w, idx) => (
                <div key={w.id || idx} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex items-center justify-start">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ticket</p>
                      <p className="font-medium text-gray-900 dark:text-white">#{w.ticket_number || '—'}</p>
                    </div>
                  </div>
                  {w.created_at && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Won on {new Date(w.created_at).toLocaleString()}</div>
                  )}
                </div>
              ))}

              {/* Consolation Prize Winners */}
              {!raffleWinnersLoading && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Consolation Prize Winners</h4>
                  {Array.isArray(consolationWinners) && consolationWinners.length > 0 ? (
                    consolationWinners.map((w, idx) => (
                      <div key={w.id || `c-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-2">
                        <div className="flex items-center justify-start">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Ticket</p>
                            <p className="font-medium text-gray-900 dark:text-white">#{w.ticket_number || '—'}</p>
                          </div>
                        </div>
                        {w.created_at && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Won on {new Date(w.created_at).toLocaleString()}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 dark:text-gray-400">No consolation winners recorded.</p>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => { setShowRaffleWinners(false); setRaffleWinners([]); setConsolationWinners([]); }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winners Modal (shown after ad is closed if user has wins) */}
      {showWinnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                Congratulations!
              </h3>
              <button
                onClick={() => setShowWinnersModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-auto">
              {myWins.map((w, idx) => (
                <div key={w.id || idx} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Raffle</p>
                      <p className="font-medium text-gray-900 dark:text-white">{w.raffle_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ticket</p>
                      <p className="font-medium text-gray-900 dark:text-white">#{w.ticket_number}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Won on {new Date(w.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {myWins.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">No wins found.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowWinnersModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
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
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{(totalParticipants ?? 0).toLocaleString()}</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Total Participants</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Ticket className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalTicketsSold.toLocaleString()}</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Tickets Sold</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PastResults;
