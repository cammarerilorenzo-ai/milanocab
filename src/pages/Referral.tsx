import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone, User, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Referral() {
  const [referralPhone, setReferralPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!referralPhone.trim()) {
      setError("Inserisci il numero di chi ti ha invitato");
      return;
    }

    if (!newPhone.trim()) {
      setError("Inserisci il tuo numero di telefono");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-referral`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            referralPhone,
            newPhone,
            newName: newName.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Registrazione fallita");
      } else {
        setSuccess(`Registrazione completata! Sei stato invitato da ${data.referredBy}`);
        setReferralPhone("");
        setNewPhone("");
        setNewName("");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Errore di connessione");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Milano Cab" className="h-16" />
          </div>
          <CardTitle className="text-2xl">Registrazione Referral</CardTitle>
          <CardDescription>
            Inserisci il numero di chi ti ha invitato e il tuo numero per registrarti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referralPhone">Numero di chi ti ha invitato</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="referralPhone"
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={referralPhone}
                  onChange={(e) => setReferralPhone(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPhone">Il tuo numero di telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPhone"
                  type="tel"
                  placeholder="+39 333 7654321"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newName">Il tuo nome (opzionale)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newName"
                  type="text"
                  placeholder="Mario Rossi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-primary text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrazione in corso...
                </>
              ) : (
                "Registrati"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Torna al login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
