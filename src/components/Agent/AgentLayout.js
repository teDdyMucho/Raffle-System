import React, { useState } from 'react';
import AgentHeader from './AgentHeader';
import AgentDashboard from './AgentDashboard';
import ImageManager from './ImageManager';

const AgentLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AgentDashboard />;
      case 'media-library':
        return <ImageManager />;
      case 'user-support':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              User Support
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              User support tools and ticket management coming soon...
            </p>
          </div>
        );
      case 'raffle-operations':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Raffle Operations
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              Raffle management and operations tools coming soon...
            </p>
          </div>
        );
      case 'insights':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Insights & Analytics
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              Detailed analytics and insights coming soon...
            </p>
          </div>
        );
      case 'commission':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Commission Tracker
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              Commission tracking and earnings overview coming soon...
            </p>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Agent Profile
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              Profile management coming soon...
            </p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Settings
            </h2>
            <p className="text-blackswarm-600 dark:text-magnolia-400">
              Agent settings and preferences coming soon...
            </p>
          </div>
        );
      default:
        return <AgentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-magnolia-100 dark:bg-blackswarm-900">
      <AgentHeader currentPage={currentPage} onNavigate={handleNavigation} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default AgentLayout;
