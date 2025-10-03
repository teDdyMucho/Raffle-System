import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Ticket, Trophy, Calendar, Edit3, Save, X } from 'lucide-react';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA'
  });

  // Mock user tickets data
  const userTickets = [
    {
      id: 1,
      raffleTitle: 'iPhone 15 Pro Giveaway',
      ticketNumber: '123456',
      purchaseDate: '2024-01-20',
      status: 'active',
      prize: '$1,199',
      endDate: '2024-01-25'
    },
    {
      id: 2,
      raffleTitle: 'Gaming Setup Bundle',
      ticketNumber: '789012',
      purchaseDate: '2024-01-18',
      status: 'active',
      prize: '$2,500',
      endDate: '2024-01-27'
    },
    {
      id: 3,
      raffleTitle: 'iPad Pro 12.9" Giveaway',
      ticketNumber: '345678',
      purchaseDate: '2024-01-10',
      status: 'completed',
      prize: '$1,099',
      endDate: '2024-01-15',
      result: 'lost'
    },
    {
      id: 4,
      raffleTitle: 'AirPods Pro 2 Bundle',
      ticketNumber: '901234',
      purchaseDate: '2024-01-05',
      status: 'completed',
      prize: '$249',
      endDate: '2024-01-10',
      result: 'lost'
    }
  ];

  const handleSaveProfile = async () => {
    try {
      // Persist only supported fields for now (name)
      const { success, error } = await updateProfile({ name: editedUser.name });
      if (!success) throw new Error(error || 'Failed to update profile');
      setIsEditing(false);
      alert('Profile updated');
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

  const activeTickets = userTickets.filter(ticket => ticket.status === 'active');
  const completedTickets = userTickets.filter(ticket => ticket.status === 'completed');
  const totalSpent = userTickets.length * 25; // Mock calculation

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
                {isEditing ? (
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{editedUser.email}</p>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{userTickets.length}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
            </div>
            
            <div className="card text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 font-bold">$</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">${totalSpent}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Tickets History */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Tickets</h2>

            {/* Active Tickets */}
            {activeTickets.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active Tickets ({activeTickets.length})
                </h3>
                <div className="space-y-4">
                  {activeTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.raffleTitle}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ticket #{ticket.ticketNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status, ticket.result)}`}>
                            {getStatusText(ticket.status, ticket.result)}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {ticket.prize}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <span>Ends: {new Date(ticket.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tickets */}
            {completedTickets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  Past Tickets ({completedTickets.length})
                </h3>
                <div className="space-y-4">
                  {completedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 opacity-75"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.raffleTitle}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ticket #{ticket.ticketNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status, ticket.result)}`}>
                            {getStatusText(ticket.status, ticket.result)}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {ticket.prize}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <span>Ended: {new Date(ticket.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userTickets.length === 0 && (
              <div className="text-center py-8">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't joined any raffles yet. Start by joining an active raffle!
                </p>
                <a href="/user/join" className="btn-primary">
                  Join a Raffle
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
