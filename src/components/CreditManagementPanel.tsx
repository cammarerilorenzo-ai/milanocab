import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Coins,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Plus,
  Minus,
  Star,
  History,
} from "lucide-react";

interface UserCredit {
  id: string;
  name: string | null;
  phone: string;
  customer_group: string | null;
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

interface CreditManagementPanelProps {
  userPhone: string;
}

export function CreditManagementPanel({ userPhone }: CreditManagementPanelProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [filtered, setFiltered] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [addingCredit, setAddingCredit] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("manage-credits", {
        body: { action: "list_users_credits", phone: userPhone },
      });
      if (data?.success) {
        setUsers(data.users);
        setFiltered(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userPhone]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q
        ? users.filter(
            (u) =>
              u.phone.includes(q) ||
              (u.name && u.name.toLowerCase().includes(q))
          )
        : users
    );
  }, [search, users]);

  const loadTransactions = async (phone: string) => {
    setTxLoading(true);
    setTransactions([]);
    try {
      const { data } = await supabase.functions.invoke("manage-credits", {
        body: { action: "get_transactions", phone: userPhone, targetPhone: phone },
      });
      if (data?.success) setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTxLoading(false);
    }
  };

  const selectUser = (u: UserCredit) => {
    if (selectedUser?.phone === u.phone) {
      setSelectedUser(null);
      return;
    }
    setSelectedUser(u);
    setCreditAmount("");
    setCreditReason("");
    loadTransactions(u.phone);
  };

  const handleAddCredit = async (positive: boolean) => {
    if (!selectedUser || !creditAmount || !creditReason) {
      toast({ title: "Compila importo e motivo", variant: "destructive" });
      return;
    }
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Importo non valido", variant: "destructive" });
      return;
    }
    setAddingCredit(true);
    try {
      const { data } = await supabase.functions.invoke("manage-credits", {
        body: {
          action: "add_credit",
          phone: userPhone,
          targetPhone: selectedUser.phone,
          amount: positive ? amount : -amount,
          reason: creditReason,
        },
      });
      if (!data?.success) throw new Error(data?.error || "Errore");
      toast({
        title: "Credito aggiornato",
        description: `Nuovo saldo: €${data.newBalance.toFixed(2)}`,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.phone === selectedUser.phone
            ? { ...u, balance: data.newBalance }
            : u
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, balance: data.newBalance } : prev
      );
      setCreditAmount("");
      setCreditReason("");
      loadTransactions(selectedUser.phone);
    } catch (e) {
      toast({ title: "Errore", description: String(e), variant: "destructive" });
    } finally {
      setAddingCredit(false);
    }
  };

  const handleUpdateGroup = async (group: string) => {
    if (!selectedUser) return;
    setUpdatingGroup(true);
    try {
      const { data } = await supabase.functions.invoke("manage-credits", {
        body: {
          action: "update_group",
          phone: userPhone,
          targetPhone: selectedUser.phone,
          customerGroup: group,
        },
      });
      if (!data?.success) throw new Error(data?.error || "Errore");
      toast({ title: "Gruppo aggiornato", description: `→ ${group}` });
      setUsers((prev) =>
        prev.map((u) =>
          u.phone === selectedUser.phone ? { ...u, customer_group: group } : u
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, customer_group: group } : prev
      );
    } catch (e) {
      toast({ title: "Errore", description: String(e), variant: "destructive" });
    } finally {
      setUpdatingGroup(false);
    }
  };

  const groupLabel = (g: string | null) => {
    if (g === "ambassador") return "Ambassador";
    if (g === "business") return "Business";
    return "Private";
  };

  const groupColor = (g: string | null) => {
    if (g === "ambassador") return "bg-yellow-400/20 text-yellow-600 border-yellow-400/40";
    if (g === "business") return "bg-blue-400/20 text-blue-600 border-blue-400/40";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Gestione Crediti</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome o telefono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filtered.map((u) => {
            const isSelected = selectedUser?.phone === u.phone;
            return (
              <div key={u.phone} className="rounded-xl border border-border overflow-hidden">
                {/* Row */}
                <button
                  onClick={() => selectUser(u)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {u.customer_group === "ambassador" && (
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {u.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${groupColor(u.customer_group)}`}
                    >
                      {groupLabel(u.customer_group)}
                    </span>
                    <span className="text-sm font-bold text-foreground w-16 text-right">
                      €{u.balance.toFixed(2)}
                    </span>
                    {isSelected ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded */}
                {isSelected && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                    {/* Group change */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Cambia gruppo</Label>
                      <div className="flex gap-2">
                        {(["private", "business", "ambassador"] as const).map((g) => (
                          <Button
                            key={g}
                            size="sm"
                            variant={u.customer_group === g ? "default" : "outline"}
                            disabled={updatingGroup}
                            onClick={() => handleUpdateGroup(g)}
                            className={`text-xs ${g === "ambassador" ? "border-yellow-400 text-yellow-600 hover:bg-yellow-400/20" : ""}`}
                          >
                            {g === "ambassador" && <Star className="h-3 w-3 mr-1" />}
                            {groupLabel(g)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Add / remove credit */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Modifica credito</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Importo €"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          disabled={addingCredit}
                          onClick={() => handleAddCredit(true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          disabled={addingCredit}
                          onClick={() => handleAddCredit(false)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Motivo (es: Bonus benvenuto)"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                      />
                    </div>

                    {/* Transaction history */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <History className="h-3 w-3 text-muted-foreground" />
                        <Label className="text-xs text-muted-foreground">Storico movimenti</Label>
                      </div>
                      {txLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nessun movimento</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex justify-between items-center text-xs"
                            >
                              <div className="min-w-0">
                                <span className="text-foreground">{tx.reason}</span>
                                <span className="text-muted-foreground ml-2">
                                  {new Date(tx.created_at).toLocaleDateString("it-IT")}
                                </span>
                              </div>
                              <span
                                className={`font-semibold ml-2 flex-shrink-0 ${
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
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessun utente trovato
            </p>
          )}
        </div>
      )}
    </div>
  );
}
