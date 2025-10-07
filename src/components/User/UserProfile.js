import React, { useEffect, useState, useRef } from 'react';
import PopupAds from '../PopupAds';
import cashinAd from '../../images/cashinads.png';
import { useAuth } from '../../contexts/AuthContext';
import { User, Ticket, Trophy, Calendar, Edit3, Save, X, Plus, Wallet as WalletIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { requestCashIn, listCashIns, getUserBalanceCents, getApprovedCashInTotalCents, fromCents } from '../../lib/wallet';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA'
  });

  // Live ticket history state (replaces mock list)
  const [ticketRows, setTicketRows] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | completed
  const [page, setPage] = useState(1);
  const pageSize = 3;

  // Wallet state
  const [balanceCents, setBalanceCents] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [cashIns, setCashIns] = useState([]);
  const [cashInForm, setCashInForm] = useState({ amount: '', method: 'gcash', reference: '' });
  const [showCashInModal, setShowCashInModal] = useState(false);
  const ticketsContainerRef = useRef(null);

  // Profile popup ads
  const [showProfileAds, setShowProfileAds] = useState(false);
  useEffect(() => {
    // Show the cash-in promo when visiting profile
    setShowProfileAds(true);
  }, []);

  const handleSaveProfile = async () => {
    try {
      // Persist profile fields to Supabase and local session
      const { success, error, dropped } = await updateProfile({
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        location: editedUser.location,
      });
      if (!success) throw new Error(error || 'Failed to update profile');
      setIsEditing(false);
      if (Array.isArray(dropped) && dropped.length > 0) {
        alert(`Profile updated. Note: these fields were skipped because the columns are missing in the database: ${dropped.join(', ')}`);
      } else {
        alert('Profile updated');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      alert(`Failed to save profile: ${err.message || err}`);
    }
  };

  // Relative time helper: e.g., "in 2 days" or "2 days ago"
  const fromNow = (dateLike) => {
    try {
      const d = new Date(dateLike);
      const diffMs = d.getTime() - Date.now();
      const abs = Math.abs(diffMs);
      const sec = Math.round(abs / 1000);
      const min = Math.round(sec / 60);
      const hr = Math.round(min / 60);
      const day = Math.round(hr / 24);
      const wk = Math.round(day / 7);
      const mo = Math.round(day / 30);
      const yr = Math.round(day / 365);
      const fmt = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
      let span = 'just now';
      if (sec < 60) span = fmt(sec, 'second');
      else if (min < 60) span = fmt(min, 'minute');
      else if (hr < 24) span = fmt(hr, 'hour');
      else if (day < 7) span = fmt(day, 'day');
      else if (wk < 5) span = fmt(wk, 'week');
      else if (mo < 18) span = fmt(mo, 'month');
      else span = fmt(yr, 'year');
      return diffMs >= 0 ? `in ${span}` : `${span} ago`;
    } catch (_) {
      return '';
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA'
    });
    setIsEditing(false);
  };

  const getStatusColor = (status, result) => {
    if (status === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (result === 'won') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  };

  const getStatusText = (status, result) => {
    if (status === 'active') return 'Active';
    if (result === 'won') return 'Won';
    return 'Ended';
  };
  // Toggle to allow automatic one-time repair of missing ticket fields
  const AUTO_REPAIR_TICKETS = true;

  // Try to resolve a price from many possible field names and formats
  const resolvePriceDisplay = (raffleObj = {}, ticketObj = {}) => {
    const toNumber = (v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[,\s]/g, '');
        const m = cleaned.match(/-?\d+(?:\.\d+)?/);
        if (m) return Number(m[0]);
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };
    const centsCandidates = [
      raffleObj.ticket_price_cents,
      raffleObj.price_cents,
      raffleObj.entry_price_cents,
      raffleObj.cost_cents,
      raffleObj.ticket_cost_cents,
      raffleObj.amount_cents,
      ticketObj.price_cents,
      ticketObj.ticket_price_cents,
      ticketObj.amount_paid_cents,
      ticketObj.paid_cents,
      ticketObj.payment_cents,
    ];
    for (const v of centsCandidates) {
      const n = toNumber(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return `₱${fromCents(n)}`;
    }
    const numCandidates = [
      raffleObj.ticket_price,
      raffleObj.price,
      raffleObj.entry_price,
      raffleObj.ticket_cost,
      raffleObj.amount,
      raffleObj.base_price,
      ticketObj.price,
      ticketObj.ticket_price,
      ticketObj.amount_paid,
      ticketObj.paid_amount,
      ticketObj.payment_amount,
      ticketObj.base_price,
    ];
    for (const v of numCandidates) {
      const n = toNumber(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return `₱${n.toFixed(2)}`;
    }
    // Last resort: scan any key with price/amount/cost
    const scan = (obj) => {
      for (const k of Object.keys(obj || {})) {
        if (/price|amount|cost/i.test(k)) {
          const n = toNumber(obj[k]);
          if (!Number.isNaN(n) && Number.isFinite(n)) return `₱${n.toFixed(2)}`;
        }
      }
      return null;
    };
    return scan(raffleObj) || scan(ticketObj) || '₱—';
  };

  // Resolve a price expressed in cents if possible
  const resolvePriceCents = (raffleObj = {}, ticketObj = {}) => {
    const toNumber = (v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[,\s]/g, '');
        const m = cleaned.match(/-?\d+(?:\.\d+)?/);
        if (m) return Number(m[0]);
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };
    const centsCandidates = [
      raffleObj.ticket_price_cents,
      raffleObj.price_cents,
      raffleObj.entry_price_cents,
      raffleObj.cost_cents,
      raffleObj.ticket_cost_cents,
      raffleObj.amount_cents,
      ticketObj.price_cents,
      ticketObj.ticket_price_cents,
      ticketObj.amount_paid_cents,
      ticketObj.paid_cents,
      ticketObj.payment_cents,
    ];
    for (const v of centsCandidates) {
      const n = toNumber(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return Math.round(n);
    }
    const numCandidates = [
      raffleObj.ticket_price,
      raffleObj.price,
      raffleObj.entry_price,
      raffleObj.ticket_cost,
      raffleObj.amount,
      raffleObj.base_price,
      ticketObj.price,
      ticketObj.ticket_price,
      ticketObj.amount_paid,
      ticketObj.paid_amount,
      ticketObj.payment_amount,
      ticketObj.base_price,
    ];
    for (const v of numCandidates) {
      const n = toNumber(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return Math.round(n * 100);
    }
    return null;
  };

  const activeTickets = ticketRows.filter(ticket => ticket.status === 'active');
  const completedTickets = ticketRows.filter(ticket => ticket.status === 'completed');

  // Live stats from Supabase tickets + raffles
  const [stats, setStats] = useState({ totalTickets: 0, totalSpent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const email = user?.email;
        const uid = user?.id;
        if (!email && !uid) return;

        // 1) Fetch user tickets (try by user_id first, then fall back to email)
        let ticketsData = [];
        let tErr = null;
        try {
          if (uid) {
            const r1 = await supabase.from('tickets').select('raffle_id').eq('user_id', uid);
            if (r1.error) throw r1.error;
            ticketsData = r1.data || [];
            if ((!ticketsData || ticketsData.length === 0) && email) {
              const r2 = await supabase.from('tickets').select('raffle_id').ilike('user_email', email);
              ticketsData = r2.data || [];
              tErr = r2.error || null;
            }
          } else {
            const r = await supabase.from('tickets').select('raffle_id').ilike('user_email', email);
            ticketsData = r.data || [];
            tErr = r.error || null;
          }
        } catch (e) {
          tErr = e;
        }
        if (tErr) throw tErr;

        const totalTickets = Array.isArray(ticketsData) ? ticketsData.length : 0;
        if (totalTickets === 0) {
          setStats({ totalTickets: 0, totalSpent: 0 });
          return;
        }

        // 2) Sum prices per raffle_id
        const counts = ticketsData.reduce((acc, row) => {
          const rid = row.raffle_id;
          if (!rid) return acc;
          acc[rid] = (acc[rid] || 0) + 1;
          return acc;
        }, {});
        const raffleIds = Object.keys(counts);

        if (raffleIds.length === 0) {
          setStats({ totalTickets, totalSpent: 0 });
          return;
        }

        const { data: rafflesData, error: rErr } = await supabase
          .from('raffles')
          .select('id, ticket_price')
          .in('id', raffleIds);
        if (rErr) throw rErr;

        const priceMap = new Map((rafflesData || []).map(r => [String(r.id), Number(r.ticket_price) || 0]));
        const totalSpent = raffleIds.reduce((sum, rid) => sum + (counts[rid] * (priceMap.get(String(rid)) || 0)), 0);

        setStats({ totalTickets, totalSpent });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Profile] Failed to fetch ticket stats:', err?.message || err);
      }
    };

    fetchStats();
  }, [user?.email, user?.id]);

  // Fetch wallet info
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setWalletLoading(true);
        const uid = user?.id;
        if (!uid) {
          setBalanceCents(0);
          setCashIns([]);
          return;
        }
        const [balRes, listRes, approvedRes] = await Promise.all([
          getUserBalanceCents(uid),
          listCashIns(uid, { limit: 5 }),
          getApprovedCashInTotalCents(uid)
        ]);
        if (balRes.success) setBalanceCents(balRes.balance_cents || 0);
        if (listRes.success) setCashIns(listRes.data || []);
        // Reconcile totalSpent from wallet: approved cash-ins minus current balance
        if (approvedRes?.success && balRes?.success) {
          const spentCents = Math.max(0, (approvedRes.total_cents || 0) - (balRes.balance_cents || 0));
          setStats(prev => ({ ...prev, totalSpent: fromCents(spentCents) }));
        }
      } catch (_) {
        // ignore; keep UI minimal
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, [user?.id]);

  const submitCashIn = async (e) => {
    e?.preventDefault?.();
    try {
      const uid = user?.id;
      if (!uid) throw new Error('Not authenticated');
      const amountNum = Number(cashInForm.amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Enter a valid amount');

      const { success, error } = await requestCashIn(
        uid,
        amountNum,
        cashInForm.method,
        { reference: cashInForm.reference }
      );
      if (!success) throw new Error(error || 'Failed to submit');
      alert('Cash-in request submitted for review');
      setCashInForm({ amount: '', method: 'gcash', reference: '' });
      // refresh list
      const listRes = await listCashIns(uid, { limit: 5 });
      if (listRes.success) setCashIns(listRes.data || []);
    } catch (err) {
      alert(err.message || String(err));
    }
  };

  // Fetch detailed ticket history
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setTicketsLoading(true);
        const email = user?.email;
        const uid = user?.id;
        if (!email && !uid) {
          setTicketRows([]);
          return;
        }

        let tickets = [];
        let tErr = null;
        try {
          // Prefer user_id if present
          if (uid) {
            try {
              const r = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });
              if (r.error) throw r.error;
              tickets = r.data || [];
            } catch (e1) {
              // Retry without order
              const r2 = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', uid);
              tickets = r2.data || [];
              tErr = r2.error || null;
            }
            // If none by id, try by email
            if ((!tickets || tickets.length === 0) && email) {
              const r3 = await supabase
                .from('tickets')
                .select('*')
                .ilike('user_email', email)
                .order('created_at', { ascending: false });
              if (r3.error) {
                const r4 = await supabase
                  .from('tickets')
                  .select('*')
                  .ilike('user_email', email);
                tickets = r4.data || [];
                tErr = r4.error || null;
              } else {
                tickets = r3.data || [];
              }
            }
          } else {
            // No uid, filter by email only
            const r = await supabase
              .from('tickets')
              .select('*')
              .ilike('user_email', email)
              .order('created_at', { ascending: false });
            if (r.error) {
              const r2 = await supabase
                .from('tickets')
                .select('*')
                .ilike('user_email', email);
              tickets = r2.data || [];
              tErr = r2.error || null;
            } else {
              tickets = r.data || [];
            }
          }
        } catch (err) {
          tErr = err;
        }
        if (tErr) {
          // eslint-disable-next-line no-console
          console.warn('[Profile] ticket fetch warning:', tErr?.message || tErr);
        }

        // Note: Do not load tickets from other users. If no tickets are found
        // for this account, simply display an empty list. The previous dev-only
        // fallback that loaded recent tickets has been removed to preserve privacy.

        // Strong filter: ensure we only keep tickets that belong to the current user
        const lowerEmail = (email || '').toLowerCase();
        tickets = (tickets || []).filter(t => {
          const byId = uid && t.user_id === uid;
          const byEmail = t.user_email && String(t.user_email).toLowerCase() === lowerEmail;
          return byId || byEmail;
        });

        const ids = Array.from(new Set((tickets || []).map(t => t.raffle_id).filter(Boolean)));
        let raffleMap = new Map();
        if (ids.length > 0) {
          try {
            const { data: raffles, error: rErr } = await supabase
              .from('raffles')
              .select('id, title, description, end_date, ends_at, end, close_at, draw_date, draw_at, deadline, status, ticket_price, ticket_price_cents, price, price_cents, entry_price, ticket_cost, amount, winner, image_url')
              .in('id', ids);
            if (!rErr) {
              raffleMap = new Map((raffles || []).map(r => [String(r.id), r]));
            } else {
              // eslint-disable-next-line no-console
              console.warn('[Profile] raffles fetch warning:', rErr.message || rErr);
            }
          } catch (raffleErr) {
            // eslint-disable-next-line no-console
            console.warn('[Profile] raffles fetch failed, continuing with defaults:', raffleErr?.message || raffleErr);
          }
        }

        // Optional auto-repair: backfill missing ticket price/user fields based on raffle and current user
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[Profile] tickets fetched:', (tickets||[]).length, 'sample:', (tickets||[])[0]);
        }

        if (AUTO_REPAIR_TICKETS && tickets && tickets.length > 0) {
          try {
            const updates = [];
            for (const t of tickets) {
              const r = raffleMap.get(String(t.raffle_id)) || {};
              const needsPrice = (t.price_cents == null && t.ticket_price_cents == null && t.price == null && t.ticket_price == null);
              const priceCents = needsPrice ? resolvePriceCents(r, t) : null;
              // Only repair tickets that clearly belong to the current user
              const owned = (uid && t.user_id === uid) || (t.user_email && String(t.user_email).toLowerCase() === lowerEmail);
              const patch = {};
              if (owned && needsPrice && priceCents != null) {
                patch.price_cents = priceCents;
                patch.price = Number((priceCents / 100).toFixed(2));
              }
              if (owned) {
                if (!t.user_id && uid) patch.user_id = uid;
                if (!t.user_email && email) patch.user_email = email;
                if (!t.user_name && (editedUser?.name || user?.name)) patch.user_name = editedUser?.name || user?.name;
              }
              if (Object.keys(patch).length > 0) {
                updates.push({ id: t.id, patch });
              }
            }
            if (updates.length > 0) {
              // Limit concurrent updates to avoid rate limits
              const chunkSize = 10;
              for (let i = 0; i < updates.length; i += chunkSize) {
                const chunk = updates.slice(i, i + chunkSize);
                await Promise.allSettled(chunk.map(u =>
                  supabase.from('tickets').update(u.patch).eq('id', u.id)
                ));
              }
              // Refresh tickets with newly filled data (non-blocking best-effort)
            }
          } catch (repairErr) {
            // eslint-disable-next-line no-console
            console.warn('[Profile] ticket auto-repair failed:', repairErr?.message || repairErr);
          }
        }

        let rows = (tickets || []).map(t => {
          const r = raffleMap.get(String(t.raffle_id)) || {};
          // Explicit hookup: tickets.raffle_id -> raffles.end_date
          const endRaw = r.end_date ?? t.end_date ?? null;
          const endDate = endRaw ? new Date(endRaw).toISOString() : null;
          // Normalize status for filter: 'active' | 'completed'
          let status = 'active';
          if (typeof r.status === 'string') {
            const s = r.status.toLowerCase();
            if (['completed','ended','closed','finished','done'].includes(s)) status = 'completed';
            else status = 'active';
          }
          // If no explicit status, infer from end_date
          if (!r.status && endDate) {
            try {
              if (new Date(endDate).getTime() < Date.now()) status = 'completed';
            } catch (_) {}
          }
          const isCompleted = status === 'completed';
          const result = (isCompleted && r.winner && (r.winner === t.user_name || r.winner === t.user_email)) ? 'won' : (isCompleted ? 'lost' : '');
          // Compute display prize with immediate fallback
          let prizeDisplay = resolvePriceDisplay(r, t);
          if (prizeDisplay === '₱—') {
            const pc = resolvePriceCents(r, t);
            if (pc != null) prizeDisplay = `₱${fromCents(pc)}`;
            if (prizeDisplay === '₱—') {
              // eslint-disable-next-line no-console
              console.warn('[Profile] Prize still missing for ticket', t.id, { raffle: r, ticket: t });
            }
          }
          if (!endDate && process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[Profile] End date missing for ticket', t.id, { raffleKeys: Object.keys(r||{}), ticketKeys: Object.keys(t||{}) });
          }
          return {
            id: t.id,
            raffleTitle: r.title || 'Raffle',
            ticketNumber: t.ticket_number,
            purchaseDate: t.created_at || new Date().toISOString(),
            status,
            prize: prizeDisplay,
            endDate,
            result,
            imageUrl: r.image_url || '',
          };
        });

        // Fallback: if tickets fetched but rows empty, build minimal rows from tickets
        if ((tickets && tickets.length > 0) && rows.length === 0) {
          // eslint-disable-next-line no-console
          console.warn('[Profile] Fallback tickets mapping engaged');
          rows = tickets.map(t => ({
            id: t.id,
            raffleTitle: 'Raffle',
            ticketNumber: t.ticket_number,
            purchaseDate: t.created_at || new Date().toISOString(),
            status: 'active',
            prize: '₱—',
            endDate: null,
            result: 'lost',
            imageUrl: '',
          }));
        }

        setTicketRows(rows);
        // Keep Total Tickets card in sync with what we actually display
        setStats(prev => ({ ...prev, totalTickets: rows.length }));
        setPage(1);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Profile] Failed to fetch ticket history:', err?.message || err);
        setTicketRows([]);
      } finally {
        setTicketsLoading(false);
      }
    };
    fetchTickets();
  }, [user?.email]);

  return (
    <div className="space-y-6">
      <PopupAds open={showProfileAds} onClose={() => setShowProfileAds(false)} images={[cashinAd]} />
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and view your raffle history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                  className="text-xl font-bold text-center input-field"
                />
              ) : (
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editedUser.name}</h3>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                {/* Email is not editable */}
                <input
                  type="email"
                  value={editedUser.email}
                  disabled
                  readOnly
                  className="input-field opacity-80 cursor-not-allowed"
                  title="Email cannot be changed"
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{editedUser.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.location}
                    onChange={(e) => setEditedUser({...editedUser, location: e.target.value})}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{editedUser.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cash In Button above Stats */}
          <div className="mt-4">
            <button
              onClick={() => setShowCashInModal(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Cash In
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            <div className="card text-center h-28 flex flex-col items-center justify-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stats.totalTickets}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Tickets</p>
            </div>
            
            <div className="card text-center h-28 flex flex-col items-center justify-center gap-2">
              <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-base">₱</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">₱{stats.totalSpent}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
            </div>
            
            <div className="card text-center h-28 flex flex-col items-center justify-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">₱{fromCents(balanceCents)}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Balance</p>
            </div>
          </div>
        </div>

        {/* Tickets History (live) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="card flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Tickets</h2>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by raffle or ticket #..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="input-field text-sm"
                />
              </div>
            </div>

            {ticketsLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tickets…</div>
            ) : (
              (() => {
                const filtered = ticketRows.filter(row => {
                  const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
                  const q = searchTerm.trim().toLowerCase();
                  const matchesSearch = !q || row.raffleTitle.toLowerCase().includes(q) || (row.ticketNumber || '').includes(q);
                  return matchesStatus && matchesSearch;
                });
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const curPage = Math.min(page, totalPages);
                const start = (curPage - 1) * pageSize;
                const pageRows = filtered.slice(start, start + pageSize);

                return (
                  <div ref={ticketsContainerRef} className="flex flex-col">
                    {total === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No tickets found.</div>
                    ) : (
                      <div className="space-y-4 flex-1" style={{ minHeight: '300px' }}>
                        {pageRows.map((ticket) => (
                          <div key={ticket.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                {ticket.imageUrl ? (
                                  <img src={ticket.imageUrl} alt="raffle" className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                    <Ticket className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white">{ticket.raffleTitle}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    <span className="font-medium">#{ticket.ticketNumber}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(ticket.status, ticket.result)}`}>
                                  {getStatusText(ticket.status, ticket.result)}
                                </span>
                                {ticket.prize && ticket.prize !== '₱—' && (
                                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{ticket.prize}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-start items-center text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-2 mt-1">
                              <div className="flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1 text-primary-500 dark:text-primary-400" />
                                <span>Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-medium">Result:</span> {ticket.result ? ticket.result : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {total > pageSize && (
                      <div className="flex items-center justify-between mt-4 gap-2 flex-col sm:flex-row">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing <span className="font-medium">{start + 1}-{Math.min(start + pageSize, total)}</span> of <span className="font-medium">{total}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} className={`btn-secondary text-sm ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={page === 1}>Previous</button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={`btn-secondary text-sm ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={page === totalPages}>Next</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {!ticketsLoading && ticketRows.length === 0 && (
              <div className="text-center py-8">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't joined any raffles yet. Start by joining an active raffle!
                </p>
                <a href="/user/join" className="btn-primary">Join a Raffle</a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cash In Modal */}
      {showCashInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowCashInModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cash In</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{fromCents(balanceCents)}</p>
            </div>
            
            <form onSubmit={(e) => {
              submitCashIn(e);
              setShowCashInModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashInForm.amount}
                  onChange={(e) => setCashInForm({ ...cashInForm, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                <select
                  value={cashInForm.method}
                  onChange={(e) => setCashInForm({ ...cashInForm, method: e.target.value })}
                  className="input-field"
                >
                  <option value="gcash">GCash</option>
                  <option value="bank">Bank</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referal Code</label>
                <input
                  type="text"
                  value={cashInForm.reference}
                  onChange={(e) => setCashInForm({ ...cashInForm, reference: e.target.value })}
                  className="input-field"
                  placeholder="Agent Referral Code"
                />
              </div>
              
              {/* Recent Requests */}
              {cashIns.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent requests</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cashIns.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">₱{fromCents(r.amount_cents)} • {r.method}</p>
                          <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${r.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : r.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCashInModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserProfile;
