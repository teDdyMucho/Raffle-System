import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const validatePassword = pwd => {
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Za-z]/.test(pwd)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const validateEmail = email => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'Please enter a valid email address';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      show('Email and password are required', { type: 'error' });
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      show(emailErr, { type: 'error' });
      return;
    }

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      show(pwdErr, { type: 'error' });
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      show('Passwords do not match', { type: 'error' });
      return;
    }

    setLoading(true);
    const res = await signUp({ email, password, name });
    setLoading(false);

    if (res.success) {
      show('Account created successfully! Welcome to Raffle System!', {
        type: 'success',
        duration: 4000,
      });
      // Only regular users can sign up; send them to user area
      navigate('/user');
    } else {
      const errorMsg = res.error || 'Failed to create account';
      setError(errorMsg);
      show(errorMsg, { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-magnolia-50 to-magnolia-100 dark:from-blackswarm-900 dark:to-blackswarm-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-bonfire-500 to-embers-500 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-blackswarm-900 dark:text-magnolia-50">
            Create your account
          </h2>
          <p className="mt-2 text-blackswarm-600 dark:text-magnolia-400">
            Join the Raffle System to start winning!
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg p-6 space-y-4">
            {/* Role Selection removed: only users can sign up */}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
              >
                Display Name{' '}
                <span className="text-xs text-blackswarm-500 dark:text-magnolia-500">
                  (optional)
                </span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-magnolia-300 dark:border-blackswarm-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-bonfire-500 dark:bg-blackswarm-700 dark:text-magnolia-50"
                placeholder="e.g., John User"
              />
            </div>

            {/* Email */}
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
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 hover:text-blackswarm-600 dark:hover:text-magnolia-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-blackswarm-500 dark:text-magnolia-500 mt-1">
                At least 6 characters with letters and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 w-5 h-5" />
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-magnolia-300 dark:border-blackswarm-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-bonfire-500 dark:bg-blackswarm-700 dark:text-magnolia-50"
                  placeholder="Retype your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blackswarm-400 dark:text-magnolia-400 hover:text-blackswarm-600 dark:hover:text-magnolia-300"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-bonfire-50 dark:bg-bonfire-900/20 border border-bonfire-200 dark:border-bonfire-800 rounded-lg p-3">
                <p className="text-sm text-bonfire-600 dark:text-bonfire-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-bonfire-500 to-embers-500 text-white py-2 px-4 rounded-lg hover:from-bonfire-600 hover:to-embers-600 focus:outline-none focus:ring-2 focus:ring-bonfire-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-blackswarm-600 dark:text-magnolia-400">
              Already have an account?{' '}
              <Link to="/login" className="text-bonfire-600 dark:text-bonfire-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
