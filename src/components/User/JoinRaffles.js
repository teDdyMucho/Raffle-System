import React, { useState, useEffect } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import { Ticket, Clock, Users, Gift, Shuffle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { tryDebitForPurchase, toCents, creditBalanceCents } from '../../lib/wallet';
import { resolveImageUrl, TRANSPARENT_PIXEL } from '../../lib/imageUrl';
import { useToast } from '../../contexts/ToastContext';

const JoinRaffles = () => {
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isAutoGenerate, setIsAutoGenerate] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();

  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const [completedIds, setCompletedIds] = useState([]);

  const fetchActiveRaffles = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10); // works for date column
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', today)
        .order('end_date', { ascending: true });
      if (error) throw error;
      setRaffles(data || []);
    } catch (err) {
      console.error('Fetch active raffles error:', err);
      show('Failed to load raffles from Supabase. Please ensure your env and policies are set.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRaffles();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-complete raffles that have ended on the client and refresh lists
  useEffect(() => {
    const autoComplete = async () => {
      if (!Array.isArray(raffles) || raffles.length === 0) return;
      const toComplete = raffles.filter(r => {
        const t = getTimeRemaining(r.end_date).total;
        return t <= 0 && r.status === 'active' && !completedIds.includes(r.id);
      });
      if (toComplete.length === 0) return;

      try {
        await Promise.all(
          toComplete.map(async (r) => {
            const { error } = await supabase
              .from('raffles')
              .update({ status: 'inactive' })
              .eq('id', r.id);
            if (!error) {
              setCompletedIds((prev) => prev.concat(r.id));
            }
          })
        );
      } catch (e) {
        // silent; RLS may block updates if no policy exists
      } finally {
        // Refresh visible list regardless so ended items disappear if server already marked them
        fetchActiveRaffles();
      }
    };
    autoComplete();
  }, [currentTime, raffles]);

  const getTimeRemaining = (endDate) => {
    // Normalize date-only values to end-of-day in local time to avoid timezone misparsing
    let end;
    if (typeof endDate === 'string') {
      // If string looks like YYYY-MM-DD (no time component), set to 23:59:59 local
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endDate);
      end = new Date(isDateOnly ? `${endDate}T23:59:59` : endDate);
    } else {
      end = endDate;
    }
    const total = Date.parse(end) - Date.parse(currentTime);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { total, days, hours, minutes, seconds };
  };

  const generateRandomTicket = () => {
    const randomNumber = Math.floor(Math.random() * 999999) + 1;
    return randomNumber.toString().padStart(6, '0');
  };

  const handleJoinRaffle = (raffle) => {
    setSelectedRaffle(raffle);
    if (isAutoGenerate) {
      setTicketNumber(generateRandomTicket());
    }
  };
  const handleSubmitTicket = async () => {
    if (!selectedRaffle || !ticketNumber) return;
    if (ticketNumber.length !== 6) return;
    try {
      setJoining(true);
      // 1) Debit wallet first based on raffle ticket price (robust parsing)
      const rawPrice =
        selectedRaffle.ticket_price ??
        selectedRaffle.price ??
        selectedRaffle.entry_price ??
        0;
      const parseToCents = (v) => {
        if (typeof v === 'number') return Math.round(v * 100);
        if (typeof v === 'string') {
          const cleaned = v.replace(/[₱,\s]/g, '');
          const m = cleaned.match(/-?\d+(?:\.\d+)?/);
          const num = m ? Number(m[0]) : 0;
          return Math.round(num * 100);
        }
        const num = Number(v) || 0;
        return Math.round(num * 100);
      };
      const priceCents = parseToCents(rawPrice);
      if (!user?.id) throw new Error('Not authenticated');
      const debitRes = await tryDebitForPurchase(user.id, priceCents);
      if (!debitRes.success) {
        if (debitRes.reason === 'insufficient_funds') {
          show('Insufficient wallet balance. Please cash in first.', { type: 'warning' });
          return;
        }
        throw new Error(debitRes.error || 'Failed to debit wallet');
      }

      const payload = {
        raffle_id: selectedRaffle.id,
        ticket_number: ticketNumber,
        user_id: user?.id || null,
        user_email: user?.email || 'guest@example.com',
        user_name: user?.name || 'Guest',
        // store price snapshot for reporting
        price_cents: priceCents,
        ticket_price_cents: priceCents,
        price: Number((priceCents / 100).toFixed(2)),
      };
      const { error } = await supabase.from('tickets').insert([payload]);
      if (error) {
        // Refund the debit if ticket creation fails
        await creditBalanceCents(user.id, priceCents);
        throw error;
      }
      // Use global defaults (centered, 3s)
      show(`Successfully joined ${selectedRaffle.title} with ticket #${ticketNumber}!`, { type: 'success' });
      setSelectedRaffle(null);
      setTicketNumber('');
    } catch (err) {
      console.error('Join raffle error:', err);
      show(`Failed to join raffle: ${err.message || err}. If you haven't created a tickets table yet, I can provide the SQL.`, { type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const CountdownTimer = ({ endDate }) => {
    const timeLeft = getTimeRemaining(endDate);

    if (timeLeft.total <= 0) {
      return <span className="text-red-500 font-semibold">Ended</span>;
    }

    return (
      <div className="flex space-x-1 text-xs">
        <div className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
          <span className="font-bold text-red-700 dark:text-red-300">{timeLeft.days}</span>
          <span className="text-red-600 dark:text-red-400 ml-1">d</span>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
          <span className="font-bold text-red-700 dark:text-red-300">{timeLeft.hours}</span>
          <span className="text-red-600 dark:text-red-400 ml-1">h</span>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
          <span className="font-bold text-red-700 dark:text-red-300">{timeLeft.minutes}</span>
          <span className="text-red-600 dark:text-red-400 ml-1">m</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join Active Raffles</h1>
        <p className="text-gray-600 dark:text-gray-400">Choose your lucky numbers and win amazing prizes!</p>
      </div>

      {/* Active Raffles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading raffles...
          </div>
        )}
        {/* Compute only raffles that have not ended yet in local time */}
        {(() => { return null; })()}
        {!loading && raffles.filter(r => getTimeRemaining(r.end_date).total > 0).length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
            <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No active raffles</h3>
            <p className="text-sm">Check back soon for new opportunities to win!</p>
          </div>
        )}
        {!loading && raffles.filter(r => getTimeRemaining(r.end_date).total > 0).map((raffle) => (
          <div
            key={raffle.id}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-l-primary-500"
          >
            {raffle.image_url && (
              <div className="mb-6 -mt-6 -mx-6">
                <ImageWithFallback
                  src={resolveImageUrl(raffle.image_url) || TRANSPARENT_PIXEL}
                  fallbackSrc={TRANSPARENT_PIXEL}
                  alt={raffle.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {raffle.title}
                </h3>
                <span className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full text-xs font-medium">
                  {raffle.category}
                </span>
              </div>
              <div className="text-right" />
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {raffle.description}
            </p>


            {/* Raffle Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="flex items-center">
                <Ticket className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Price: ₱{raffle.ticket_price}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Entries coming soon</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Ends in:</span>
              </div>
              <CountdownTimer endDate={raffle.end_date} />
            </div>

            {/* Join Button */}
            <button
              onClick={() => handleJoinRaffle(raffle)}
              className="w-full btn-primary flex items-center justify-center"
              disabled={false}
            >
              <Plus className="w-4 h-4 mr-2" />
              Join Raffle
            </button>
          </div>
        ))}
      </div>

      {/* Ticket Selection Modal */}
      {selectedRaffle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
              {selectedRaffle.image_url && (
                <ImageWithFallback
                  src={resolveImageUrl(selectedRaffle.image_url) || TRANSPARENT_PIXEL}
                  fallbackSrc={TRANSPARENT_PIXEL}
                  alt={selectedRaffle.title}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedRaffle.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ticket Price: ₱{selectedRaffle.ticket_price}
              </p>
            </div>

            <div className="space-y-4">
              {/* Ticket Generation Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isAutoGenerate}
                    onChange={() => {
                      setIsAutoGenerate(true);
                      setTicketNumber(generateRandomTicket());
                    }}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Auto-generate lucky number</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isAutoGenerate}
                    onChange={() => {
                      setIsAutoGenerate(false);
                      setTicketNumber('');
                    }}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Choose my own number</span>
                </label>
              </div>

              {/* Ticket Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Ticket Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="Enter 6-digit number"
                    maxLength="6"
                    className="flex-1 input-field"
                    disabled={isAutoGenerate}
                  />
                  {isAutoGenerate && (
                    <button
                      onClick={() => setTicketNumber(generateRandomTicket())}
                      className="btn-secondary flex items-center"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedRaffle(null);
                    setTicketNumber('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTicket}
                  disabled={!ticketNumber || ticketNumber.length !== 6}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining…' : `Join for ₱${selectedRaffle.ticket_price}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRaffles;
