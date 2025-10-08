import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CopyReferral = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = (params.get('code') || '').trim();
  const next = `/signup?ref=${encodeURIComponent(code)}`;
  const [status, setStatus] = useState('copying');

  useEffect(() => {
    let redirected = false;
    const attempt = async () => {
      try {
        if (!code) {
          setStatus('missing');
          return;
        }
        // Clipboard API requires secure context (https or localhost)
        if (navigator.clipboard && window.isSecureContext !== false) {
          await navigator.clipboard.writeText(code);
          setStatus('copied');
          // Small delay so user sees status, then redirect
          setTimeout(() => { if (!redirected) navigate(next, { replace: true }); redirected = true; }, 500);
          return;
        }
      } catch (_) {
        // fall through
      }
      setStatus('fallback');
    };
    attempt();
    return () => { redirected = true; };
  }, [code, navigate, next]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-magnolia-50 dark:bg-blackswarm-900 p-6">
      <div className="max-w-md w-full bg-white dark:bg-blackswarm-800 border border-magnolia-200 dark:border-blackswarm-700 rounded-lg p-6 text-center">
        <h1 className="text-xl font-semibold text-blackswarm-900 dark:text-magnolia-50 mb-2">Preparing referral…</h1>
        {status === 'copying' && (
          <p className="text-sm text-blackswarm-600 dark:text-magnolia-400">Copying referral code to clipboard…</p>
        )}
        {status === 'copied' && (
          <p className="text-sm text-green-600 dark:text-green-400">Referral code copied! Redirecting…</p>
        )}
        {status === 'missing' && (
          <p className="text-sm text-bonfire-600 dark:text-bonfire-400">No referral code provided.</p>
        )}
        {status === 'fallback' && (
          <div>
            <p className="text-sm text-blackswarm-600 dark:text-magnolia-400 mb-3">Tap the button below to copy, then continue.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                    setStatus('copied');
                    setTimeout(() => navigate(next, { replace: true }), 300);
                  } catch (_) {
                    // as a last resort, select text
                    const el = document.getElementById('ref-code');
                    if (el) {
                      const r = document.createRange();
                      r.selectNode(el);
                      const s = window.getSelection();
                      s.removeAllRanges();
                      s.addRange(r);
                    }
                  }
                }}
                className="px-4 py-2 rounded-md bg-bonfire-500 hover:bg-bonfire-600 text-white"
              >
                Copy Code
              </button>
              <button
                onClick={() => navigate(next, { replace: true })}
                className="px-4 py-2 rounded-md border border-magnolia-300 dark:border-blackswarm-600 text-blackswarm-800 dark:text-magnolia-200"
              >
                Continue
              </button>
            </div>
            <div className="mt-3 text-xs text-blackswarm-500 dark:text-magnolia-400">
              Code: <span id="ref-code" className="font-mono">{code || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyReferral;
