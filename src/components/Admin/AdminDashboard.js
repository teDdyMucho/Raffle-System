import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminOverview from './AdminOverview';
import RaffleManagement from './RaffleManagement';
import UserManagement from './UserManagement';
import Reports from './Reports';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="raffles" element={<RaffleManagement />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="reports" element={<Reports />} />
    </Routes>
  );
};

export default AdminDashboard;
