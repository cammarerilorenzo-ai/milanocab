import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RideRequestCard } from "./RideRequestCard";
import { Loader2 } from "lucide-react";

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

interface ActiveRideRequestsProps {
  isAdmin: boolean;
  userPhone?: string;
}

export function ActiveRideRequests({ isAdmin, userPhone }: ActiveRideRequestsProps) {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCoords, setAdminCoords] = useState<{ lat: number; lon: number } | null>(null);

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "get_active_rides",
          phone: userPhone || ""
        }
      });

      if (error) {
        console.error("Error fetching rides:", error);
        return;
      }

      setRides(data?.rides || []);
      if (data?.adminCoords) {
        setAdminCoords(data.adminCoords);
      }
    } catch (error) {
      console.error("Error in fetchRides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();

    // Poll every 10 seconds to pick up ETA changes and status updates
    const pollInterval = setInterval(fetchRides, 10000);

    // Also subscribe to realtime as a bonus (may not fire due to RLS)
    const channel = supabase
      .channel("ride_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_requests"
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, userPhone]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rides.length === 0) {
    return null;
  }

  // Filter active rides (pending, confirmed, or picked_up)
  const activeRides = rides.filter(ride => {
    if (ride.status === "pending" || ride.status === "picked_up") return true;
    if (ride.status === "confirmed") {
      const confirmedTime = ride.created_at ? new Date(ride.created_at).getTime() : 0;
      return Date.now() - confirmedTime < 60 * 60 * 1000;
    }
    return false;
  });

  if (activeRides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        {isAdmin ? "Richieste corse" : "Le tue corse"}
      </h3>
      <div className="space-y-3">
        {activeRides.map((ride) => (
          <RideRequestCard
            key={ride.id}
            ride={ride}
            isAdmin={isAdmin}
            userPhone={userPhone}
            onStatusChange={fetchRides}
            adminCoords={adminCoords}
          />
        ))}
      </div>
    </div>
  );
}
