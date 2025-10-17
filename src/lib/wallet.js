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
 *     reviewed_at (timestamptz, nullable)
 *     reviewer_id (uuid, nullable)
 *
 * - Optional balance column in app_users:
 *   app_users.balance_cents (int8)
 *
 * - Referral:
 *   app_users.referal_code: the agent's public referral code (spelling kept as in DB)
 *   app_users.referred_by_code (optional): the fixed referral code chosen by the user after first approved cash-in
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
export async function recomputeAllAgentBalances() {
  try {
    const { data: agents, error: agentsErr } = await supabase
      .from('app_users')
      .select('id, referal_code, commission_bps, commission_pct');
    if (agentsErr) throw agentsErr;
    const byId = Array.isArray(agents) ? agents : [];
    for (const a of byId) {
      const code = (a?.referal_code || '').trim();
      if (!code) continue;
      const bps = Number.isFinite(Number(a?.commission_bps))
        ? Math.max(0, Math.floor(Number(a.commission_bps)))
        : (Number.isFinite(Number(a?.commission_pct)) ? Math.max(0, Math.floor(Number(a.commission_pct) * 100)) : 1000);
      const all = new Map();
      const { data: d1, error: e1 } = await supabase
        .from('user_wallet')
        .select('id, amount_cents, referral_code, referal_code, meta, created_at')
        .eq('status', 'approved')
        .or(`referral_code.eq.${code},referal_code.eq.${code}`);
      if (e1) throw e1;
      (d1 || []).forEach(r => all.set(r.id, r));
      try {
        const { data: d2 } = await supabase
          .from('user_wallet')
          .select('id, amount_cents, meta, created_at')
          .eq('status', 'approved')
          .contains('meta', { referral_code: code });
        (d2 || []).forEach(r => all.set(r.id, r));
      } catch (_) {}
      try {
        const { data: d3 } = await supabase
          .from('user_wallet')
          .select('id, amount_cents, meta, created_at')
          .eq('status', 'approved')
          .contains('meta', { referal_code: code });
        (d3 || []).forEach(r => all.set(r.id, r));
      } catch (_) {}
      const items = Array.from(all.values());
      const totalCents = items.reduce((s, r) => s + (Number(r.amount_cents) || 0), 0);
      const commissionCents = Math.round(totalCents * (bps / 10000));
      const { error: upErr } = await supabase
        .from('app_users')
        .update({ balance_cents: commissionCents })
        .eq('id', a.id);
      if (upErr) throw upErr;
    }
    return { success: true };
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
/**
 * Validate a referral code against app_users.referal_code. Returns the agent user row if found.
 */
export async function validateReferralCode(code) {
  try {
    const clean = (code || '').trim();
    if (!clean) return { success: false, error: 'Missing referral code' };

    let { data, error } = await supabase
      .from('app_users')
      .select('id, referal_code, role')
      .eq('referal_code', clean)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      // Fallback to case-insensitive match if referal_code is not unique/case-sensitive
      const r = await supabase
        .from('app_users')
        .select('id, referal_code, role')
        .ilike('referal_code', clean);
      data = Array.isArray(r.data) && r.data[0] ? r.data[0] : null;
      if (r.error) throw r.error;
    }
    if (!data) return { success: false, error: 'Invalid referral code' };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Resolve the user's fixed referral code.
 * Priority: app_users.referred_by_code -> first approved cash-in's meta.referral_code -> null
 */
export async function getFixedReferralCode(userId) {
  try {
    if (!userId) throw new Error('Missing userId');

    // 1) Try stored on user row
    try {
      const { data: userRow, error: userErr } = await supabase
        .from('app_users')
        .select('referred_by_code, referal, referal_code')
        .eq('id', userId)
        .maybeSingle();
      if (!userErr) {
        // Priority 1: JSON column app_users.referal.code (as requested)
        const jsonCode = (() => {
          try {
            const v = userRow?.referal?.code;
            return v ? String(v).trim() : '';
          } catch (_) { return ''; }
        })();
        if (jsonCode) return { success: true, code: jsonCode };

        // Priority 2: legacy/text column app_users.referal_code
        const refCode = (userRow?.referal_code || '').trim();
        if (refCode) return { success: true, code: refCode };

        // Priority 3: referred_by_code
        const fixed = (userRow?.referred_by_code || '').trim();
        if (fixed) return { success: true, code: fixed };
      }
    } catch (_) {
      // Column may not exist; ignore
    }

    // 2) Fall back to earliest approved cash-in meta.referral_code
    let first = null;
    try {
      const { data, error } = await supabase
        .from('user_wallet')
        .select('meta, referal_code, referral_code, created_at')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      first = Array.isArray(data) && data[0] ? data[0] : null;
    } catch (selErr) {
      // If meta column does not exist, fall back without reading meta
      const msg = String(selErr.message || '').toLowerCase();
      if (/column\s+"?meta"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+meta\s+column/i.test(msg)) {
        const { data } = await supabase
          .from('user_wallet')
          .select('referal_code, referral_code, created_at')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: true })
          .limit(1);
        first = Array.isArray(data) && data[0] ? data[0] : null;
      } else {
        throw selErr;
      }
    }
    const codeFromMeta = first?.meta?.referral_code
      ? String(first.meta.referral_code).trim()
      : (first?.meta?.referal_code ? String(first.meta.referal_code).trim() : '');
    const codeTop = first?.referral_code ? String(first.referral_code).trim() : (first?.referal_code ? String(first.referal_code).trim() : '');
    const code = codeFromMeta || codeTop || '';
    if (code) return { success: true, code };
    return { success: true, code: null };
  } catch (err) {
    return { success: false, error: err.message || String(err), code: null };
  }
}

export async function requestCashIn(userId, amount, method = 'gcash', meta = {}) {
  try {
    if (!userId) throw new Error('Missing userId');
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) throw new Error('Invalid amount');

    const amount_cents = Math.round(num * 100);

    // Enforce referral code rules:
    // If the user already has a fixed code (via user field or first approved cash-in), force it.
    // Otherwise, if a referral_code is provided in meta, validate it against app_users.referal_code.
    // If not provided, allow request without, but UI should require it for the first time.
    let referralToUse = null;
    let agentId = null;
    try {
      const fixed = await getFixedReferralCode(userId);
      if (fixed?.code) {
        referralToUse = fixed.code;
      } else if (meta && meta.referral_code) {
        const v = await validateReferralCode(meta.referral_code);
        if (!v.success) throw new Error(v.error || 'Invalid referral code');
        referralToUse = String(meta.referral_code).trim();
        agentId = v.data?.id || null;
      }
      // Ensure agent_id is resolved when we have a code (even if fixed)
      if (referralToUse && !agentId) {
        try {
          const v2 = await validateReferralCode(referralToUse);
          if (v2?.success && v2.data?.id) agentId = v2.data.id;
        } catch (_) { /* ignore; DB may still accept by code only */ }
      }
    } catch (refErr) {
      // Surface referral validation errors
      throw refErr;
    }

    const payload = {
      user_id: userId,
      amount_cents,
      method,
      meta: {
        ...meta,
        // Write both spellings to be compatible with any triggers/functions expecting a specific key
        referral_code: referralToUse || null,
        referal_code: referralToUse || null,
        agent_id: agentId || null,
      },
      // Also provide top-level keys for schemas that expect columns
      referral_code: referralToUse || null,
      referal_code: referralToUse || null,
      agent_id: agentId || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    let data, error;
    try {
      ({ data, error } = await supabase
        .from('user_wallet')
        .insert([payload])
        .select('*')
        .single());
      if (error) throw error;
    } catch (insErr) {
      // If meta column is missing, retry without meta
      const msg = String(insErr.message || '').toLowerCase();
      const stripAndRetry = async (prevPayload, keyRegex) => {
        const keys = Object.keys(prevPayload).filter(k => keyRegex.test(k));
        const next = { ...prevPayload };
        for (const k of keys) delete next[k];
        const { data: d2, error: e2 } = await supabase
          .from('user_wallet')
          .insert([next])
          .select('*')
          .single();
        if (e2) throw e2;
        return d2;
      };

      if (/column\s+"?meta"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+meta\s+column/i.test(msg)) {
        data = await stripAndRetry(payload, /^(meta)$/);
      } else if (/column\s+"?referal_code"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+referal_code\s+column/i.test(msg)) {
        data = await stripAndRetry(payload, /^(referal_code)$/);
      } else if (/column\s+"?referral_code"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+referral_code\s+column/i.test(msg)) {
        data = await stripAndRetry(payload, /^(referral_code)$/);
      } else if (/column\s+"?agent_id"?\s+does\s+not\s+exist|could\s+not\s+find\s+the\s+agent_id\s+column/i.test(msg)) {
        data = await stripAndRetry(payload, /^(agent_id)$/);
      } else {
        throw insErr;
      }
    }

    // Best-effort: POST to webhook with the user-provided data
    try {
      const WEBHOOK_URL =
        process.env.REACT_APP_RAFFLE_BALANCE_WEBHOOK ||
        'https://primary-production-6722.up.railway.app/webhook/raffle-balance';
      const body = {
        user_id: userId,
        amount_cents,
        amount,
        method,
        referral_code: payload.meta?.referral_code || payload.referral_code || null,
        meta: payload.meta || {},
        created_at: payload.created_at,
        cashin_id: data?.id || null,
      };
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // no-cors would hide errors; prefer cors and catch
      });
    } catch (_) {
      // ignore webhook errors; insertion already succeeded
    }

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
 
/**
 * Sum of pending cash-ins in cents for a user.
 */
export async function getPendingCashInTotalCents(userId) {
  try {
    if (!userId) throw new Error('Missing userId');
    const { data, error } = await supabase
      .from('user_wallet')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    const total = (data || []).reduce((sum, r) => sum + (Number(r.amount_cents) || 0), 0);
    return { success: true, total_cents: total };
  } catch (err) {
    return { success: false, error: err.message || String(err), total_cents: 0 };
  }
}
