import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { fromCents } from '../../lib/wallet';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 25;

const AgentWalletDashboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState(''); // user_id or email if available
  const [savingId, setSavingId] = useState(null);
  const { show } = useToast();
  const { user } = useAuth();

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('user_wallet')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter) query = query.eq('status', statusFilter);
      // If there is an email column, this will filter; otherwise it will simply be ignored by DB (error-free if column missing?)
      // To be safe, we only filter by user_id here; full-text search can be added if you expose a view.
      if (search) {
        // heuristic: if uuid-ish, filter user_id; else try referral_code columns
        const looksUuid = /[0-9a-fA-F-]{8,}/.test(search);
        if (looksUuid) {
          query = query.eq('user_id', search);
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
      setTotal(count || 0);
    } catch (e) {
      setError(e.message || String(e));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const updateStatus = async (row, next) => {
    if (!row?.id) return;
    const newStatus = String(next || '').trim();
    if (!['pending', 'approved', 'rejected'].includes(newStatus)) return;
    setSavingId(row.id);
    // Optimistic UI update
    const prevRows = rows;
    setRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r)));
    try {
      const rpc = await supabase.rpc('update_wallet_status', {
        p_id: row.id,
        p_status: newStatus,
      });
      if (rpc.error) throw rpc.error;
      let updated = rpc.data;
      if (!updated) {
        // Retry fetch of the row if update returned no rows
        const q = await supabase
          .from('user_wallet')
          .select('*')
          .eq('id', row.id)
          .limit(1);
        if (!q.error && Array.isArray(q.data)) updated = q.data[0];
      }
      // Verify by reading back the row
      const verify = await supabase
        .from('user_wallet')
        .select('id, status')
        .eq('id', row.id)
        .limit(1);
      const verified = Array.isArray(verify.data) ? verify.data[0] : null;
      if (!verify.error && verified && String(verified.status) === newStatus) {
        // Ensure row reflects any DB-side mutations
        if (updated) {
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
        }
        show('Status updated', { type: 'success' });
        // Hard refresh current page to stay consistent with filters
        fetchWallet();
      } else {
        // Revert if not actually written
        setRows(prevRows);
        show('Failed to verify update. Check RLS/permissions.', { type: 'error' });
      }
    } catch (e) {
      setRows(prevRows);
      show(e.message || 'Failed to update status', { type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50">Wallet Requests</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user_id"
            className="px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-800 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
            className="px-3 py-2 rounded-lg border border-magnolia-300 dark:border-blackswarm-600 bg-white dark:bg-blackswarm-800 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => { setPage(0); fetchWallet(); }}
            className="btn-primary text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm text-blackswarm-800 dark:text-magnolia-200">
          <thead>
            <tr className="text-left text-blackswarm-700 dark:text-magnolia-300">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Referral Code</th>
              <th className="px-4 py-3">Agent ID</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="text-blackswarm-700 dark:text-magnolia-300"><td className="px-4 py-4 text-center" colSpan={8}>Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr className="text-blackswarm-700 dark:text-magnolia-300"><td className="px-4 py-4 text-center" colSpan={8}>No records found.</td></tr>
            )}
            {!loading && rows.map((r) => {
              const meta = r.meta || {};
              const ref = meta.reference || meta.ref_no || meta.reference_no || '';
              const referral = r.referral_code || r.referal_code || meta.referral_code || meta.referal_code || '';
              return (
                <tr key={r.id} className="border-t border-magnolia-200 dark:border-blackswarm-700 even:bg-magnolia-100 dark:even:bg-blackswarm-800/60">
                  <td className="px-4 py-3 text-blackswarm-800 dark:text-magnolia-200">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blackswarm-800 dark:text-magnolia-300">{r.user_id}</td>
                  <td className="px-4 py-3 text-blackswarm-800 dark:text-magnolia-200">₱ {fromCents(r.amount_cents || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-blackswarm-800 dark:text-magnolia-200">{r.method || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status || 'pending'}
                      onChange={(e) => updateStatus(r, e.target.value)}
                      disabled={savingId === r.id || loading}
                      className={`px-3 py-1.5 rounded-md text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-bonfire-500 transition-colors
                        bg-white text-blackswarm-800 border-magnolia-300 dark:bg-neutral-700 dark:text-white dark:border-neutral-500
                        ${
                          (r.status || 'pending') === 'approved' ? 'ring-offset-0' :
                          (r.status || 'pending') === 'rejected' ? 'ring-offset-0' :
                          'ring-offset-0'
                        }`}
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-blackswarm-800 dark:text-magnolia-200">{referral || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blackswarm-800 dark:text-magnolia-300">{r.agent_id || '-'}</td>
                  <td className="px-4 py-3 text-blackswarm-800 dark:text-magnolia-200">{ref || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-blackswarm-600 dark:text-magnolia-400">Total:</span> {total.toLocaleString()} records
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary text-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            Prev
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            className="btn-secondary text-sm"
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentWalletDashboard;
