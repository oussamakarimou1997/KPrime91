import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

interface AppLockModalProps {
  isOpen: boolean;
  onUnlock: (passcode: string) => boolean;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ isOpen, onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
      setErrorMessage('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Intercept and disable Escape key so modal cannot be closed
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!passcode.trim()) {
      setError(true);
      setErrorMessage('Please enter the atelier passcode');
      triggerShake();
      return;
    }

    const success = onUnlock(passcode);
    if (!success) {
      setError(true);
      setErrorMessage('Incorrect passcode. Access denied.');
      triggerShake();
      inputRef.current?.select();
    } else {
      setError(false);
      setErrorMessage('');
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div
      id="app-lock-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none transition-all duration-300"
      onClick={(e) => {
        // Prevent backdrop click dismissal - keep focus on input
        e.stopPropagation();
        inputRef.current?.focus();
      }}
    >
      <div
        id="app-lock-modal"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-stone-900/95 border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-stone-100 relative overflow-hidden backdrop-blur-xl ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Subtle decorative glow accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-700/20 to-stone-950 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/60 p-0.5">
              <div className="w-full h-full bg-stone-950/80 rounded-[14px] flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-400 group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-stone-900 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h2 className="font-serif-luxury text-2xl font-bold tracking-tight text-white mb-1.5">
            Access Restricted - Enter Passcode
          </h2>
          <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
            Kprime Perfume Atelier formulation records and inventory are protected. Enter the master passcode to proceed.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Master Passcode
              </span>
              <span className="text-[10px] text-stone-500 font-mono">Default: 123456</span>
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter passcode..."
                className={`w-full px-4 py-3 pr-11 bg-stone-950/80 border rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none transition-all ${
                  error
                    ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                    : 'border-stone-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 rounded-lg transition-colors"
                title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage || 'Incorrect passcode entered'}</span>
            </div>
          )}

          {/* Unlock Button */}
          <button
            type="submit"
            id="unlock-atelier-btn"
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Atelier</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-stone-500">
            Session remains unlocked during your browser session. Re-lock anytime from the sidebar.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};
