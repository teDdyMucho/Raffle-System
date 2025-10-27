import React, { useEffect, useState } from 'react';

import promo1 from '../images/promoads1.png';
import promo2 from '../images/promoads2.png';
import { useTheme } from '../contexts/ThemeContext';

const PopupAds = ({ open, onClose, images, imagesLight, imagesDark }) => {
  const [canClose, setCanClose] = useState(false);
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const { isDark } = useTheme();
  const defaultAds = [promo1, promo2].filter(Boolean);
  const chooseSet = () => {
    // Priority: themed arrays if provided, else generic images prop, else defaults
    if (isDark && imagesDark && imagesDark.length) return imagesDark;
    if (!isDark && imagesLight && imagesLight.length) return imagesLight;
    if (images && images.length) return images;
    return defaultAds;
  };
  const ads = chooseSet().filter(Boolean);
  useEffect(() => {
    if (open) {
      // reset to first ad each time popup is opened
      setIndex(0);
      setCanClose(false);
      // trigger enter animation next frame
      requestAnimationFrame(() => setEntered(true));
      const t = setTimeout(() => setCanClose(true), 3000);
      return () => clearTimeout(t);
    }
    setEntered(false);
  }, [open]);

  // When index changes (next ad), re-lock for 3 seconds
  useEffect(() => {
    if (!open) return;
    setCanClose(false);
    const t = setTimeout(() => setCanClose(true), 3000);
    return () => clearTimeout(t);
  }, [index, open]);

  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none p-3 sm:p-6 transition-opacity duration-300 ${entered ? 'bg-black/70 opacity-100' : 'bg-black/0 opacity-0'}`}
    >
      <div
        className={`bg-white dark:bg-neutral-900 dark:text-neutral-100 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-3xl relative flex flex-col items-center transform transition-all duration-300 ${entered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
        role="dialog"
        aria-modal="true"
      >
        <button
          className={`absolute top-2 right-2 text-gray-700 dark:text-neutral-300 text-2xl font-bold ${canClose ? 'hover:text-red-500 dark:hover:text-red-400' : 'opacity-50 cursor-not-allowed'}`}
          onClick={() => {
            if (!canClose) return;
            if (index < ads.length - 1) {
              setIndex(i => i + 1);
            } else {
              onClose?.();
            }
          }}
          aria-disabled={!canClose}
          title={canClose ? 'Close' : 'Please wait…'}
        >
          ×
        </button>
        <div className="w-full flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-800 dark:text-neutral-100">Promotion</div>
          <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
            {index + 1}/{ads.length}
          </div>
        </div>
        <img
          key={index}
          src={ads[index]}
          alt={`Promo Ad ${index + 1}`}
          className="w-full max-h-[75vh] object-contain rounded transition-opacity duration-300 opacity-100"
          draggable={false}
        />
        {!canClose && (
          <p className="mt-3 text-xs text-gray-500 dark:text-neutral-400">
            You can close this in 3 seconds…
          </p>
        )}
      </div>
    </div>
  );
};

export default PopupAds;
