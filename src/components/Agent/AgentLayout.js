import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AgentHeader from './AgentHeader';
import AgentDashboard from './AgentDashboard';
import AgentWalletDashboard from './AgentWalletDashboard';
import ImageManager from './ImageManager';
import AgentProfile from './AgentProfile';
import AgentSettings from './AgentSettings';
import AgentCommissionTracker from './AgentCommissionTracker';

const AgentLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const walletOnly = params.get('walletOnly') === '1';

  const handleNavigation = (pageId) => {
    if (walletOnly && pageId !== 'wallet') return; // lock to wallet when flagged
    setCurrentPage(pageId);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'wallet':
        return walletOnly ? <AgentWalletDashboard /> : <AgentDashboard onNavigate={handleNavigation} />;
      case 'dashboard':
        return <AgentDashboard onNavigate={handleNavigation} />;
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
        return <AgentCommissionTracker />;
      case 'profile':
        return <AgentProfile />;
      case 'settings':
        return <AgentSettings />;
      default:
        return <AgentDashboard onNavigate={handleNavigation} />;
    }
  };

  useEffect(() => {
    if (walletOnly) setCurrentPage('wallet');
    if (!walletOnly && currentPage === 'wallet') setCurrentPage('dashboard');
  }, [walletOnly, currentPage]);

  return (
    <div className="min-h-screen bg-magnolia-100 dark:bg-blackswarm-900">
      <AgentHeader walletOnly={walletOnly} currentPage={currentPage} onNavigate={handleNavigation} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default AgentLayout;
