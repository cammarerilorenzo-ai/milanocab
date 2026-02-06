
## Aggiornamento ETA in tempo reale nel dialog di conferma

### Problema
Nella schermata "Corsa richiesta con successo", il valore "Arrivo autista" e l'orario "Arrivo" nell'overlay della mappa non si aggiornano quando l'admin modifica l'ETA. Il polling ogni 10 secondi recupera il nuovo `eta_min`, ma lo applica solo al primo cambio di stato a "confirmed", ignorando le modifiche successive.

### Soluzione
Aggiornare il polling in `RideConfirmationDialog.tsx` per sincronizzare sempre `remainingMinutes` con il valore `eta_min` ricevuto dal backend, indipendentemente dal cambio di stato.

### Modifiche tecniche

**File: `src/components/RideConfirmationDialog.tsx`**

1. **Aggiornare `remainingMinutes` ad ogni poll** -- Nel blocco `pollStatus`, dopo aver ricevuto `newEta`, aggiornare sempre `remainingMinutes` al valore `newEta` (senza il +2 per mantenerlo fedele a quanto impostato dall'admin), indipendentemente dal fatto che lo stato sia cambiato o meno.

2. **Aggiornare l'orario di arrivo nell'overlay mappa** -- Attualmente l'orario usa `etaMin` (prop statica). Sostituirlo con `remainingMinutes` (stato dinamico) in modo che si aggiorni automaticamente quando il polling rileva un nuovo ETA.

3. **Rimuovere `etaMin` dalle dipendenze del countdown `useEffect`** -- Il countdown locale basato su `setInterval` ogni 60 secondi diventa superfluo dato che il polling ogni 10 secondi fornisce sempre il valore aggiornato. Si puo' semplificare rimuovendo il timer locale e affidandosi interamente al polling per aggiornare i minuti.
