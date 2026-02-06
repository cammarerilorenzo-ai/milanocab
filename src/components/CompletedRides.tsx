import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RideRequestCard } from "./RideRequestCard";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RideRequest {
  id: string;
  pickup: string;
  destination: string;
  customer_phone: string;
  customer_name?: string | null;
  referral_name?: string | null;
  date_time: string;
  estimated_price: number;
  estimated_km: number;
  estimated_min: number;
  status: string;
  pickup_lat: number;
  pickup_lon: number;
  dest_lat: number;
  dest_lon: number;
  confirmation_token: string;
  created_at: string;
  confirmed_at?: string | null;
  eta_min?: number | null;
}

interface CompletedRidesProps {
  userPhone?: string;
}

export function CompletedRides({ userPhone }: CompletedRidesProps) {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "get_completed_rides",
          phone: userPhone || ""
        }
      });

      if (error) return;
      setRides(data?.rides || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchRides();
  }, [userPhone]);

  if (rides.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground px-1 py-2"
      >
        <span>Corse completate ({rides.length})</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="space-y-3 mt-2">
          {rides.map((ride) => (
            <RideRequestCard
              key={ride.id}
              ride={ride}
              isAdmin={false}
              userPhone={userPhone}
              onStatusChange={fetchRides}
            />
          ))}
        </div>
      )}
    </div>
  );
}
