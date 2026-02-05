import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Car, Loader2, Settings, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import fiat500Image from "@/assets/fiat500.png";
import trocCabrioImage from "@/assets/troc-cabrio.png";

interface VehicleSetting {
  id: string;
  vehicle_type: string;
  is_available: boolean;
  updated_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleSetting[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, [user]);

  const checkAdminAndLoadSettings = async () => {
    if (!user?.phone) {
      navigate("/");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "get_settings", phone: user.phone }
      });

      if (error || !data.success) {
        setIsAdmin(false);
        toast({
          title: "Accesso negato",
          description: "Non hai i permessi per accedere a questa pagina",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setVehicles(data.vehicles);
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVehicle = async (vehicleType: string, currentValue: boolean) => {
    if (!user?.phone) return;

    setUpdating(vehicleType);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_vehicle",
          phone: user.phone,
          vehicleType,
          isAvailable: !currentValue
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      setVehicles(prev => prev.map(v => 
        v.vehicle_type === vehicleType ? { ...v, is_available: !currentValue } : v
      ));

      toast({
        title: "Impostazione aggiornata",
        description: `${vehicleType === "economy" ? "Utilitaria" : "SUV Cabrio"} ${!currentValue ? "attivato" : "disattivato"}`
      });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'impostazione",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getVehicleInfo = (type: string) => {
    if (type === "economy") {
      return { name: "Utilitaria", image: fiat500Image, description: "Fiat 500 - Comoda e conveniente" };
    }
    return { name: "SUV Cabrio", image: trocCabrioImage, description: "T-Roc Cabrio - Spazio e stile (+30%)" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-yellow-400/30">
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <img src={logo} alt="Milano Cab" className="h-14 w-auto" />
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Admin Badge */}
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-foreground">Pannello Admin</h1>
        </div>

        {/* Vehicle Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Disponibilità Veicoli</h2>
          </div>

          <div className="space-y-4">
            {vehicles.map((vehicle) => {
              const info = getVehicleInfo(vehicle.vehicle_type);
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={info.image} 
                      alt={info.name} 
                      className="h-12 w-24 object-contain"
                    />
                    <div>
                      <p className="font-medium text-foreground">{info.name}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {updating === vehicle.vehicle_type ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Label htmlFor={vehicle.vehicle_type} className="text-sm text-muted-foreground">
                          {vehicle.is_available ? "Attivo" : "Disattivo"}
                        </Label>
                        <Switch
                          id={vehicle.vehicle_type}
                          checked={vehicle.is_available}
                          onCheckedChange={() => toggleVehicle(vehicle.vehicle_type, vehicle.is_available)}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            I veicoli disattivati non saranno visibili ai clienti nel form di prenotazione.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
