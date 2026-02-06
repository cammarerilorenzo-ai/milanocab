import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Power, Loader2 } from "lucide-react";

interface ServiceToggleProps {
  isEnabled: boolean;
  isUpdating: boolean;
  onToggle: () => void;
}

export function ServiceToggle({ isEnabled, isUpdating, onToggle }: ServiceToggleProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isEnabled ? "bg-green-500/20" : "bg-red-500/20"}`}>
            <Power className={`h-5 w-5 ${isEnabled ? "text-green-500" : "text-red-500"}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stato Servizio</h2>
            <p className="text-sm text-muted-foreground">
              {isEnabled ? "Il servizio è attivo" : "Il servizio è spento"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isUpdating ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <>
              <Label htmlFor="service-toggle" className="text-sm text-muted-foreground">
                {isEnabled ? "Attivo" : "Spento"}
              </Label>
              <Switch
                id="service-toggle"
                checked={isEnabled}
                onCheckedChange={onToggle}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
