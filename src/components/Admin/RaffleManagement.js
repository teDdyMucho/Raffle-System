import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Pause,
  Play,
  Square,
  Trophy,
  Calendar,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { resolveImageUrl, TRANSPARENT_PIXEL } from '../../lib/imageUrl';
import { useToast } from '../../contexts/ToastContext';

const RaffleManagement = () => {
  const { show } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newRaffle, setNewRaffle] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTickets: '',
    ticketPrice: '',
    category: 'Electronics',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [raffles, setRaffles] = useState([]);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Live fetch from Supabase
  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRaffles(data || []);
    } catch (err) {
      console.error('Fetch raffles error:', err);
      show('Failed to fetch raffles from Supabase. Please verify RLS policies.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  const categories = ['Electronics', 'Gaming', 'Luxury', 'Fashion', 'Home'];
  const statuses = ['all', 'active', 'paused', 'inactive', 'completed', 'draft'];

  const filteredRaffles = raffles.filter(raffle => {
    const matchesSearch =
      (raffle.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (raffle.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateRaffle = async () => {
    try {
      setSaving(true);
      if (
        !newRaffle.title ||
        !newRaffle.startDate ||
        !newRaffle.endDate ||
        !newRaffle.maxTickets ||
        !newRaffle.ticketPrice
      ) {
        show('Please fill in all required fields.', { type: 'warning' });
        setSaving(false);
        return;
      }

      // Upload image to Supabase Storage if provided
      let imageUrl = newRaffle.imageUrl || '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `raffles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, {
            upsert: false,
            cacheControl: '3600',
            contentType: imageFile.type || 'image/*',
          });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = publicData?.publicUrl || '';
      }

      const payload = {
        title: newRaffle.title,
        description: newRaffle.description,
        category: newRaffle.category,
        start_date: newRaffle.startDate,
        end_date: newRaffle.endDate,
        max_tickets: Number(newRaffle.maxTickets),
        ticket_price: Number(newRaffle.ticketPrice),
        image_url: imageUrl,
        status: 'active',
      };

      if (editId) {
        const { error } = await supabase.from('raffles').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('raffles').insert([payload]);
        if (error) throw error;
      }

      setShowCreateModal(false);
      setNewRaffle({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        maxTickets: '',
        ticketPrice: '',
        category: 'Electronics',
        imageUrl: '',
      });
      setImageFile(null);
      setImagePreview('');
      setEditId(null);
      await fetchRaffles();
      show('Raffle saved to Supabase.', { type: 'success' });
    } catch (err) {
      console.error('Create raffle error:', err);
      show(`Failed to create raffle: ${err.message || err}`, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRaffleAction = async (raffle, action) => {
    try {
      let updates = {};
      if (action === 'pause') updates.status = 'paused';
      if (action === 'resume') updates.status = 'active';
      if (action === 'end') updates.status = 'completed';
      if (action === 'deactivate') updates.status = 'inactive';

      if (action === 'edit') {
        // Prefill modal for editing
        setNewRaffle({
          title: raffle.title || '',
          description: raffle.description || '',
          startDate: raffle.start_date || '',
          endDate: raffle.end_date || '',
          maxTickets: raffle.max_tickets || '',
          ticketPrice: raffle.ticket_price || '',
          category: raffle.category || 'Electronics',
          imageUrl: raffle.image_url || '',
        });
        setEditId(raffle.id);
        setImageFile(null);
        setShowCreateModal(true);
        return;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('raffles').update(updates).eq('id', raffle.id);
        if (error) throw error;
        await fetchRaffles();
        show(`Raffle ${action} successfully!`, { type: 'success' });
      }
    } catch (err) {
      console.error('Raffle action error:', err);
      show(`Failed to ${action} raffle: ${err.message || err}`, { type: 'error' });
    }
  };

  const drawWinner = raffleId => {
    // Mock winner selection
    const winners = ['John D.', 'Emma L.', 'Michael R.', 'Lisa K.', 'David P.'];
    const randomWinner = winners[Math.floor(Math.random() * winners.length)];
    show(`Winner selected: ${randomWinner}!`, { type: 'success' });
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'inactive':
        return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'inactive':
        return <Square className="w-4 h-4" />;
      case 'completed':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Raffle Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your raffle campaigns
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Raffle
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search raffles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all'
                    ? 'All Status'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Raffles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading raffles...
          </div>
        )}
        {!loading && filteredRaffles.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No raffles found</h3>
            <p className="text-sm">Create your first raffle to get started!</p>
          </div>
        )}
        {!loading &&
          filteredRaffles.map(raffle => (
            <div
              key={raffle.id}
              className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-l-primary-500"
            >
              {raffle.image_url && (
                <div className="mb-6 -mt-6 -mx-6">
                  <img
                    src={resolveImageUrl(raffle.image_url) || TRANSPARENT_PIXEL}
                    alt={raffle.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={e => {
                      e.currentTarget.src = TRANSPARENT_PIXEL;
                    }}
                  />
                </div>
              )}
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {raffle.title}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm ${getStatusColor(raffle.status)}`}
                    >
                      {getStatusIcon(raffle.status)}
                      <span className="ml-2">
                        {raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)}
                      </span>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                      {raffle.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                {raffle.description}
              </p>

              {/* Progress removed per request */}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">End Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {raffle.end_date ? new Date(raffle.end_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-gray-500 mr-1" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Ticket Price</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₱{raffle.ticket_price}
                  </p>
                </div>
              </div>

              {/* Winner (if completed) */}
              {raffle.status === 'completed' && raffle.winner && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg mb-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Winner: {raffle.winner}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {raffle.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'pause')}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </button>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'end')}
                      className="flex-1 btn-danger text-sm"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      End
                    </button>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'deactivate')}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'edit')}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </>
                )}

                {raffle.status === 'paused' && (
                  <>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'resume')}
                      className="flex-1 btn-primary text-sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </button>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'deactivate')}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleRaffleAction(raffle, 'edit')}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </>
                )}

                {raffle.status === 'completed' && !raffle.winner && (
                  <button
                    onClick={() => drawWinner(raffle.id)}
                    className="w-full btn-primary text-sm"
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    Draw Winner
                  </button>
                )}

                {raffle.status === 'completed' && raffle.winner && (
                  <button
                    onClick={() => handleRaffleAction(raffle.id, 'view')}
                    className="w-full btn-secondary text-sm"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Raffle
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newRaffle.title}
                    onChange={e => setNewRaffle({ ...newRaffle, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter raffle title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newRaffle.category}
                    onChange={e => setNewRaffle({ ...newRaffle, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newRaffle.description}
                  onChange={e => setNewRaffle({ ...newRaffle, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter raffle description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newRaffle.startDate}
                    onChange={e => setNewRaffle({ ...newRaffle, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newRaffle.endDate}
                    onChange={e => setNewRaffle({ ...newRaffle, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Tickets
                  </label>
                  <input
                    type="number"
                    value={newRaffle.maxTickets}
                    onChange={e => setNewRaffle({ ...newRaffle, maxTickets: e.target.value })}
                    className="input-field"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ticket Price (₱)
                  </label>
                  <input
                    type="number"
                    value={newRaffle.ticketPrice}
                    onChange={e => setNewRaffle({ ...newRaffle, ticketPrice: e.target.value })}
                    className="input-field"
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prize Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => setImagePreview(reader.result);
                      reader.readAsDataURL(f);
                    } else {
                      setImagePreview('');
                    }
                  }}
                  className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white hover:file:bg-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload an image of the prize (PNG/JPG).
                </p>
                {(imagePreview || newRaffle.imageUrl) && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                    <img
                      src={imagePreview || newRaffle.imageUrl}
                      alt="Selected image preview"
                      className="h-16 w-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleCreateRaffle}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Raffle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaffleManagement;
