import React from 'react';
import UserHeader from './UserHeader';

const UserLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-magnolia-100 dark:bg-blackswarm-900">
      <UserHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
