import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

// Project palette: black, red, white.
// We keep type-specific icons, but unify colors to use red accents and neutral surfaces.
const colors = {
  info: {
    bg: 'bg-white/95 dark:bg-blackswarm-900/85',
    border: 'border-red-500/20 dark:border-red-400/25',
    text: 'text-black dark:text-white',
    ring: 'ring-red-500/25',
    iconBg: 'bg-red-500/10',
    icon: <Info className="w-4 h-4 text-red-500" />,
    bar: 'bg-red-500'
  },
  success: {
    bg: 'bg-white/95 dark:bg-blackswarm-900/85',
    border: 'border-red-500/20 dark:border-red-400/25',
    text: 'text-black dark:text-white',
    ring: 'ring-red-500/25',
    iconBg: 'bg-red-500/10',
    icon: <CheckCircle2 className="w-4 h-4 text-red-500" />,
    bar: 'bg-red-500'
  },
  error: {
    bg: 'bg-white/95 dark:bg-blackswarm-900/85',
    border: 'border-red-500/30 dark:border-red-500/35',
    text: 'text-black dark:text-white',
    ring: 'ring-red-600/30',
    iconBg: 'bg-red-600/10',
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    bar: 'bg-red-600'
  },
  warning: {
    bg: 'bg-white/95 dark:bg-blackswarm-900/85',
    border: 'border-red-500/20 dark:border-red-400/25',
    text: 'text-black dark:text-white',
    ring: 'ring-red-500/25',
    iconBg: 'bg-red-500/10',
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
    bar: 'bg-red-500'
  },
};

const ToastContainer = () => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {/* Bottom-right stack */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-3 max-w-sm">
        {toasts.filter(t => (t.position || 'bottom-right') === 'bottom-right').map((t) => {
          const theme = colors[t.type] || colors.info;
          return (
            <div
              key={t.id}
              className={`relative overflow-hidden border ${theme.border} ${theme.bg} ${theme.text} rounded-xl shadow-lg px-4 py-3 ring-1 ${theme.ring} backdrop-blur supports-[backdrop-filter]:bg-opacity-90 animate-[slideIn_.25s_ease-out]`}
              style={{ boxShadow: '0 10px 30px -10px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${theme.iconBg}`}>{theme.icon}</div>
                <div className="text-sm leading-snug flex-1 font-medium">{t.message}</div>
                <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss notification">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div className={`absolute left-0 bottom-0 h-0.5 ${theme.bar} animate-[progressLinear_var(--dur)_linear_forwards]`} style={{ width: '100%', '--dur': `${t.duration || 3000}ms` }} />
            </div>
          );
        })}
      </div>

      {/* Center popup (stacked vertically) */}
      <div className="fixed inset-0 pointer-events-none z-[110] flex items-start justify-center pt-[15vh] space-y-3">
        <div className="w-full max-w-md space-y-3">
          {toasts.filter(t => t.position === 'center').map((t) => {
            const theme = colors[t.type] || colors.info;
            return (
              <div
                key={t.id}
                className={`relative overflow-hidden mx-auto w-[92%] sm:w-full pointer-events-auto border ${theme.border} ${theme.bg} ${theme.text} rounded-2xl shadow-2xl px-5 py-4 ring-1 ${theme.ring} backdrop-blur supports-[backdrop-filter]:bg-opacity-90 animate-[popIn_.2s_ease-out]`}
                style={{ boxShadow: '0 20px 60px -20px rgba(0,0,0,0.55)' }}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${theme.iconBg}`}>{theme.icon}</div>
                  <div className="text-base leading-snug flex-1 font-semibold">{t.message}</div>
                  <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss notification">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Progress bar */}
                <div className={`absolute left-0 bottom-0 h-1 ${theme.bar} animate-[progressLinear_var(--dur)_linear_forwards]`} style={{ width: '100%', '--dur': `${t.duration || 3000}ms` }} />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes slideIn{from{opacity:.0; transform: translateY(6px)} to{opacity:1; transform: translateY(0)}}@keyframes popIn{from{opacity:0; transform: translateY(-6px) scale(.98)} to{opacity:1; transform: translateY(0) scale(1)}}@keyframes progressLinear{from{width:100%} to{width:0%}}`}</style>
    </>
  );
};

export default ToastContainer;

