import { useState, useEffect } from "react";
import { X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "milano_cab_safari_install_dismissed";

function isSafariBrowser(): boolean {
  const ua = navigator.userAgent;
  // Safari on iOS: contains "Safari" but not "CriOS" (Chrome) or "FxiOS" (Firefox) etc.
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

export default function SafariInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!isSafariBrowser()) return;
    // Small delay so the page renders first
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4 relative">
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share className="w-5 h-5 text-primary" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Salva Milano Cab sulla Home
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tocca i <strong>⋯</strong> in basso a destra, poi <strong>"Aggiungi alla schermata Home"</strong> per un accesso rapido!
                </p>
              </div>
            </div>

            {/* Arrow pointing down-right toward the "..." button */}
            <div className="flex justify-end mt-2 mr-2">
              <svg width="40" height="30" viewBox="0 0 40 30" fill="none" className="text-primary">
                <path
                  d="M5 5 C15 5, 25 8, 32 20 L30 17 M32 20 L28 22"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
