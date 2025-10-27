import React, { useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import appLogo from '../../images/allen (1).png';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Headphones, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, role);

      if (result.success) {
        show('Signed in successfully', { type: 'success' });
        // Redirect based on role
        const effectiveRole = result.role || role;
        if (effectiveRole === 'agent') {
          navigate('/agent');
        } else {
          navigate('/user');
        }
      } else {
        setError(result.error);
        show(result.error, { type: 'error' });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      show('An unexpected error occurred', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials removed for production

  return (
    <div className="min-h-screen bg-gradient-to-br from-magnolia-50 to-magnolia-100 dark:from-blackswarm-900 dark:to-blackswarm-800 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white/80 dark:bg-blackswarm-800 text-blackswarm-800 dark:text-magnolia-200 shadow hover:bg-white dark:hover:bg-blackswarm-700 transition"
        aria-label="Toggle theme"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="text-sm hidden sm:inline">{isDark ? 'Light' : 'Dark'} Mode</span>
      </button>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden mb-6 shadow-xl ring-2 ring-bonfire-500/30">
            <ImageWithFallback
              src={appLogo}
              alt="Raffle Haven"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-blackswarm-900 dark:text-magnolia-50">
            Raffle Haven
          </h2>
          <p className="mt-2 text-blackswarm-600 dark:text-magnolia-400">
            Sign in to access your account
          </p>
        </div>

        {/* Demo credentials UI removed */}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6 space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-2">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    role === 'user'
                      ? 'border-bonfire-500 bg-bonfire-50 dark:bg-bonfire-900/20 text-bonfire-700 dark:text-bonfire-300'
                      : 'border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-300 hover:border-magnolia-400 dark:hover:border-blackswarm-500'
                  }`}
                >
                  <User className="w-5 h-5 mr-2" />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('agent')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    role === 'agent'
                      ? 'border-bonfire-500 bg-bonfire-50 dark:bg-bonfire-900/20 text-bonfire-700 dark:text-bonfire-300'
                      : 'border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-300 hover:border-magnolia-400 dark:hover:border-blackswarm-500'
                  }`}
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  Agent
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-magnolia-300 dark:border-blackswarm-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-bonfire-500 dark:bg-blackswarm-700 dark:text-magnolia-50"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-magnolia-300 dark:border-blackswarm-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-bonfire-500 dark:bg-blackswarm-700 dark:text-magnolia-50"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 hover:text-blackswarm-600 dark:hover:text-magnolia-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-bonfire-50 dark:bg-bonfire-900/20 border border-bonfire-200 dark:border-bonfire-800 rounded-lg p-3">
                <p className="text-sm text-bonfire-600 dark:text-bonfire-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-bonfire-500 to-embers-500 text-white py-2 px-4 rounded-lg hover:from-bonfire-600 hover:to-embers-600 focus:outline-none focus:ring-2 focus:ring-bonfire-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-blackswarm-600 dark:text-magnolia-400">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-bonfire-600 dark:text-bonfire-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
