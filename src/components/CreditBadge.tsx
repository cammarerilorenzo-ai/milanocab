import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Receipt } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export function CreditBadge() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const balance = user?.creditBalance ?? 0;

  const loadTransactions = async () => {
    if (!user?.phone) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("manage-credits", {
        body: { action: "get_transactions", phone: user.phone, targetPhone: user.phone },
      });
      if (data?.success) setTransactions(data.transactions || []);
    } catch (e) {
      console.error("Error loading transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadTransactions();
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 hover:bg-yellow-400/30 transition-colors cursor-pointer"
          title="I tuoi crediti"
        >
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
            €{balance.toFixed(2)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Il tuo credito</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-500 mt-1">
            €{balance.toFixed(2)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
            Storico movimenti
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun movimento ancora
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{tx.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ml-2 ${
                      tx.amount >= 0 ? "text-green-500" : "text-destructive"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}€{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
