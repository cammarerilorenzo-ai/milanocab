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

            <div className="pr-6 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Salva Milano Cab sulla Home
              </p>

              <div className="space-y-2">
                {/* Step 1 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  <span>Tocca i <strong className="text-foreground">⋯</strong> in basso a destra</span>
                </div>
                {/* Step 2 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <span>Tocca <Share className="inline w-3.5 h-3.5 text-primary -mt-0.5" /> <strong className="text-foreground">Condividi</strong></span>
                </div>
                {/* Step 3 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                  <span><strong className="text-foreground">Aggiungi alla schermata Home</strong></span>
                </div>
              </div>
            </div>

            {/* Arrow pointing down-right toward the "..." button */}
            <div className="flex justify-end mt-1">
              <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
                <path
                  d="M8 4 C20 6, 32 14, 40 32"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M36 26 L40 32 L33 30"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
