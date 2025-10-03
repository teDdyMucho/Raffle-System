import React from 'react';
import { useToast } from '../../contexts/ToastContext';

const colors = {
  info: 'bg-magnolia-50 border-magnolia-200 text-blackswarm-800 dark:bg-blackswarm-800 dark:border-blackswarm-700 dark:text-magnolia-100',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
  error: 'bg-bonfire-50 border-bonfire-200 text-bonfire-800 dark:bg-bonfire-900/20 dark:border-bonfire-800 dark:text-bonfire-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
};

const ToastContainer = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className={`border rounded-md shadow px-4 py-3 ${colors[t.type] || colors.info}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">{t.message}</div>
            <button onClick={() => dismiss(t.id)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
