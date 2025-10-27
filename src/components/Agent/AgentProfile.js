import React, { useState, useEffect, useRef } from 'react';
import watermarkSrc from '../../images/allen (1).png';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Link,
  Copy,
  Share2,
  Check,
  Download,
  X,
} from 'lucide-react';

const AgentProfile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const { show } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const canvasRef = useRef(null);
  const [qrRegion, setQrRegion] = useState(null); // {x,y,w,h} in CSS pixels
  const [canvasTick, setCanvasTick] = useState(0); // trigger redraw on resize
  const shareBodyRef = useRef(null); // modal body wrapper (to measure available size)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });

  const handleDownloadPng = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      const fileNameSafe = (user?.name || 'Agent').replace(/[^a-z0-9_-]+/gi, '-');
      const code = user?.referal_code || 'code';
      link.download = `referral-${fileNameSafe}-${code}.png`;
      // Downscale for smaller downloadable image (keeps on-screen size unchanged)
      const scale = 0.5; // 50% of current render size
      const outW = Math.max(1, Math.floor(canvas.width * scale));
      const outH = Math.max(1, Math.floor(canvas.height * scale));
      const tmp = document.createElement('canvas');
      tmp.width = outW;
      tmp.height = outH;
      const tctx = tmp.getContext('2d');
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(canvas, 0, 0, outW, outH);
      link.href = tmp.toDataURL('image/png');
      link.click();
    } catch (e) {
      show('Failed to generate PNG. Try again.', { type: 'error' });
    }
  };

  // Optional: change cursor to pointer when hovering QR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = e => {
      if (!qrRegion) {
        canvas.style.cursor = 'default';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { x: qrX, y: qrY, w: qrW, h: qrH } = qrRegion;
      if (x >= qrX && x <= qrX + qrW && y >= qrY && y <= qrY + qrH) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    };
    canvas.addEventListener('mousemove', onMove);
    return () => canvas.removeEventListener('mousemove', onMove);
  }, [qrRegion, shareOpen]);

  // Fetch latest referral code from DB if missing in session
  useEffect(() => {
    if (!user?.referal_code && user?.id) {
      refreshUser?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Redraw on window resize for responsiveness
  useEffect(() => {
    if (!shareOpen) return;
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setCanvasTick(v => v + 1), 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [shareOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const displayName = (user?.name || 'Agent').toString();
    const code = (user?.referal_code || '').toString();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    // Target aspect ratio based on design 800x450
    const baseW = 800,
      baseH = 450,
      ratio = baseH / baseW;
    // Fit canvas to the popup content area so no scrollbars appear
    const bodyEl = shareBodyRef.current;
    const containerW = Math.min(1000, Math.floor(bodyEl?.clientWidth || window.innerWidth * 0.85));
    // Modal max height is 90vh; subtract header (~56px) and vertical paddings (~32px)
    const modalMaxH = Math.floor(window.innerHeight * 0.9);
    const headerH = 56;
    const bodyPadding = 32;
    const containerH = Math.min(580, modalMaxH - headerH - bodyPadding);
    const maxW = containerW;
    const maxH = containerH;
    let width = maxW;
    let height = Math.floor(width * ratio);
    if (height > maxH) {
      height = maxH;
      width = Math.floor(height / ratio);
    }
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#ef4444'); // bonfire-500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Card
    const cardPadding = 10; // tighter to fill popup
    const cardRadius = 12;
    const cardWidth = width - cardPadding * 2;
    const cardHeight = height - cardPadding * 2;
    // rounded rect
    const rx = cardPadding,
      ry = cardPadding;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(rx + cardRadius, ry);
    ctx.lineTo(rx + cardWidth - cardRadius, ry);
    ctx.quadraticCurveTo(rx + cardWidth, ry, rx + cardWidth, ry + cardRadius);
    ctx.lineTo(rx + cardWidth, ry + cardHeight - cardRadius);
    ctx.quadraticCurveTo(
      rx + cardWidth,
      ry + cardHeight,
      rx + cardWidth - cardRadius,
      ry + cardHeight
    );
    ctx.lineTo(rx + cardRadius, ry + cardHeight);
    ctx.quadraticCurveTo(rx, ry + cardHeight, rx, ry + cardHeight - cardRadius);
    ctx.lineTo(rx, ry + cardRadius);
    ctx.quadraticCurveTo(rx, ry, rx + cardRadius, ry);
    ctx.closePath();
    ctx.fill();

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = `bold ${Math.max(22, Math.floor(width * 0.035))}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.fillText('Agent Referral', rx + 24, ry + 48);

    // Center watermark (allen2.png), drawn behind text/boxes using low alpha
    const wmImg = new Image();
    wmImg.src = watermarkSrc;
    const drawWatermark = () => {
      try {
        // Fit watermark within ~85% of card area while preserving aspect ratio
        const targetW = Math.floor(cardWidth * 0.85);
        const targetH = Math.floor(cardHeight * 0.85);
        const iw = wmImg.naturalWidth || 1;
        const ih = wmImg.naturalHeight || 1;
        const scale = Math.min(targetW / iw, targetH / ih);
        const w = Math.floor(iw * scale);
        const h = Math.floor(ih * scale);
        const cx = rx + Math.floor((cardWidth - w) / 2);
        const cy = ry + Math.floor((cardHeight - h) / 2);
        ctx.save();
        ctx.globalAlpha = 0.5; // clearly visible on light background
        ctx.drawImage(wmImg, cx, cy, w, h);
        ctx.restore();
      } catch (_) {}
    };
    if (wmImg.complete) {
      drawWatermark();
    } else {
      wmImg.onload = () => {
        drawWatermark();
        // ensure final image includes watermark by retriggering render once
        setCanvasTick(v => v + 1);
      };
    }

    // Name label
    ctx.fillStyle = '#374151';
    ctx.font = '600 18px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.fillText('Agent', rx + 24, ry + 90);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.fillText(displayName, rx + 24, ry + 122);

    // Referral code box (half width) with QR on the right
    const codeBoxY = ry + Math.floor(height * 0.32);
    const codeBoxH = Math.max(120, Math.floor(height * 0.28));
    const codeBoxX = rx + 24;
    const codeBoxW = Math.floor((cardWidth - 48) * 0.64);
    ctx.fillStyle = '#111827';
    const r2 = 12;
    ctx.beginPath();
    ctx.moveTo(codeBoxX + r2, codeBoxY);
    ctx.lineTo(codeBoxX + codeBoxW - r2, codeBoxY);
    ctx.quadraticCurveTo(codeBoxX + codeBoxW, codeBoxY, codeBoxX + codeBoxW, codeBoxY + r2);
    ctx.lineTo(codeBoxX + codeBoxW, codeBoxY + codeBoxH - r2);
    ctx.quadraticCurveTo(
      codeBoxX + codeBoxW,
      codeBoxY + codeBoxH,
      codeBoxX + codeBoxW - r2,
      codeBoxY + codeBoxH
    );
    ctx.lineTo(codeBoxX + r2, codeBoxY + codeBoxH);
    ctx.quadraticCurveTo(codeBoxX, codeBoxY + codeBoxH, codeBoxX, codeBoxY + codeBoxH - r2);
    ctx.lineTo(codeBoxX, codeBoxY + r2);
    ctx.quadraticCurveTo(codeBoxX, codeBoxY, codeBoxX + r2, codeBoxY);
    ctx.closePath();
    ctx.fill();

    // Code text (centered inside left box)
    ctx.fillStyle = '#F9FAFB';
    ctx.font = `bold ${Math.max(36, Math.floor(codeBoxH * 0.42))}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    const codeText = code || 'NO-CODE';
    // center text in code box
    const textMetrics = ctx.measureText(codeText);
    const textWidth = textMetrics.width;
    const textX = codeBoxX + (codeBoxW - textWidth) / 2;
    const textY = codeBoxY + codeBoxH / 2 + 18;
    ctx.fillText(codeText, textX, textY);

    // Removed footer text per request

    // Reset QR region on re-render
    setQrRegion(null);

    // Optional QR code (best-effort): dynamically import 'qrcode' if available
    (async () => {
      try {
        const shareUrl = `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`;
        const mod = await import('qrcode').catch(() => null);
        if (!mod) return;
        const QR = mod.default || mod; // support both default and named export
        if (!QR.toDataURL) return;
        const qrDataUrl = await QR.toDataURL(shareUrl, {
          margin: 1,
          width: Math.floor(Math.min(180, cardWidth * 0.25)),
          color: {
            dark: '#111827ff',
            light: '#ffffffff',
          },
        });
        const qrImg = new Image();
        qrImg.onload = () => {
          // Place QR on the right side of the code box, same row (bigger)
          let qrSize = Math.floor(Math.min(codeBoxH * 1.28, cardWidth * 0.4));
          const gap = 16;
          let qrX = codeBoxX + codeBoxW + gap;
          // Ensure QR fits within card bounds
          const maxQrX = rx + cardWidth - 16 - qrSize;
          if (qrX > maxQrX) {
            qrX = maxQrX;
          }
          const qrY = codeBoxY + Math.floor((codeBoxH - qrSize) / 2);
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Save QR hit region in CSS pixels for click handling
          setQrRegion({ x: qrX, y: qrY, w: qrSize, h: qrSize, canvasW: width, canvasH: height });
        };
        qrImg.src = qrDataUrl;
      } catch (e) {
        // silently skip if QR library not available
      }
    })();
  }, [shareOpen, user?.name, user?.referal_code, canvasTick]);

  // Click handler: copy referral code when clicking inside QR region
  const onCanvasClick = e => {
    try {
      if (!qrRegion || !user?.referal_code) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { x: qrX, y: qrY, w: qrW, h: qrH } = qrRegion;
      // Hit test in CSS pixel space
      if (x >= qrX && x <= qrX + qrW && y >= qrY && y <= qrY + qrH) {
        navigator.clipboard.writeText(String(user.referal_code)).then(() => {
          show('Referral code copied!', { type: 'success' });
        });
      }
    } catch (_) {
      /* ignore */
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
      });

      if (result.success) {
        show('Profile updated successfully!', { type: 'success' });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      show(error.message || 'An error occurred while updating your profile', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-magnolia-50 dark:bg-blackswarm-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-magnolia-200 dark:border-blackswarm-700">
        <h2 className="text-2xl font-bold text-blackswarm-900 dark:text-magnolia-50">
          Agent Profile
        </h2>
        <p className="text-blackswarm-600 dark:text-magnolia-400 mt-1">
          Manage your personal information and contact details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Profile Avatar */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-bonfire-400 to-embers-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">{user?.name?.charAt(0) || 'A'}</span>
            </div>
          </div>

          {/* Email - Read Only */}
          <div>
            <label className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-blackswarm-400 dark:text-magnolia-500" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-magnolia-100 dark:bg-blackswarm-700 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-2 pl-10 pr-3 w-full text-blackswarm-900 dark:text-magnolia-50 opacity-75"
              />
            </div>
            <p className="mt-1 text-xs text-blackswarm-500 dark:text-magnolia-500">
              Email cannot be changed
            </p>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-blackswarm-400 dark:text-magnolia-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-magnolia-50 dark:bg-blackswarm-800 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-2 pl-10 pr-3 w-full text-blackswarm-900 dark:text-magnolia-50 focus:ring-2 focus:ring-bonfire-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-blackswarm-400 dark:text-magnolia-500" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="bg-magnolia-50 dark:bg-blackswarm-800 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-2 pl-10 pr-3 w-full text-blackswarm-900 dark:text-magnolia-50 focus:ring-2 focus:ring-bonfire-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-blackswarm-700 dark:text-magnolia-300 mb-1"
            >
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-blackswarm-400 dark:text-magnolia-500" />
              </div>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="bg-magnolia-50 dark:bg-blackswarm-800 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-2 pl-10 pr-3 w-full text-blackswarm-900 dark:text-magnolia-50 focus:ring-2 focus:ring-bonfire-500"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="pt-4 border-t border-magnolia-200 dark:border-blackswarm-700">
            <h3 className="text-lg font-medium text-blackswarm-900 dark:text-magnolia-50 mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2 text-bonfire-500" />
              Your Referral Code
            </h3>

            <div className="bg-magnolia-100 dark:bg-blackswarm-700 rounded-lg p-4">
              <p className="text-sm text-blackswarm-600 dark:text-magnolia-400 mb-2">
                Share this code with users to earn commission on their cash-ins
              </p>

              <div className="flex items-center mt-2">
                <div className="flex-grow bg-magnolia-50 dark:bg-blackswarm-800 border border-magnolia-300 dark:border-blackswarm-600 rounded-md py-3 px-4 text-lg font-medium text-blackswarm-900 dark:text-magnolia-50">
                  {user?.referal_code || 'No referral code assigned'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.referal_code) {
                      navigator.clipboard.writeText(user.referal_code);
                      setCopied(true);
                      show('Referral code copied to clipboard!', { type: 'success' });
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  disabled={!user?.referal_code}
                  className={`ml-2 p-3 rounded-md ${user?.referal_code ? 'bg-bonfire-500 hover:bg-bonfire-600 text-white' : 'bg-magnolia-200 dark:bg-blackswarm-600 text-blackswarm-400 dark:text-magnolia-500 cursor-not-allowed'}`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.referal_code) setShareOpen(true);
                  }}
                  disabled={!user?.referal_code}
                  className={`ml-2 p-3 rounded-md ${user?.referal_code ? 'bg-embers-500 hover:bg-embers-600 text-white' : 'bg-magnolia-200 dark:bg-blackswarm-600 text-blackswarm-400 dark:text-magnolia-500 cursor-not-allowed'}`}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {!user?.referal_code && (
                <p className="mt-2 text-sm text-bonfire-600 dark:text-bonfire-400">
                  Contact an administrator to get your referral code assigned.
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-bonfire-500 to-embers-500 hover:from-bonfire-600 hover:to-embers-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bonfire-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Share Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShareOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-magnolia-50 dark:bg-blackswarm-800 rounded-xl shadow-2xl border border-magnolia-200 dark:border-blackswarm-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-magnolia-200 dark:border-blackswarm-700">
              <h3 className="text-lg font-semibold text-blackswarm-900 dark:text-magnolia-50">
                Share Referral
              </h3>
              <button
                onClick={() => setShareOpen(false)}
                className="p-2 rounded-md hover:bg-magnolia-100 dark:hover:bg-blackswarm-700"
              >
                <X className="w-5 h-5 text-blackswarm-600 dark:text-magnolia-400" />
              </button>
            </div>
            <div ref={shareBodyRef} className="p-4">
              <div className="w-full">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto rounded-lg border border-magnolia-200 dark:border-blackswarm-700"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleDownloadPng}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-bonfire-500 hover:bg-bonfire-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProfile;
