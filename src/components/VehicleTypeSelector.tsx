import { cn } from "@/lib/utils";
import fiat500Image from "@/assets/fiat500.png";
import trocCabrioImage from "@/assets/troc-cabrio.png";

interface VehicleTypeSelectorProps {
  value: "economy" | "premium";
  onChange: (value: "economy" | "premium") => void;
}

export function VehicleTypeSelector({ value, onChange }: VehicleTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Economy option */}
        <button
          type="button"
          onClick={() => onChange("economy")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            value === "economy"
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <img src={fiat500Image} alt="Fiat 500" className="h-14 w-28 object-contain" />
          <div className="text-center">
            <p className="font-medium text-foreground text-xs">Utilitaria</p>
            <p className="text-[10px] text-muted-foreground">Comoda e conveniente</p>
          </div>
          {value === "economy" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
          )}
        </button>

        {/* Premium SUV option */}
        <button
          type="button"
          onClick={() => onChange("premium")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            value === "premium"
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <img src={trocCabrioImage} alt="T-Roc Cabrio" className="h-20 w-40 object-contain" />
          <div className="text-center">
            <p className="font-medium text-foreground text-xs">SUV Cabrio</p>
            <p className="text-[10px] text-muted-foreground">Spazio e stile</p>
          </div>
          {value === "premium" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
