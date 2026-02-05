 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Label } from "@/components/ui/label";
 import { Phone, User, Loader2, AlertCircle, CheckCircle, ArrowLeft, UserPlus } from "lucide-react";
 import { useAuth } from "@/contexts/AuthContext";
 import logo from "@/assets/logo.png";
 
 export default function Invita() {
   const { user } = useAuth();
   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [newPhone, setNewPhone] = useState("");
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
 
     if (!newPhone.trim()) {
       setError("Inserisci il numero di telefono");
       return;
     }
 
     if (!user?.phone) {
       setError("Devi essere loggato per invitare qualcuno");
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
             referralPhone: user.phone,
             newPhone,
             newName: `${firstName.trim()} ${lastName.trim()}`,
           }),
         }
       );
 
       const data = await response.json();
 
       if (!data.success) {
         setError(data.error || "Registrazione fallita");
       } else {
         setSuccess(`${firstName} ${lastName} è stato aggiunto con successo!`);
         setFirstName("");
         setLastName("");
         setNewPhone("");
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
             <UserPlus className="h-6 w-6" />
             Invita un Amico
           </CardTitle>
           <CardDescription>
             Inserisci i dati della persona che vuoi invitare a usare Milano Cab
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
                    placeholder="Maria Teresa"
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
                  placeholder="Brambilla"
                   value={lastName}
                   onChange={(e) => setLastName(e.target.value)}
                   disabled={isLoading}
                   maxLength={50}
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="newPhone">Numero di telefono</Label>
               <div className="relative">
                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   id="newPhone"
                   type="tel"
                   placeholder="+39 333 1234567"
                   value={newPhone}
                   onChange={(e) => setNewPhone(e.target.value)}
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
                 <>
                   <UserPlus className="h-4 w-4 mr-2" />
                   Invita
                 </>
               )}
             </Button>
 
             <div className="text-center pt-2">
               <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                 <ArrowLeft className="h-3 w-3" />
                 Torna alla home
               </Link>
             </div>
           </form>
         </CardContent>
       </Card>
     </div>
   );
 }