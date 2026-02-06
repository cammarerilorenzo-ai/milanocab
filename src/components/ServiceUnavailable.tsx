import { Coffee, Moon } from "lucide-react";
import logo from "@/assets/logo.png";

export function ServiceUnavailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <img src={logo} alt="Milano Cab" className="h-20 w-auto mx-auto mb-8" />
        
        <div className="mb-6 flex justify-center gap-4">
          <div className="p-4 bg-yellow-400/20 rounded-full animate-pulse">
            <Coffee className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="p-4 bg-yellow-400/20 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}>
            <Moon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: "'Golden Antique', serif" }}>
          I nostri driver stanno riposando! 😴
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Al momento non ci sono conducenti disponibili. 
          Probabilmente stanno prendendo un caffè o facendo un pisolino... 
          Riprova tra poco!
        </p>
        
        <div className="p-4 bg-card rounded-xl border border-border">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Suggerimento:</strong> Riprova tra qualche minuto, 
            siamo sempre pronti a portarti dove vuoi!
          </p>
        </div>
      </div>
    </div>
  );
}
