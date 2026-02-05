import { useState, useEffect } from "react";
import { Download, Share, Plus, MoreVertical, ChevronDown, Smartphone, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";

type DeviceType = "ios" | "android" | "desktop";

function detectDevice(): DeviceType {
  const userAgent = navigator.userAgent || navigator.vendor;
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }
  
  if (/android/i.test(userAgent)) {
    return "android";
  }
  
  return "desktop";
}

export default function Install() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
    
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  }, []);

  const handleInstallClick = () => {
    setShowInstructions(true);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">App già installata!</h1>
          <p className="text-muted-foreground">Puoi trovarla nella tua Home</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img 
            src={logo} 
            alt="Milano Cab" 
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold text-foreground text-center mb-2"
        >
          Milano Cab
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground text-center mb-8"
        >
          Prenota corse in pochi secondi
        </motion.p>

        {/* Device Icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-3 mb-8 w-full max-w-xs"
        >
          {[
            "Accesso rapido dalla Home",
            "Funziona anche offline",
            "Nessun download dallo store"
          ].map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-foreground/80">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pb-safe">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInstallClick}
          className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-3"
        >
          <Download className="w-5 h-5" />
          Salva come App
        </motion.button>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-3"
        >
          Gratis • Nessuna installazione • 2 secondi
        </motion.p>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-safe"
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

              {device === "ios" ? (
                <IOSInstructions />
              ) : device === "android" ? (
                <AndroidInstructions />
              ) : (
                <DesktopInstructions />
              )}

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 mt-6 text-muted-foreground text-sm"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IOSInstructions() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">
        Salva su iPhone
      </h2>
      
      <div className="space-y-4">
        <InstructionStep
          number={1}
          icon={<Share className="w-5 h-5" />}
          text="Tocca l'icona Condividi in basso"
        />
        <InstructionStep
          number={2}
          icon={<ChevronDown className="w-5 h-5" />}
          text="Scorri verso il basso"
        />
        <InstructionStep
          number={3}
          icon={<Plus className="w-5 h-5" />}
          text='Tocca "Aggiungi alla schermata Home"'
        />
      </div>

      <div className="flex justify-center">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-3 bg-muted rounded-xl"
        >
          <Share className="w-6 h-6 text-primary" />
        </motion.div>
      </div>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">
        Salva su Android
      </h2>
      
      <div className="space-y-4">
        <InstructionStep
          number={1}
          icon={<MoreVertical className="w-5 h-5" />}
          text="Tocca i 3 puntini in alto a destra"
        />
        <InstructionStep
          number={2}
          icon={<Download className="w-5 h-5" />}
          text='Seleziona "Installa app" o "Aggiungi a schermata Home"'
        />
        <InstructionStep
          number={3}
          icon={<CheckCircle2 className="w-5 h-5" />}
          text="Conferma l'installazione"
        />
      </div>

      <div className="flex justify-center">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-3 bg-muted rounded-xl"
        >
          <MoreVertical className="w-6 h-6 text-primary" />
        </motion.div>
      </div>
    </div>
  );
}

function DesktopInstructions() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground text-center">
        Installa su Desktop
      </h2>
      
      <div className="space-y-4">
        <InstructionStep
          number={1}
          icon={<Download className="w-5 h-5" />}
          text="Cerca l'icona di installazione nella barra degli indirizzi"
        />
        <InstructionStep
          number={2}
          icon={<CheckCircle2 className="w-5 h-5" />}
          text='Clicca su "Installa"'
        />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Per la migliore esperienza, usa il tuo smartphone
      </p>
    </div>
  );
}

function InstructionStep({ 
  number, 
  icon, 
  text 
}: { 
  number: number; 
  icon: React.ReactNode; 
  text: string;
}) {
  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: number * 0.1 }}
      className="flex items-center gap-4"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
        {number}
      </div>
      <div className="flex items-center gap-2 text-foreground">
        <span className="text-primary">{icon}</span>
        <span>{text}</span>
      </div>
    </motion.div>
  );
}
