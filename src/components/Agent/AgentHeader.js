import React, { useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import appLogo from '../../images/allen (1).png';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  BarChart3, 
  DollarSign,
  User,
  LogOut,
  Settings
} from 'lucide-react';

const AgentHeader = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'commission', label: 'Commission Tracker', icon: DollarSign },
  ];
  const visibleMd = navigationItems.slice(0, 3);
  const overflowMd = navigationItems.slice(3);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-magnolia-50 dark:bg-blackswarm-800 border-b border-magnolia-200 dark:border-blackswarm-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 mr-6">
            <div className="flex-shrink-0 flex items-center">
              <ImageWithFallback src={appLogo} alt="Raffle Haven" className="h-12 w-12 mr-3 rounded" />
              <h1 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50">Raffle Haven</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center px-2 space-x-6 lg:space-x-12">
            {/* md: show first 3 + More; lg+: show all */}
            <div className="hidden lg:flex items-center gap-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      currentPage === item.id
                        ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                        : 'text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex lg:hidden items-center gap-6">
              {visibleMd.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      currentPage === item.id
                        ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                        : 'text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
              {/* More dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreOpen((v) => !v)}
                  className="px-4 py-2.5 rounded-md text-sm font-medium text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 transition-colors"
                >
                  More
                </button>
                {isMoreOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-magnolia-50 dark:bg-blackswarm-800 rounded-md shadow-lg border border-magnolia-200 dark:border-blackswarm-700 z-50">
                    <div className="py-1">
                      {overflowMd.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { handleNavigation(item.id); setIsMoreOpen(false); }}
                            className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                              currentPage === item.id
                                ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                                : 'text-blackswarm-700 dark:text-magnolia-300 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          </div>
          </nav>

          {/* Right side - Theme toggle and inline actions */}
          <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Inline actions (desktop) */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => handleNavigation('profile')}
                className="flex items-center px-3 py-2 rounded-md text-sm text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                onClick={() => handleNavigation('settings')}
                className="flex items-center px-3 py-2 rounded-md text-sm text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm text-bonfire-600 dark:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-magnolia-200 dark:border-blackswarm-700">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      currentPage === item.id
                        ? 'text-bonfire-600 dark:text-bonfire-400 bg-bonfire-50 dark:bg-bonfire-900/20'
                        : 'text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
              <div className="mt-2 pt-2 border-t border-magnolia-200 dark:border-blackswarm-700 space-y-1">
                <button
                  onClick={() => handleNavigation('profile')}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </button>
                <button
                  onClick={() => handleNavigation('settings')}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-bonfire-600 dark:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AgentHeader;
