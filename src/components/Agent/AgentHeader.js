import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  BarChart3, 
  Users, 
  Settings, 
  Headphones,
  TrendingUp,
  DollarSign,
  User,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';

const AgentHeader = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'user-support', label: 'User Support', icon: Headphones },
    { id: 'raffle-operations', label: 'Raffle Operations', icon: Settings },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'commission', label: 'Commission Tracker', icon: DollarSign },
    { id: 'media-library', label: 'Media Library', icon: ImageIcon },
  ];

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
  };

  const handleNavigation = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <header className="bg-magnolia-50 dark:bg-blackswarm-800 border-b border-magnolia-200 dark:border-blackswarm-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">🎟️</span>
              </div>
              <h1 className="text-xl font-bold text-blackswarm-900 dark:text-magnolia-50">
                Raffle Agent
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
          </nav>

          {/* Right side - Theme toggle and Profile */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-blackswarm-600 dark:text-magnolia-400 hover:text-bonfire-600 dark:hover:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-bonfire-400 to-embers-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-blackswarm-900 dark:text-magnolia-50">
                    {user?.name || 'Agent'}
                  </p>
                  <p className="text-xs text-blackswarm-500 dark:text-magnolia-400">
                    Agent
                  </p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-magnolia-50 dark:bg-blackswarm-800 rounded-md shadow-lg border border-magnolia-200 dark:border-blackswarm-700">
                  <div className="py-1">
                    <button
                      onClick={() => handleNavigation('profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-blackswarm-700 dark:text-magnolia-300 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigation('settings')}
                      className="flex items-center w-full px-4 py-2 text-sm text-blackswarm-700 dark:text-magnolia-300 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1 border-magnolia-200 dark:border-blackswarm-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-bonfire-600 dark:text-bonfire-400 hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AgentHeader;
