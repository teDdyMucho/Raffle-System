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
    setToasts((t) => [...t, { id, msg, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id));
    }, 3000);
  };

  const fetchData = async () => {
    if (!code) { setRows([]); setLoading(false); return; }
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
      } catch (_) { /* column may not exist; default remains 10% */ }

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
          .select('id, user_id, amount_cents, status, referral_code, referal_code, meta, created_at')
          .eq('status', 'approved')
          .contains('meta', { referral_code: code });
        (d2 || []).forEach(r => all.set(r.id, r));
      } catch (_) { /* meta column may not exist, ignore */ }

      // 3) JSON meta.referal_code contains (common misspelling)
      try {
        const { data: d3 } = await supabase
          .from('user_wallet')
          .select('id, user_id, amount_cents, status, referral_code, referal_code, meta, created_at')
          .eq('status', 'approved')
          .contains('meta', { referal_code: code });
        (d3 || []).forEach(r => all.set(r.id, r));
      } catch (_) { /* ignore */ }

      const items = Array.from(all.values()).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
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
        setError(prev => prev ? prev : (persistErr.message || String(persistErr)));
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [code]);

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
  const maxWithdraw = useMemo(() => Number(fromCents(summary.commissionCents)), [summary.commissionCents]);
  const parsedAmount = Number(withdrawAmount || 0);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount >= minWithdraw && parsedAmount <= maxWithdraw;
  const accountValid = accountName.trim().length > 1 && accountNumber.trim().length > 3;
  const canSubmit = !withdrawLoading && amountValid && accountValid && (payoutMethod === 'gcash' || payoutMethod === 'bank');

  return (
    <div className={`card animate-fade-in ${compact ? '' : ''}`}>
      <div className={`${compact ? 'p-4' : 'p-6'} border-b border-magnolia-200 dark:border-blackswarm-700 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
        <div className="relative z-10">
          <h2 className={`${compact ? 'text-lg' : 'text-3xl'} font-bold gradient-text animate-slide-in`}>Commission Tracker</h2>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400 mt-2 animate-slide-in`} style={{animationDelay: '0.1s'}}>{(summary.rate*100).toFixed(2)}% commission on approved cash-ins attributed to your referral code.</p>
        </div>
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-red-500/10 rounded-full animate-float"></div>
      </div>

      <div className={`${compact ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
        {/* Stats */}
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-3' : 'sm:grid-cols-3 gap-4'}`}>
          <div className={`card group hover:scale-105 animate-slide-in ${compact ? 'p-3' : 'p-4'}`} style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400 font-medium`}>Unique Referred Users</span>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                <Users className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
              </div>
            </div>
            <div className={`mt-2 ${compact ? 'text-xl' : 'text-3xl'} font-bold gradient-text`}>{summary.uniqueUsers}</div>
          </div>
          <div className={`card group hover:scale-105 animate-slide-in ${compact ? 'p-3' : 'p-4'}`} style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400 font-medium`}>Total Cash-ins</span>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-white`}>₱</span>
              </div>
            </div>
            <div className={`mt-2 ${compact ? 'text-xl' : 'text-3xl'} font-bold gradient-text`}>₱{fromCents(summary.totalCents).toLocaleString()}</div>
          </div>
          <div className={`card group hover:scale-105 animate-slide-in ${compact ? 'p-3' : 'p-4'}`} style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400 font-medium`}>Your Commission ({(summary.rate*100).toFixed(2)}%)</span>
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-xl animate-pulse-subtle">
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-white`}>₱</span>
              </div>
            </div>
            <div className={`mt-2 ${compact ? 'text-xl' : 'text-3xl'} font-bold text-red-600 animate-pulse-subtle`}>₱{fromCents(summary.commissionCents).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between animate-slide-in" style={{animationDelay: '0.5s'}}>
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400`}>
            Referral code: <span className="font-mono font-semibold gradient-text bg-gradient-to-r from-red-500 to-red-600 px-2 py-1 rounded text-white">{code || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className={`btn-secondary group ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:hover:scale-100`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} /> 
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className={`btn-primary group ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-glow`}
            >
              <Wallet className="w-4 h-4 mr-2 group-hover:animate-float" /> 
              Withdraw
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto border border-magnolia-200 dark:border-blackswarm-700 rounded-lg ${compact ? 'max-h-56 overflow-y-auto' : ''}`}>
          <table className="min-w-full divide-y divide-magnolia-200 dark:divide-blackswarm-700">
            <thead className="bg-magnolia-100 dark:bg-blackswarm-900">
              <tr>
                <th className={`px-4 ${compact ? 'py-1 text-[10px]' : 'py-2 text-xs'} text-left font-semibold text-blackswarm-600 dark:text-magnolia-400`}>Date</th>
                <th className={`px-4 ${compact ? 'py-1 text-[10px]' : 'py-2 text-xs'} text-left font-semibold text-blackswarm-600 dark:text-magnolia-400`}>User</th>
                <th className={`px-4 ${compact ? 'py-1 text-[10px]' : 'py-2 text-xs'} text-left font-semibold text-blackswarm-600 dark:text-magnolia-400`}>Amount</th>
                <th className={`px-4 ${compact ? 'py-1 text-[10px]' : 'py-2 text-xs'} text-left font-semibold text-blackswarm-600 dark:text-magnolia-400`}>Commission ({(summary.rate*100).toFixed(2)}%)</th>
                {!compact && (
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blackswarm-600 dark:text-magnolia-400">Source</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-magnolia-200 dark:divide-blackswarm-700 bg-white dark:bg-blackswarm-900">
              {loading && (
                <tr><td className={`px-4 ${compact ? 'py-2 text-xs' : 'py-4 text-sm'} text-blackswarm-600 dark:text-magnolia-400`} colSpan={5}>Loading...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td className={`px-4 ${compact ? 'py-2 text-xs' : 'py-4 text-sm'} text-blackswarm-600 dark:text-magnolia-400`} colSpan={5}>No approved cash-ins attributed to your code yet.</td></tr>
              )}
              {!loading && (compact ? rows.slice(0, 8) : rows).map((r) => {
                const amt = Number(r.amount_cents) || 0;
                const commission = Math.round(amt * (commissionBps/10000));
                const src = r.referral_code === code ? 'referral_code' : (r.referal_code === code ? 'referal_code' : (r.meta?.referral_code === code ? 'meta.referral_code' : 'meta.referal_code'))
                return (
                  <tr key={r.id}>
                    <td className={`px-4 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} text-blackswarm-800 dark:text-magnolia-200`}>{new Date(r.created_at).toLocaleString()}</td>
                    <td className={`px-4 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} text-blackswarm-800 dark:text-magnolia-200`}>{r.user_id.slice(0,8)}…</td>
                    <td className={`px-4 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} text-blackswarm-800 dark:text-magnolia-200`}>₱{fromCents(amt).toLocaleString()}</td>
                    <td className={`px-4 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} text-bonfire-600`}>₱{fromCents(commission).toLocaleString()}</td>
                    {!compact && (
                      <td className="px-4 py-2 text-xs text-blackswarm-500 dark:text-magnolia-500">{src}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="text-sm text-bonfire-600 dark:text-bonfire-400">{error}</div>
        )}

        {showWithdraw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !withdrawLoading && setShowWithdraw(false)}></div>
            <div className="relative w-full max-w-md mx-auto rounded-2xl shadow-large border border-magnolia-200 dark:border-blackswarm-700 bg-white dark:bg-blackswarm-900 p-6 animate-slide-in glass">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold gradient-text mb-2">Withdraw Commission</h3>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl inline-block">
                  <span className="text-sm">Available: </span>
                  <span className="text-lg font-bold">₱{fromCents(summary.commissionCents).toLocaleString()}</span>
                </div>
                <p className="text-xs text-blackswarm-500 dark:text-magnolia-500 mt-2">Minimum ₱{minWithdraw.toLocaleString()}. Maximum ₱{Math.max(0, Math.floor(maxWithdraw)).toLocaleString()}.</p>
              </div>

              <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-2">Payout Method</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPayoutMethod('gcash')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${payoutMethod==='gcash' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium' : 'border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-100 hover:border-red-500 hover:scale-105'}`}
                >GCash</button>
                <button
                  onClick={() => setPayoutMethod('bank')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${payoutMethod==='bank' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium' : 'border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-700 dark:text-magnolia-100 hover:border-red-500 hover:scale-105'}`}
                >Bank</button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                    placeholder={payoutMethod==='gcash' ? 'GCash Number' : 'Bank Account Number'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    min={minWithdraw}
                    max={Math.max(0, Math.floor(maxWithdraw))}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-200 mb-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-900 text-blackswarm-900 dark:text-magnolia-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bonfire-500/50"
                    placeholder="Any additional details"
                  />
                </div>
                <p className="text-xs text-blackswarm-500 dark:text-magnolia-500">Payout processing time may apply. Fees or verification may be required.</p>
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
              <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-large text-sm font-medium animate-slide-in ${t.variant==='success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}`}>
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
    </div>
  );
};

export default AgentCommissionTracker;
