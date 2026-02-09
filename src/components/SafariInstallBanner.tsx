import { useState, useEffect } from "react";
import { X, Share, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import safariStep1 from "@/assets/safari-step1.png";
import safariStep2 from "@/assets/safari-step2.png";
import safariStep3 from "@/assets/safari-step3.png";

const DISMISSED_KEY = "milano_cab_safari_install_dismissed";

const steps = [
  { image: safariStep1, label: "Tocca i ⋯ in basso a destra" },
  { image: safariStep2, label: "Tocca \"Condividi\"" },
  { image: safariStep3, label: "\"Aggiungi alla schermata Home\"" },
];

function isSafariBrowser(): boolean {
  const ua = navigator.userAgent;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!isSafariBrowser()) return;
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const openModal = () => {
    setCurrentStep(0);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const prev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const next = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {show && !modalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-xl p-4 relative">
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pr-6 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  📲 Salva Milano Cab sulla Home
                </p>
                <p className="text-xs text-muted-foreground">
                  Accesso rapido come un'app! Tocca per vedere come fare.
                </p>
                <button
                  onClick={openModal}
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                  Mostra istruzioni
                </button>
              </div>

              {/* Arrow */}
              <div className="flex justify-end -mt-2">
                <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
                  <path d="M8 4 C20 6, 32 14, 40 32" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M36 26 L40 32 L33 30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Carousel */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
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
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step label */}
              <p className="px-4 pb-3 text-sm text-muted-foreground">
                {steps[currentStep].label}
              </p>

              {/* Image */}
              <div className="relative bg-muted">
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

              {/* Navigation */}
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Indietro
                </button>

                {/* Dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={next}
                    className="flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { closeModal(); dismiss(); }}
                    className="text-sm font-medium text-primary"
                  >
                    Ho capito!
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
