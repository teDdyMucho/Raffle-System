import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Headphones, Mail, Lock } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

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

  const handleSubmit = async (e) => {
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

  const demoCredentials = [
    { email: 'user@raffle.com', password: 'user123', role: 'user', name: 'Demo User' },
    { email: 'agent@raffle.com', password: 'agent123', role: 'agent', name: 'Demo Agent' }
  ];

  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setRole(demo.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-magnolia-50 to-magnolia-100 dark:from-blackswarm-900 dark:to-blackswarm-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">🎟️</span>
          </div>
          <h2 className="text-3xl font-bold text-blackswarm-900 dark:text-magnolia-50">
            Raffle System
          </h2>
          <p className="mt-2 text-blackswarm-600 dark:text-magnolia-400">
            Sign in to access your account
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-bonfire-50 dark:bg-bonfire-900/20 border border-bonfire-200 dark:border-bonfire-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-bonfire-800 dark:text-bonfire-200 mb-2">Demo Credentials:</h3>
          <div className="space-y-2">
            {demoCredentials.map((demo, index) => (
              <button
                key={index}
                onClick={() => fillDemo(demo)}
                className="w-full text-left text-xs bg-magnolia-50 dark:bg-blackswarm-800 border border-bonfire-200 dark:border-bonfire-700 rounded px-3 py-2 hover:bg-bonfire-50 dark:hover:bg-bonfire-900/30 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-blackswarm-700 dark:text-magnolia-300">{demo.email}</span>
                  <span className="text-bonfire-600 dark:text-bonfire-400 font-medium capitalize">{demo.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

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
              <label htmlFor="email" className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-magnolia-300 dark:border-blackswarm-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-bonfire-500 dark:bg-blackswarm-700 dark:text-magnolia-50"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">
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
                  onChange={(e) => setPassword(e.target.value)}
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
          <Link to="/signup" className="text-bonfire-600 dark:text-bonfire-400 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
