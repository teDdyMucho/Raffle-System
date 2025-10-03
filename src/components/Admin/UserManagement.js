import React, { useState } from 'react';
import { Search, Filter, UserCheck, UserX, Mail, Calendar, Ticket, Ban, CheckCircle } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Mock users data
  const users = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      email: 'sarah.m@email.com',
      joinDate: '2024-01-15',
      status: 'active',
      totalTickets: 12,
      totalSpent: 84,
      lastActivity: '2024-01-22',
      rafflesWon: 1,
      avatar: 'S'
    },
    {
      id: 2,
      name: 'John Davis',
      email: 'john.davis@email.com',
      joinDate: '2024-01-10',
      status: 'active',
      totalTickets: 8,
      totalSpent: 56,
      lastActivity: '2024-01-21',
      rafflesWon: 0,
      avatar: 'J'
    },
    {
      id: 3,
      name: 'Emma Lopez',
      email: 'emma.lopez@email.com',
      joinDate: '2024-01-05',
      status: 'active',
      totalTickets: 15,
      totalSpent: 105,
      lastActivity: '2024-01-20',
      rafflesWon: 2,
      avatar: 'E'
    },
    {
      id: 4,
      name: 'Michael Roberts',
      email: 'michael.r@email.com',
      joinDate: '2023-12-28',
      status: 'banned',
      totalTickets: 3,
      totalSpent: 21,
      lastActivity: '2024-01-18',
      rafflesWon: 0,
      avatar: 'M'
    },
    {
      id: 5,
      name: 'Lisa Kim',
      email: 'lisa.kim@email.com',
      joinDate: '2023-12-20',
      status: 'active',
      totalTickets: 22,
      totalSpent: 154,
      lastActivity: '2024-01-22',
      rafflesWon: 1,
      avatar: 'L'
    },
    {
      id: 6,
      name: 'David Park',
      email: 'david.park@email.com',
      joinDate: '2023-12-15',
      status: 'inactive',
      totalTickets: 5,
      totalSpent: 35,
      lastActivity: '2024-01-10',
      rafflesWon: 0,
      avatar: 'D'
    },
    {
      id: 7,
      name: 'Anna Wilson',
      email: 'anna.wilson@email.com',
      joinDate: '2024-01-12',
      status: 'active',
      totalTickets: 9,
      totalSpent: 63,
      lastActivity: '2024-01-22',
      rafflesWon: 0,
      avatar: 'A'
    },
    {
      id: 8,
      name: 'James Brown',
      email: 'james.brown@email.com',
      joinDate: '2024-01-08',
      status: 'active',
      totalTickets: 18,
      totalSpent: 126,
      lastActivity: '2024-01-21',
      rafflesWon: 1,
      avatar: 'J'
    }
  ];

  const statuses = ['all', 'active', 'inactive', 'banned'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedUsers = filteredUsers.slice(startIdx, endIdx);

  const handleUserAction = (userId, action) => {
    console.log(`${action} user ${userId}`);
    alert(`User ${action} successfully!`);
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    console.log(`${action} users:`, selectedUsers);
    alert(`${action} applied to ${selectedUsers.length} users`);
    setSelectedUsers([]);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const pageIds = pagedUsers.map(u => u.id);
    const allSelectedOnPage = pageIds.every(id => selectedUsers.includes(id));
    if (allSelectedOnPage) {
      setSelectedUsers(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedUsers(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <UserCheck className="w-4 h-4" />;
      case 'inactive': return <UserX className="w-4 h-4" />;
      case 'banned': return <Ban className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const bannedUsers = users.filter(u => u.status === 'banned').length;
  const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user accounts and monitor user activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalUsers}</h3>
          <p className="text-gray-600 dark:text-gray-400">Total Users</p>
        </div>
        
        <div className="card text-center">
          <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeUsers}</h3>
          <p className="text-gray-600 dark:text-gray-400">Active Users</p>
        </div>
        
        <div className="card text-center">
          <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{bannedUsers}</h3>
          <p className="text-gray-600 dark:text-gray-400">Banned Users</p>
        </div>
        
        <div className="card text-center">
          <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">$</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${totalRevenue}</h3>
          <p className="text-gray-600 dark:text-gray-400">Total Revenue</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="btn-primary text-sm"
                >
                  Activate ({selectedUsers.length})
                </button>
                <button
                  onClick={() => handleBulkAction('ban')}
                  className="btn-danger text-sm"
                >
                  Ban ({selectedUsers.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={pagedUsers.length > 0 && pagedUsers.every(u => selectedUsers.includes(u.id))}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pagedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span className="ml-1">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Joined: {new Date(user.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last active: {new Date(user.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Ticket className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs">{user.totalTickets} tickets</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ${user.totalSpent} spent
                      </div>
                      {user.rafflesWon > 0 && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          🏆 {user.rafflesWon} wins
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleUserAction(user.id, 'ban')}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Ban
                        </button>
                      )}
                      {user.status === 'banned' && (
                        <button
                          onClick={() => handleUserAction(user.id, 'unban')}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          Unban
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'view')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{filteredUsers.length === 0 ? 0 : startIdx + 1}-{Math.min(endIdx, filteredUsers.length)}</span> of{' '}
              <span className="font-medium">{filteredUsers.length}</span> users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`btn-secondary text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`btn-secondary text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
