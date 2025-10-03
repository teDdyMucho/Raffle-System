import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLanding from './UserLanding';
import JoinRaffles from './JoinRaffles';
import PastResults from './PastResults';
import UserProfile from './UserProfile';

const UserDashboard = () => {
  return (
    <Routes>
      <Route index element={<UserLanding />} />
      <Route path="join" element={<JoinRaffles />} />
      <Route path="results" element={<PastResults />} />
      <Route path="profile" element={<UserProfile />} />
    </Routes>
  );
};

export default UserDashboard;
