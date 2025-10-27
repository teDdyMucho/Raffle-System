import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fromCents } from '../../lib/wallet';
import { Users, RefreshCw, Wallet } from 'lucide-react';

const AgentCommissionTracker = ({ compact = false }) => {
  const { user } = useAuth();
  const code = user?.referal_code || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [commissionBps, setCommissionBps] = useState(1000); // basis points: 1000 = 10%
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [toasts, setToasts] = useState([]);

  const minWithdraw = 100;

  const pushToast = (msg, variant = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(t => [...t, { id, msg, variant }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 3000);
  };

  const fetchData = async () => {
    if (!code) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    const all = new Map();
    try {
      // Read commission setting for this agent from app_users
      try {
        const { data: me, error: meErr } = await supabase
          .from('app_users')
          .select('commission_bps, commission_pct')
          .eq('id', user.id)
          .maybeSingle();
        if (!meErr && me) {
          if (Number.isFinite(Number(me.commission_bps))) {
            setCommissionBps(Math.max(0, Math.floor(Number(me.commission_bps))));
          } else if (Number.isFinite(Number(me.commission_pct))) {
            // convert percent to basis points
            setCommissionBps(Math.max(0, Math.floor(Number(me.commission_pct) * 100)));
          }
        }
      } catch (_) {
        /* column may not exist; default remains 10% */
      }

      // 1) Top-level referral_code or referal_code
      const { data: d1, error: e1 } = await supabase
        .from('user_wallet')
        .select('id, user_id, amount_cents, status, referral_code, referal_code, meta, created_at')
        .eq('status', 'approved')
        .or(`referral_code.eq.${code},referal_code.eq.${code}`);
      if (e1) throw e1;
      (d1 || []).forEach(r => all.set(r.id, r));

      // 2) JSON meta.referral_code contains
      try {
        const { data: d2 } = await supabase
          .from('user_wallet')
          .select(
            'id, user_id, amount_cents, status, referral_code, referal_code, meta, created_at'
          )
          .eq('status', 'approved')
          .contains('meta', { referral_code: code });
        (d2 || []).forEach(r => all.set(r.id, r));
      } catch (_) {
        /* meta column may not exist, ignore */
      }

      // 3) JSON meta.referal_code contains (common misspelling)
      try {
        const { data: d3 } = await supabase
          .from('user_wallet')
          .select(
            'id, user_id, amount_cents, status, referral_code, referal_code, meta, created_at'
          )
          .eq('status', 'approved')
          .contains('meta', { referal_code: code });
        (d3 || []).forEach(r => all.set(r.id, r));
      } catch (_) {
        /* ignore */
      }

      const items = Array.from(all.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setRows(items);

      // Persist computed commission to app_users.balance_cents for this agent
      try {
        const totalCents = items.reduce((sum, r) => sum + (Number(r.amount_cents) || 0), 0);
        const rate = Math.max(0, commissionBps) / 10000;
        const commissionCents = Math.round(totalCents * rate);
        if (user?.id) {
          const { error: upErr } = await supabase
            .from('app_users')
            .update({ balance_cents: commissionCents })
            .eq('id', user.id);
          if (upErr) throw upErr;
        }
      } catch (persistErr) {
        // Show but don't break UI
        setError(prev => (prev ? prev : persistErr.message || String(persistErr)));
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [code]);

  const summary = useMemo(() => {
    const totalsByUser = new Map();
    let totalCents = 0;
    for (const r of rows) {
      const cents = Number(r.amount_cents) || 0;
      totalCents += cents;
      const curr = totalsByUser.get(r.user_id) || 0;
      totalsByUser.set(r.user_id, curr + cents);
    }
    const uniqueUsers = totalsByUser.size;
    const rate = Math.max(0, commissionBps) / 10000; // basis points -> fraction
    const commissionCents = Math.round(totalCents * rate);
    return { uniqueUsers, totalCents, commissionCents, rate };
  }, [rows, commissionBps]);

  // Derived validations that depend on `summary`
  const maxWithdraw = useMemo(
    () => Number(fromCents(summary.commissionCents)),
    [summary.commissionCents]
  );
  const parsedAmount = Number(withdrawAmount || 0);
  const amountValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount >= minWithdraw &&
    parsedAmount <= maxWithdraw;
  const accountValid = accountName.trim().length > 1 && accountNumber.trim().length > 3;
  const canSubmit =
    !withdrawLoading &&
    amountValid &&
    accountValid &&
    (payoutMethod === 'gcash' || payoutMethod === 'bank');

  return (
    <div
      className={`${compact ? 'max-w-4xl mx-auto' : 'max-w-6xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8`}
    >
      <div className="dashboard-header animate-fade-in mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold mb-2`}>
              Commission Tracker
            </h1>
            <p className="text-slate-300 text-base">
              {(summary.rate * 100).toFixed(2)}% commission on approved cash-ins attributed to your
              referral code
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-right">
              <div className="text-2xl font-bold">
                ₱{fromCents(summary.commissionCents).toLocaleString()}
              </div>
              <div className="text-slate-300 text-sm">Your Commission</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-4' : 'sm:grid-cols-3 gap-6'} mb-8`}
      >
        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-label">Unique Referred Users</div>
          <div className="stat-value">{summary.uniqueUsers}</div>
        </div>

        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-label">Total Cash-ins</div>
          <div className="stat-value">₱{fromCents(summary.totalCents).toLocaleString()}</div>
        </div>

        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-label">Commission Rate</div>
          <div className="stat-value">{(summary.rate * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="card mb-6 animate-slide-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Referral code:{' '}
              <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                {code || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="modern-button bg-slate-600 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="modern-button bg-blue-600 hover:bg-blue-700"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card animate-slide-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="section-title">Recent Transactions</h2>
        <div className={`overflow-x-auto ${compact ? 'max-h-56 overflow-y-auto' : ''}`}>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th
                  className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-left font-medium text-slate-600 dark:text-slate-400`}
                >
                  Date
                </th>
                <th
                  className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-left font-medium text-slate-600 dark:text-slate-400`}
                >
                  User
                </th>
                <th
                  className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-left font-medium text-slate-600 dark:text-slate-400`}
                >
                  Amount
                </th>
                <th
                  className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-left font-medium text-slate-600 dark:text-slate-400`}
                >
                  Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className={`px-4 ${compact ? 'py-4' : 'py-8'} text-center text-slate-600 dark:text-slate-400`}
                  >
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className={`px-4 ${compact ? 'py-4' : 'py-8'} text-center text-slate-600 dark:text-slate-400`}
                  >
                    No transactions found for your referral code.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td
                      className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-slate-900 dark:text-slate-100`}
                    >
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td
                      className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-slate-900 dark:text-slate-100`}
                    >
                      {row.user_id}
                    </td>
                    <td
                      className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-slate-900 dark:text-slate-100 font-medium`}
                    >
                      ₱{fromCents(row.amount_cents).toLocaleString()}
                    </td>
                    <td
                      className={`px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} text-blue-600 dark:text-blue-400 font-semibold`}
                    >
                      ₱{fromCents(Math.round(row.amount_cents * summary.rate)).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400 mt-4">{error}</div>}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !withdrawLoading && setShowWithdraw(false)}
          ></div>
          <div className="relative w-full max-w-md mx-auto rounded-2xl shadow-large border border-magnolia-200 dark:border-blackswarm-700 bg-white dark:bg-blackswarm-900 p-6 animate-slide-in glass">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold gradient-text mb-2">Withdraw Commission</h3>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl inline-block">
                <span className="text-sm">Available: </span>
                <span className="text-lg font-bold">
                  ₱{fromCents(summary.commissionCents).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-blackswarm-500 dark:text-magnolia-500 mt-2">
                Minimum ₱{minWithdraw.toLocaleString()}. Maximum ₱
                {Math.max(0, Math.floor(maxWithdraw)).toLocaleString()}.
              </p>
            </div>

            <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-2">
              Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setPayoutMethod('gcash')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${payoutMethod === 'gcash' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium' : 'border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-100 hover:border-red-500 hover:scale-105'}`}
              >
                GCash
              </button>
              <button
                onClick={() => setPayoutMethod('bank')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${payoutMethod === 'bank' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium' : 'border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-100 hover:border-red-500 hover:scale-105'}`}
              >
                Bank
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                  placeholder={payoutMethod === 'gcash' ? 'GCash Number' : 'Bank Account Number'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">
                  Amount (₱)
                </label>
                <input
                  type="number"
                  min={minWithdraw}
                  max={Math.max(0, Math.floor(maxWithdraw))}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                  placeholder="Any additional details"
                />
              </div>
              <p className="text-xs text-blackswarm-500 dark:text-magnolia-500">
                Payout processing time may apply. Fees or verification may be required.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                disabled={withdrawLoading}
                onClick={() => setShowWithdraw(false)}
                className="btn-secondary px-6 py-3 text-sm rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                Cancel
              </button>
              <button
                disabled={!canSubmit}
                onClick={async () => {
                  try {
                    setWithdrawLoading(true);
                    if (!amountValid) {
                      pushToast('Enter a valid amount within limits', 'error');
                      return;
                    }
                    if (!accountValid) {
                      pushToast('Enter a valid account name and number', 'error');
                      return;
                    }
                    pushToast('Withdrawal request submitted', 'success');
                    setShowWithdraw(false);
                    setWithdrawAmount('');
                    setAccountName('');
                    setAccountNumber('');
                    setNotes('');
                  } finally {
                    setWithdrawLoading(false);
                  }
                }}
                className="btn-primary px-8 py-3 text-sm rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 shadow-glow"
              >
                {withdrawLoading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Request Withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!!toasts.length && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`px-6 py-4 rounded-2xl shadow-large text-sm font-medium animate-slide-in ${t.variant === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}`}
            >
              <div className="flex items-center">
                {t.variant === 'success' ? (
                  <div className="w-5 h-5 mr-3 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 mr-3 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-white"></div>
                  </div>
                )}
                {t.msg}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentCommissionTracker;
