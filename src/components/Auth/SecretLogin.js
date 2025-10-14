import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const SecretLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const effectiveRole = (result.role || role);
        if (effectiveRole !== 'agent') {
          setError('Only agent accounts can sign in here.');
          show('Only agent accounts can sign in here.', { type: 'error' });
          return;
        }
        navigate('/agent?walletOnly=1');
      } else {
        setError(result.error || 'Unable to sign in');
        show(result.error || 'Unable to sign in', { type: 'error' });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      show('An unexpected error occurred', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Agent-only access</div>
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">This page is not linked in navigation. Access it only via direct URL.</p>
      </div>
    </div>
  );
};

export default SecretLogin;
