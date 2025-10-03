import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Ticket, Trophy, Calendar, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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
  const pageSize = 6;

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

  const activeTickets = ticketRows.filter(ticket => ticket.status === 'active');
  const completedTickets = ticketRows.filter(ticket => ticket.status === 'completed');

  // Live stats from Supabase tickets + raffles
  const [stats, setStats] = useState({ totalTickets: 0, totalSpent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const email = user?.email;
        if (!email) return;

        // 1) Fetch user tickets
        const { data: ticketsData, error: tErr } = await supabase
          .from('tickets')
          .select('raffle_id')
          .eq('user_email', email);
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
  }, [user?.email]);

  // Fetch detailed ticket history
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setTicketsLoading(true);
        const email = user?.email;
        if (!email) {
          setTicketRows([]);
          return;
        }

        const { data: tickets, error: tErr } = await supabase
          .from('tickets')
          .select('id, raffle_id, ticket_number, created_at, user_email, user_name')
          .eq('user_email', email)
          .order('created_at', { ascending: false });
        if (tErr) throw tErr;

        const ids = Array.from(new Set((tickets || []).map(t => t.raffle_id).filter(Boolean)));
        let raffleMap = new Map();
        if (ids.length > 0) {
          const { data: raffles, error: rErr } = await supabase
            .from('raffles')
            .select('id, title, description, end_date, status, ticket_price, winner, image_url')
            .in('id', ids);
          if (rErr) throw rErr;
          raffleMap = new Map((raffles || []).map(r => [String(r.id), r]));
        }

        const rows = (tickets || []).map(t => {
          const r = raffleMap.get(String(t.raffle_id)) || {};
          const status = r.status || 'active';
          const endDate = r.end_date || null;
          const result = (status === 'completed' && r.winner && (r.winner === t.user_name || r.winner === t.user_email)) ? 'won' : 'lost';
          return {
            id: t.id,
            raffleTitle: r.title || 'Raffle',
            ticketNumber: t.ticket_number,
            purchaseDate: t.created_at,
            status,
            prize: r.ticket_price ? `$${r.ticket_price}` : '$—',
            endDate,
            result,
            imageUrl: r.image_url || '',
          };
        });

        setTicketRows(rows);
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and view your raffle history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="card text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalTickets}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
            </div>
            
            <div className="card text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 font-bold">$</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">${stats.totalSpent}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Tickets History (live) */}
        <div className="lg:col-span-2">
          <div className="card">
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
                  <>
                    {total === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No tickets found.</div>
                    ) : (
                      <div className="space-y-4">
                        {pageRows.map((ticket) => (
                          <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                {ticket.imageUrl ? (
                                  <img src={ticket.imageUrl} alt="raffle" className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">🎁</div>
                                )}
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{ticket.raffleTitle}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Ticket #{ticket.ticketNumber}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status, ticket.result)}`}>
                                  {getStatusText(ticket.status, ticket.result)}
                                </span>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{ticket.prize}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <span>Ends: {ticket.endDate ? new Date(ticket.endDate).toLocaleDateString() : '—'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {total > pageSize && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing <span className="font-medium">{start + 1}-{Math.min(start + pageSize, total)}</span> of <span className="font-medium">{total}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} className={`btn-secondary text-sm ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={page === 1}>Previous</button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={`btn-secondary text-sm ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={page === totalPages}>Next</button>
                        </div>
                      </div>
                    )}
                  </>
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
    </div>
  );
};
export default UserProfile;
