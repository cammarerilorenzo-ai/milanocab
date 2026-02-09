import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import safariStep1 from "@/assets/safari-step1.png";
import safariStep2 from "@/assets/safari-step2.png";
import safariStep3 from "@/assets/safari-step3.png";

const DISMISSED_KEY = "milano_cab_safari_install_dismissed";

const steps = [
  { image: safariStep3, label: "Tocca i ⋯ in basso a destra" },
  { image: safariStep1, label: "Tocca \"Condividi\"" },
  { image: safariStep2, label: "\"Aggiungi alla schermata Home\"" },
];

function isIOSBrowser(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

export default function SafariInstallBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const standalone = isStandalone();
    const ios = isIOSBrowser();
    console.log("[SafariInstallBanner]", { standalone, ios, ua: navigator.userAgent });
    if (standalone) return;
    if (!ios) return;
    const t = setTimeout(() => setModalOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => setModalOpen(false);
  const goTo = (step: number) => setCurrentStep(Math.max(0, Math.min(steps.length - 1, step)));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left → next
        goTo(currentStep + 1);
      } else {
        // Swipe right → prev
        goTo(currentStep - 1);
      }
    }
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-foreground">
                Passo {currentStep + 1} di {steps.length}
              </h3>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step label */}
            <p className="px-4 pb-3 text-sm text-muted-foreground">
              {steps[currentStep].label}
            </p>

            {/* Swipeable Image */}
            <div
              className="relative bg-muted"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentStep}
                  src={steps[currentStep].image}
                  alt={steps[currentStep].label}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-h-[60vh] object-contain"
                />
              </AnimatePresence>
            </div>

            {/* Dots + action */}
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {currentStep === steps.length - 1 && (
                <button
                  onClick={dismiss}
                  className="text-sm font-semibold text-primary"
                >
                  Ho capito!
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
