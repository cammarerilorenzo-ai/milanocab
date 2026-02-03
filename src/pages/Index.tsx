import { Car } from "lucide-react";
import { RideBookingForm } from "@/components/RideBookingForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">RideNow</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Dove vuoi andare?
          </h2>
          <p className="text-muted-foreground">
            Prenota la tua corsa in pochi secondi
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-xl">
          <RideBookingForm />
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm text-muted-foreground">Risposta rapida</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm text-muted-foreground">Prezzi trasparenti</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">🛡️</div>
            <p className="text-sm text-muted-foreground">Viaggi sicuri</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border py-3">
        <p className="text-center text-sm text-muted-foreground">
          © 2025 RideNow - Tutti i diritti riservati
        </p>
      </footer>
    </div>
  );
};

export default Index;
