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
  eta_min?: number | null;
}

interface ActiveRideRequestsProps {
  isAdmin: boolean;
  userPhone?: string;
  adminPassword?: string;
}

export function ActiveRideRequests({ isAdmin, userPhone, adminPassword }: ActiveRideRequestsProps) {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRides = async () => {
    try {
      let query = supabase
        .from("ride_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (isAdmin) {
        // Admin sees all pending, confirmed, and picked_up rides
        query = query.in("status", ["pending", "confirmed", "picked_up"]);
      } else if (userPhone) {
        // Phone is redacted in DB as ***XXXX (last 4 digits)
        const cleanPhone = userPhone.replace(/\D/g, "");
        const last4 = cleanPhone.slice(-4);
        query = query.ilike("customer_phone", `%${last4}`);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error("Error fetching rides:", error);
        return;
      }

      setRides(data || []);
    } catch (error) {
      console.error("Error in fetchRides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("ride_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_requests"
        },
        (payload) => {
          console.log("Ride request change:", payload);
          fetchRides();
        }
      )
      .subscribe();

    return () => {
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
      // Show confirmed rides for 60 minutes
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
            adminPassword={adminPassword}
            onStatusChange={fetchRides}
          />
        ))}
      </div>
    </div>
  );
}
