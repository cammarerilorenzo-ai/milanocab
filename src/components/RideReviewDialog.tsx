import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RideReviewDialogProps {
  rideId: string;
  onClose: () => void;
}

export function RideReviewDialog({ rideId, onClose }: RideReviewDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Seleziona un voto", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("ride_reviews").insert({
        ride_id: rideId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Grazie per la recensione!" });
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Errore", description: "Impossibile inviare la recensione", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-3 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Chiudi"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <p className="text-sm font-medium pr-6">Come è andato il viaggio?</p>

      {/* Stars */}
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hoveredStar || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Lascia un commento (opzionale)"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        className="text-sm min-h-[60px] resize-none"
      />

      <Button
        size="sm"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia recensione"}
      </Button>
    </div>
  );
}
