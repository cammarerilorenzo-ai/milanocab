import { RideBookingForm } from "@/components/RideBookingForm";
import logo from "@/assets/logo.png";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      {/* Google Maps Background */}
      <div className="fixed inset-0 z-0">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44792.78828766498!2d9.156497899999999!3d45.4642035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786c1493f1275e7%3A0x3cffcd13c6740e8d!2sMilano%20MI!5e0!3m2!1sit!2sit!4v1706806800000!5m2!1sit!2sit"
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mappa di Milano"
        />
        {/* Overlay gradient for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logo} alt="Milano's Cab" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-foreground">Milano's Cab</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2 drop-shadow-sm">
            Dove vuoi andare?
          </h2>
          <p className="text-muted-foreground drop-shadow-sm">
            Prenota la tua corsa in pochi secondi
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border p-6 shadow-2xl">
          <RideBookingForm />
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm text-muted-foreground">Risposta rapida</p>
          </div>
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm text-muted-foreground">Prezzi trasparenti</p>
          </div>
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl">
            <div className="text-2xl mb-2">🛡️</div>
            <p className="text-sm text-muted-foreground">Viaggi sicuri</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border py-3">
        <p className="text-center text-sm text-muted-foreground">
          © 2025 Milano's Cab - Tutti i diritti riservati
        </p>
      </footer>
    </div>
  );
};

export default Index;
