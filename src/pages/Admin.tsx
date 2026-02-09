import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import peugeot108Image from "@/assets/peugeot108.png";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Car, Loader2, Settings, ShieldCheck, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PricingConfigPanel } from "@/components/PricingConfigPanel";
import { GroupPricingPanel } from "@/components/GroupPricingPanel";
import { DiscountLogicPanel } from "@/components/DiscountLogicPanel";
import { ServiceToggle } from "@/components/ServiceToggle";
import { AdminGpsTracker } from "@/components/AdminGpsTracker";
import logo from "@/assets/logo.png";
import fiat500Image from "@/assets/fiat500.png";
import trocCabrioImage from "@/assets/troc-cabrio.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VehicleSetting {
  id: string;
  vehicle_name: string;
  is_available: boolean;
  updated_at: string;
  display_name: string | null;
  description: string | null;
  image_url: string | null;
  price_multiplier: number | null;
  base_price: number | null;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleSetting[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [updatingService, setUpdatingService] = useState(false);
  // Add vehicle dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriceMultiplier, setNewPriceMultiplier] = useState("1.0");
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.phone) {
        navigate("/");
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-settings", {
          body: { action: "get_settings", phone: user.phone }
        });

        if (error || !data.success) {
          navigate("/");
          return;
        }

        setIsAdmin(true);
        setVehicles(data.vehicles);
        setServiceEnabled(data.serviceEnabled ?? true);
      } catch (error) {
        console.error("Error checking admin:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user, navigate]);

  const toggleVehicle = async (vehicleName: string, currentValue: boolean) => {
    if (!user?.phone) return;

    setUpdating(vehicleName);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_vehicle",
          phone: user.phone,
          vehicleType: vehicleName,
          isAvailable: !currentValue
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      setVehicles(prev => prev.map(v => 
        v.vehicle_name === vehicleName ? { ...v, is_available: !currentValue } : v
      ));

      const vehicle = vehicles.find(v => v.vehicle_name === vehicleName);
      toast({
        title: "Impostazione aggiornata",
        description: `${vehicle?.display_name || vehicleName} ${!currentValue ? "attivato" : "disattivato"}`
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

  const toggleService = async () => {
    if (!user?.phone) return;

    setUpdatingService(true);
    try {
      const newValue = !serviceEnabled;
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_app_setting",
          phone: user.phone,
          settingKey: "service_enabled",
          settingValue: newValue.toString()
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      setServiceEnabled(newValue);
      toast({
        title: "Impostazione aggiornata",
        description: `Servizio ${newValue ? "attivato" : "disattivato"}`
      });
    } catch (error) {
      console.error("Error toggling service:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato del servizio",
        variant: "destructive"
      });
    } finally {
      setUpdatingService(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setNewImageBase64(base64);
      setNewImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setNewImageBase64(null);
    setNewImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddVehicle = async () => {
    if (!user?.phone || !newVehicleType || !newDisplayName || !newDescription) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Check if vehicle type already exists
    if (vehicles.some(v => v.vehicle_name === newVehicleType.toLowerCase().replace(/\s+/g, "_"))) {
      toast({
        title: "Errore",
        description: "Esiste già un veicolo con questo identificativo",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "add_vehicle",
          phone: user.phone,
          vehicleType: newVehicleType.toLowerCase().replace(/\s+/g, "_"),
          displayName: newDisplayName,
          description: newDescription,
          priceMultiplier: parseFloat(newPriceMultiplier) || 1.0,
          imageBase64: newImageBase64
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiunta del veicolo");
      }

      setVehicles(prev => [...prev, data.vehicle]);
      setShowAddDialog(false);
      resetAddForm();

      toast({
        title: "Veicolo aggiunto",
        description: `${newDisplayName} è stato aggiunto con successo`
      });
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiungere il veicolo",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteVehicle = async (vehicleName: string) => {
    if (!user?.phone) return;

    const vehicle = vehicles.find(v => v.vehicle_name === vehicleName);
    if (!confirm(`Sei sicuro di voler eliminare "${vehicle?.display_name || vehicleName}"?`)) {
      return;
    }

    setUpdating(vehicleName);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "delete_vehicle",
          phone: user.phone,
          vehicleType: vehicleName
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'eliminazione");
      }

      setVehicles(prev => prev.filter(v => v.vehicle_name !== vehicleName));

      toast({
        title: "Veicolo eliminato",
        description: `${vehicle?.display_name || vehicleName} è stato rimosso`
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il veicolo",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdatePricing = async (vehicleType: string, multiplier: number, basePrice: number) => {
    if (!user?.phone) throw new Error("Non autenticato");

    const { data, error } = await supabase.functions.invoke("admin-settings", {
      body: {
        action: "update_pricing",
        phone: user.phone,
        vehicleType,
        priceMultiplier: multiplier,
        basePrice
      }
    });

    if (error || !data.success) {
      throw new Error(data?.error || "Errore nell'aggiornamento");
    }

    // Update local state
    setVehicles(prev => prev.map(v => 
      v.vehicle_name === vehicleType ? { ...v, price_multiplier: multiplier, base_price: basePrice } : v
    ));
  };

  const resetAddForm = () => {
    setNewVehicleType("");
    setNewDisplayName("");
    setNewDescription("");
    setNewPriceMultiplier("1.0");
    setNewImageBase64(null);
    setNewImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getVehicleImage = (vehicle: VehicleSetting) => {
    if (vehicle.image_url) return vehicle.image_url;
    if (vehicle.vehicle_name === "fiat500") return fiat500Image;
    if (vehicle.vehicle_name === "vwtroc") return trocCabrioImage;
    if (vehicle.vehicle_name === "peugeot108") return peugeot108Image;
    return null;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Pannello Admin</h1>
        </div>

        {/* GPS Tracker */}
        <div className="mb-4">
          <AdminGpsTracker userPhone={user?.phone || ""} />
        </div>

        {/* Service Toggle */}
        <div className="mb-6">
          <ServiceToggle
            isEnabled={serviceEnabled}
            isUpdating={updatingService}
            onToggle={toggleService}
          />
        </div>

        {/* Vehicle Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Gestione Veicoli</h2>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddDialog(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi
            </Button>
          </div>

          <div className="space-y-4">
            {vehicles.map((vehicle) => {
              const image = getVehicleImage(vehicle);
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-4">
                    {image && (
                      <img 
                        src={image} 
                        alt={vehicle.display_name || vehicle.vehicle_name} 
                        className="h-12 w-24 object-contain"
                      />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {vehicle.display_name || vehicle.vehicle_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.description || "Nessuna descrizione"}
                        {vehicle.price_multiplier && vehicle.price_multiplier !== 1 && (
                          <span className="ml-1">({vehicle.price_multiplier > 1 ? '+' : ''}{Math.round((vehicle.price_multiplier - 1) * 100)}%)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {updating === vehicle.vehicle_name ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Label htmlFor={vehicle.vehicle_name} className="text-sm text-muted-foreground">
                          {vehicle.is_available ? "Attivo" : "Disattivo"}
                        </Label>
                        <Switch
                          id={vehicle.vehicle_name}
                          checked={vehicle.is_available}
                          onCheckedChange={() => toggleVehicle(vehicle.vehicle_name, vehicle.is_available)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVehicle(vehicle.vehicle_name)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

        {/* Pricing Configuration */}
        <div className="mt-6">
          <PricingConfigPanel 
            vehicles={vehicles} 
            onUpdatePricing={handleUpdatePricing}
          />
        </div>

        {/* Group Pricing */}
        <div className="mt-6">
          <GroupPricingPanel userPhone={user?.phone || ""} />
        </div>

        {/* Discount Logic */}
        <div className="mt-6">
          <DiscountLogicPanel userPhone={user?.phone || ""} />
        </div>
      </main>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi nuovo veicolo</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del nuovo veicolo da aggiungere al catalogo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto del veicolo</Label>
              <div className="flex items-center gap-4">
                {newImagePreview ? (
                  <div className="relative">
                    <img 
                      src={newImagePreview} 
                      alt="Preview" 
                      className="h-20 w-32 object-contain rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-32 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Carica foto</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Vehicle Type ID */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Identificativo (ID)</Label>
              <Input
                id="vehicleType"
                placeholder="es: luxury_sedan"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Identificativo unico, sarà convertito in minuscolo senza spazi
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome visualizzato *</Label>
              <Input
                id="displayName"
                placeholder="es: Berlina Luxury"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione/Aggettivi *</Label>
              <Input
                id="description"
                placeholder="es: Elegante e spaziosa"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            {/* Price Multiplier */}
            <div className="space-y-2">
              <Label htmlFor="priceMultiplier">Moltiplicatore prezzo</Label>
              <Input
                id="priceMultiplier"
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                placeholder="1.0"
                value={newPriceMultiplier}
                onChange={(e) => setNewPriceMultiplier(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                1.0 = prezzo base, 1.3 = +30%, 1.5 = +50%
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }}>
              Annulla
            </Button>
            <Button 
              onClick={handleAddVehicle} 
              disabled={isAdding || !newVehicleType || !newDisplayName || !newDescription}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiunta...
                </>
              ) : (
                "Aggiungi veicolo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
