import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Lock, 
  Shield, 
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const AgentSettings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { show } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
    securityAlerts: true,
    twoFactorAuth: false
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      show('Settings saved successfully!', { type: 'success' });
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-magnolia-200 dark:border-blackswarm-700">
        <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50">
          Agent Settings
        </h2>
        <p className="text-blackswarm-600 dark:text-magnolia-400 mt-1">
          Customize your experience and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-8">
          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-medium text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Appearance
            </h3>
            <div className="bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isDark ? <Moon className="w-5 h-5 text-bonfire-400 mr-3" /> : <Sun className="w-5 h-5 text-bonfire-500 mr-3" />}
                  <div>
                    <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-sm text-blackswarm-500 dark:text-magnolia-400">
                      {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-md bg-magnolia-200 dark:bg-blackswarm-600 hover:bg-magnolia-300 dark:hover:bg-blackswarm-500 transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5 text-magnolia-50" /> : <Moon className="w-5 h-5 text-blackswarm-800" />}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h3 className="text-lg font-medium text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-bonfire-500 dark:text-bonfire-400 mr-3" />
                  <div>
                    <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">Email Notifications</p>
                    <p className="text-sm text-blackswarm-500 dark:text-magnolia-400">Receive updates via email</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('emailNotifications')}
                  className="text-bonfire-600 dark:text-bonfire-400"
                >
                  {settings.emailNotifications ? 
                    <ToggleRight className="w-8 h-8" /> : 
                    <ToggleLeft className="w-8 h-8" />
                  }
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-bonfire-500 dark:text-bonfire-400 mr-3" />
                  <div>
                    <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">Push Notifications</p>
                    <p className="text-sm text-blackswarm-500 dark:text-magnolia-400">Receive alerts on your device</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('pushNotifications')}
                  className="text-bonfire-600 dark:text-bonfire-400"
                >
                  {settings.pushNotifications ? 
                    <ToggleRight className="w-8 h-8" /> : 
                    <ToggleLeft className="w-8 h-8" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h3 className="text-lg font-medium text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Language & Region
            </h3>
            <div className="bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Globe className="w-5 h-5 text-bonfire-500 dark:text-bonfire-400 mr-3" />
                <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">Language</p>
              </div>
              <select
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="w-full bg-magnolia-50 dark:bg-blackswarm-800 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-2 px-3 text-blackswarm-900 dark:text-magnolia-50 focus:ring-2 focus:ring-bonfire-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h3 className="text-lg font-medium text-blackswarm-900 dark:text-magnolia-50 mb-4">
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-bonfire-500 dark:text-bonfire-400 mr-3" />
                  <div>
                    <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">Security Alerts</p>
                    <p className="text-sm text-blackswarm-500 dark:text-magnolia-400">Get notified about suspicious activities</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('securityAlerts')}
                  className="text-bonfire-600 dark:text-bonfire-400"
                >
                  {settings.securityAlerts ? 
                    <ToggleRight className="w-8 h-8" /> : 
                    <ToggleLeft className="w-8 h-8" />
                  }
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-bonfire-500 dark:text-bonfire-400 mr-3" />
                  <div>
                    <p className="text-blackswarm-900 dark:text-magnolia-50 font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-blackswarm-500 dark:text-magnolia-400">Add an extra layer of security</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('twoFactorAuth')}
                  className="text-bonfire-600 dark:text-bonfire-400"
                >
                  {settings.twoFactorAuth ? 
                    <ToggleRight className="w-8 h-8" /> : 
                    <ToggleLeft className="w-8 h-8" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-bonfire-500 to-embers-500 hover:from-bonfire-600 hover:to-embers-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bonfire-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgentSettings;
