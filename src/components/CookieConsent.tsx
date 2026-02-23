'use client';

import { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('awaaz-cookie-consent');
    if (!consent) {
      // Small delay so it slides in after page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('awaaz-cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('awaaz-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Cookie Consent
              </h3>
              <button
                onClick={handleDecline}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              This website uses cookies and local storage to save your preferences (theme, session).
              We do not track you or share data with third parties.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-blue-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
