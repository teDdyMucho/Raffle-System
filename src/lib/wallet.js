import { supabase } from './supabaseClient';

/**
 * Wallet/Cash-in helpers
 *
 * Schema assumptions (adjust to match your DB):
 * - Table: user_wallet
 *   Columns:
 *     id (uuid, PK)
 *     user_id (uuid)
 *     amount_cents (int8)
 *     method (text)           // e.g., 'gcash', 'bank', 'paypal'
 *     meta (jsonb)            // optional details like reference number, screenshot URL, etc.
 *     status (text)           // 'pending' | 'approved' | 'rejected'
 *     created_at (timestamptz)
 *     reviewed_at (timestamptz, nullable)
 *     reviewer_id (uuid, nullable)
 *
 * - Optional balance column in app_users:
 *   app_users.balance_cents (int8)
 */

/**
 * Create a cash-in request for manual/admin review.
 * Does NOT change user balance directly.
 *
 * @param {string} userId - The requesting user's id
 * @param {number} amount - Amount in the user's currency (e.g., 123.45)
 * @param {string} method - Payment method label
 * @param {object} meta - Optional metadata (reference number, proof image path, etc.)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */

/**
 * Credit user's balance by amount_cents. Returns new balance on success.
 */
export async function creditBalanceCents(userId, amount_cents) {
  try {
    if (!userId) throw new Error('Missing userId');
    const delta = Math.max(0, Number(amount_cents) || 0);
    if (delta === 0) return { success: true };

    // Fetch current
    const bal = await getUserBalanceCents(userId);
    if (!bal.success) throw new Error(bal.error || 'Failed to read balance');
    const next = (bal.balance_cents || 0) + delta;

    const { error } = await supabase
      .from('app_users')
      .update({ balance_cents: next })
      .eq('id', userId);
    if (error) throw error;
    return { success: true, balance_cents: next };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Attempt to debit user's balance for a purchase.
 * Ensures balance >= amount before update. Not fully atomic without an RPC,
 * but good enough for single-user in this app.
 */
export async function tryDebitForPurchase(userId, amount_cents) {
  try {
    if (!userId) throw new Error('Missing userId');
    const cost = Math.max(0, Number(amount_cents) || 0);
    if (cost === 0) return { success: true };

    const bal = await getUserBalanceCents(userId);
    if (!bal.success) throw new Error(bal.error || 'Failed to read balance');
    const current = bal.balance_cents || 0;
    if (current < cost) {
      return { success: false, reason: 'insufficient_funds', balance_cents: current };
    }

    const next = current - cost;
    const { error } = await supabase
      .from('app_users')
      .update({ balance_cents: next })
      .eq('id', userId);
    if (error) throw error;
    return { success: true, balance_cents: next };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}
export async function requestCashIn(userId, amount, method = 'gcash', meta = {}) {
  try {
    if (!userId) throw new Error('Missing userId');
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) throw new Error('Invalid amount');

    const amount_cents = Math.round(num * 100);

    const payload = {
      user_id: userId,
      amount_cents,
      method,
      meta,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_wallet')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * List cash-in requests for a user.
 *
 * @param {string} userId
 * @param {{ status?: string, limit?: number, from?: number }} opts
 */
export async function listCashIns(userId, opts = {}) {
  try {
    if (!userId) throw new Error('Missing userId');
    const { status, limit = 20, from = 0 } = opts;

    let query = supabase
      .from('user_wallet')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + Math.max(0, limit - 1));

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data || [], count: count ?? 0 };
  } catch (err) {
    return { success: false, error: err.message || String(err), data: [], count: 0 };
  }
}

/**
 * Get the user's balance in cents, if your schema has app_users.balance_cents.
 * Returns 0 if column is missing or null.
 */
export async function getUserBalanceCents(userId) {
  try {
    if (!userId) throw new Error('Missing userId');
    const { data, error } = await supabase
      .from('app_users')
      .select('balance_cents')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    const cents = Number(data?.balance_cents);
    return { success: true, balance_cents: Number.isFinite(cents) ? cents : 0 };
  } catch (err) {
    // If the column does not exist, we fail gracefully
    return { success: false, error: err.message || String(err), balance_cents: 0 };
  }
}

/** Utility helpers */
export const toCents = (amount) => Math.round(Number(amount || 0) * 100);
export const fromCents = (cents) => Number(((Number(cents || 0)) / 100).toFixed(2));

/**
 * Sum of approved cash-ins in cents for a user.
 */
export async function getApprovedCashInTotalCents(userId) {
  try {
    if (!userId) throw new Error('Missing userId');
    const { data, error } = await supabase
      .from('user_wallet')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('status', 'approved');
    if (error) throw error;
    const total = (data || []).reduce((sum, r) => sum + (Number(r.amount_cents) || 0), 0);
    return { success: true, total_cents: total };
  } catch (err) {
    return { success: false, error: err.message || String(err), total_cents: 0 };
  }
}
