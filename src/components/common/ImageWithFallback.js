import React, { useState } from 'react';

// Lightweight image component with robust fallback.
// - Tries primary src
// - On error, swaps to provided fallbackSrc or an inline SVG placeholder
// - Preserves sizing via className
// - For accessibility, keeps alt text
export default function ImageWithFallback({ src, alt = '', className = '', fallbackSrc }) {
  const [imgSrc, setImgSrc] = useState(src);

  // Simple inline SVG placeholder (dark/light aware via currentColor)
  const defaultFallback =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="8" fill="%23e5e7eb"/>
        <path d="M10 46l12-14 10 12 8-10 14 16H10z" fill="%239ca3af"/>
        <circle cx="22" cy="24" r="6" fill="%239ca3af"/>
      </svg>`
    );

  const handleError = () => {
    if (imgSrc !== (fallbackSrc || defaultFallback)) {
      setImgSrc(fallbackSrc || defaultFallback);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}
