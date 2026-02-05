 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Label } from "@/components/ui/label";
 import { Phone, User, Loader2, AlertCircle, CheckCircle, QrCode } from "lucide-react";
 import logo from "@/assets/logo.png";
 
 export default function Registrati() {
   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [phone, setPhone] = useState("");
   const [error, setError] = useState("");
   const [success, setSuccess] = useState("");
   const [isLoading, setIsLoading] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError("");
     setSuccess("");
 
     if (!firstName.trim() || !lastName.trim()) {
       setError("Nome e cognome sono obbligatori");
       return;
     }
 
     if (!phone.trim()) {
       setError("Inserisci il numero di telefono");
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
             source: "qrCode",
             newPhone: phone,
             newName: `${firstName.trim()} ${lastName.trim()}`,
           }),
         }
       );
 
       const data = await response.json();
 
       if (!data.success) {
         setError(data.error || "Registrazione fallita");
       } else {
         setSuccess("Registrazione completata! Ora puoi accedere al servizio.");
         setFirstName("");
         setLastName("");
         setPhone("");
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
             <img src={logo} alt="Milano Cab" className="h-20" />
           </div>
           <CardTitle className="text-2xl flex items-center justify-center gap-2">
             <QrCode className="h-6 w-6" />
             Registrati
           </CardTitle>
           <CardDescription>
             Inserisci i tuoi dati per accedere al servizio Milano Cab
           </CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="firstName">Nome</Label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="firstName"
                     type="text"
                     placeholder="Mario"
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                     className="pl-10"
                     disabled={isLoading}
                     maxLength={50}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="lastName">Cognome</Label>
                 <Input
                   id="lastName"
                   type="text"
                   placeholder="Rossi"
                   value={lastName}
                   onChange={(e) => setLastName(e.target.value)}
                   disabled={isLoading}
                   maxLength={50}
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="phone">Numero di telefono</Label>
               <div className="relative">
                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   id="phone"
                   type="tel"
                   placeholder="+39 333 1234567"
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   className="pl-10"
                   disabled={isLoading}
                   maxLength={20}
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
               <p className="text-sm text-muted-foreground">
                 Hai già un account?{" "}
                 <Link to="/auth" className="text-primary hover:underline">
                   Accedi
                 </Link>
               </p>
             </div>
           </form>
         </CardContent>
       </Card>
     </div>
   );
 }