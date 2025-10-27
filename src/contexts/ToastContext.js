import React, { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Defaults: center popup, auto-close after 3s
  const show = useCallback(
    (message, { type = 'info', duration = 3000, position = 'center' } = {}) => {
      const id = ++idCounter;
      setToasts(prev => [...prev, { id, message, type, position, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    []
  );

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss, toasts }}>{children}</ToastContext.Provider>
  );
};
