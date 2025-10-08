import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fromCents } from '../../lib/wallet';
import { Users, RefreshCw } from 'lucide-react';

const AgentCommissionTracker = ({ compact = false }) => {
  const { user } = useAuth();
  const code = user?.referal_code || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [commissionBps, setCommissionBps] = useState(1000); // basis points: 1000 = 10%

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

      setRows(Array.from(all.values()).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)));
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

  return (
    <div className={`bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg ${compact ? '' : ''}`}>
      <div className={`${compact ? 'p-4' : 'p-6'} border-b border-magnolia-200 dark:border-blackswarm-700`}>
        <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-blackswarm-900 dark:text-magnolia-50`}>Commission Tracker</h2>
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400 mt-1`}>{(summary.rate*100).toFixed(2)}% commission on approved cash-ins attributed to your referral code.</p>
      </div>

      <div className={`${compact ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
        {/* Stats */}
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-3' : 'sm:grid-cols-3 gap-4'}`}>
          <div className={`rounded-lg border border-magnolia-200 dark:border-blackswarm-700 ${compact ? 'p-3' : 'p-4'} bg-white/70 dark:bg-blackswarm-900/50`}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400`}>Unique Referred Users</span>
              <Users className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-bonfire-500`} />
            </div>
            <div className={`mt-1 ${compact ? 'text-xl' : 'text-2xl'} font-semibold text-blackswarm-900 dark:text-magnolia-50`}>{summary.uniqueUsers}</div>
          </div>
          <div className={`rounded-lg border border-magnolia-200 dark:border-blackswarm-700 ${compact ? 'p-3' : 'p-4'} bg-white/70 dark:bg-blackswarm-900/50`}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400`}>Total Cash-ins</span>
              <span className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} inline-flex items-center justify-center rounded text-bonfire-600 font-semibold`} aria-label="Philippine Peso">₱</span>
            </div>
            <div className={`mt-1 ${compact ? 'text-xl' : 'text-2xl'} font-semibold text-blackswarm-900 dark:text-magnolia-50`}>₱{fromCents(summary.totalCents).toLocaleString()}</div>
          </div>
          <div className={`rounded-lg border border-magnolia-200 dark:border-blackswarm-700 ${compact ? 'p-3' : 'p-4'} bg-white/70 dark:bg-blackswarm-900/50`}>
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400`}>Your Commission ({(summary.rate*100).toFixed(2)}%)</span>
              <span className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} inline-flex items-center justify-center rounded text-bonfire-600 font-semibold`} aria-label="Philippine Peso">₱</span>
            </div>
            <div className={`mt-1 ${compact ? 'text-xl' : 'text-2xl'} font-semibold text-bonfire-600`}>₱{fromCents(summary.commissionCents).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-blackswarm-600 dark:text-magnolia-400`}>Referral code: <span className="font-mono font-semibold text-blackswarm-900 dark:text-magnolia-50">{code || 'N/A'}</span></div>
          <button
            onClick={fetchData}
            disabled={loading}
            className={`inline-flex items-center ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-bonfire-500/50 
              border-magnolia-300 dark:border-blackswarm-600 
              text-blackswarm-700 dark:text-magnolia-100 
              bg-white/70 dark:bg-blackswarm-900/50 
              hover:bg-magnolia-100 dark:hover:bg-blackswarm-700 
              disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
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
      </div>
    </div>
  );
};

export default AgentCommissionTracker;
