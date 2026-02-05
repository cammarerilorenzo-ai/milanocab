import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  ArrowLeft, 
  Smartphone, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Share,
  Plus,
  MoreVertical,
  QrCode
} from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { generateUserGuidePDF } from "@/lib/generatePdf";

export default function Guida() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generateUserGuidePDF();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span>Indietro</span>
          </Link>
          <img src={logo} alt="Milano Cab" className="h-10" />
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Golden Antique', serif" }}>
              Guida Utente
            </h1>
            <p className="text-muted-foreground">
              Tutto quello che devi sapere per usare Milano Cab
            </p>
          </div>

          {/* Download Button */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-foreground mb-1">Scarica la guida PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Tieni sempre a portata di mano le istruzioni
                  </p>
                </div>
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={isGenerating}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? "Generazione..." : "Scarica PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Install */}
          <GuideSection
            number={1}
            title="Salva l'app sulla Home"
            icon={<Smartphone className="w-6 h-6" />}
          >
            <p className="text-muted-foreground mb-4">
              Milano Cab funziona come un'app ma si apre dal browser. Per averla sempre a portata di mano:
            </p>
            
            <div className="grid gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xl">🍎</span> iPhone
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <span>Apri Safari e vai su <strong>milanocab.lovable.app</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <span className="flex items-center gap-1">Tocca l'icona <Share className="w-4 h-4 inline" /> in basso</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <span className="flex items-center gap-1">Scorri e tocca <Plus className="w-4 h-4 inline" /> "Aggiungi alla schermata Home"</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xl">🤖</span> Android
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <span>Apri Chrome e vai su <strong>milanocab.lovable.app</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <span className="flex items-center gap-1">Tocca <MoreVertical className="w-4 h-4 inline" /> in alto a destra</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <span>Seleziona "Installa app" o "Aggiungi a schermata Home"</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </GuideSection>

          {/* Step 2: Login */}
          <GuideSection
            number={2}
            title="Accedi con il tuo numero"
            icon={<Phone className="w-6 h-6" />}
          >
            <p className="text-muted-foreground mb-4">
              L'accesso è semplice e veloce. Basta inserire il tuo numero di telefono.
            </p>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <span>Apri l'app Milano Cab</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <span>Inserisci il tuo numero di telefono (es: +39 333 1234567)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                    <span>Premi "Accedi"</span>
                  </li>
                </ol>
                
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ <strong>Nota:</strong> Il tuo numero deve essere stato preventivamente autorizzato. Se non riesci ad accedere, contattaci.
                  </p>
                </div>
              </CardContent>
            </Card>
          </GuideSection>

          {/* Step 3: Book a ride */}
          <GuideSection
            number={3}
            title="Prenota una corsa"
            icon={<MapPin className="w-6 h-6" />}
          >
            <p className="text-muted-foreground mb-4">
              Prenotare una corsa è questione di secondi.
            </p>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <div>
                      <strong>Inserisci il punto di partenza</strong>
                      <p className="text-muted-foreground mt-1">Digita l'indirizzo o usa la posizione attuale</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <div>
                      <strong>Inserisci la destinazione</strong>
                      <p className="text-muted-foreground mt-1">Digita l'indirizzo di arrivo</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                    <div>
                      <strong>Scegli data e ora</strong>
                      <p className="text-muted-foreground mt-1">"Adesso" per partire subito, oppure programma</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                    <div>
                      <strong>Seleziona il veicolo</strong>
                      <p className="text-muted-foreground mt-1">Scegli tra le opzioni disponibili</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
                    <div>
                      <strong>Conferma la prenotazione</strong>
                      <p className="text-muted-foreground mt-1">Verifica i dettagli e premi "Richiedi Corsa"</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </GuideSection>

          {/* Step 4: Confirmation */}
          <GuideSection
            number={4}
            title="Ricevi la conferma"
            icon={<CheckCircle2 className="w-6 h-6" />}
          >
            <p className="text-muted-foreground mb-4">
              Dopo aver richiesto la corsa, riceverai un riepilogo con tutti i dettagli.
            </p>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Vedrai subito la stima del prezzo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Riceverai una conferma con tutti i dettagli</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>L'autista verrà notificato automaticamente</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </GuideSection>

          {/* QR Code section */}
          <Card className="mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <QrCode className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Condividi con un amico</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scannerizza il QR code o condividi il link per invitare qualcuno
              </p>
              <div className="bg-background rounded-lg p-3 font-mono text-sm break-all">
                milanocab.lovable.app/install
              </div>
            </CardContent>
          </Card>

          {/* Final Download Button */}
          <div className="mt-8 text-center pb-8">
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? "Generazione PDF..." : "Scarica la guida completa (PDF)"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function GuideSection({ 
  number, 
  title, 
  icon, 
  children 
}: { 
  number: number; 
  title: string; 
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: number * 0.1 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
          {number}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
      </div>
      <div className="ml-[52px]">
        {children}
      </div>
    </motion.section>
  );
}
