

# Fix errore durante prenotazione e countdown ETA

## Problema identificato

Ho trovato diversi problemi collegati:

1. **Errore 500 intermittente**: La funzione backend `admin-settings` a volte fallisce durante l'avvio (errore runtime), causando uno schermo bianco momentaneo
2. **Countdown ETA statico**: Ogni 10 secondi il sistema ri-carica le corse attive, e questo resetta il countdown perche' l'effetto che calcola il tempo rimanente si riavvia con lo stesso valore dal database
3. **Bug nel calcolo ETA**: Se l'admin prova a modificare l'ETA prima che il countdown si inizializzi, il sistema invia un valore non valido (`NaN`) al backend

## Soluzione

### 1. Rendere il componente ActiveRideRequests resistente agli errori
- Aggiungere un error boundary per evitare lo schermo bianco se il caricamento fallisce
- Gestire meglio gli errori di rete senza bloccare l'interfaccia

### 2. Fixare il countdown ETA nel RideRequestCard
- Separare il valore dal database (`ride.eta_min`) dal countdown locale
- Usare un `useRef` per tracciare l'ultimo valore noto dell'ETA dal database
- Aggiornare il countdown locale solo quando l'admin modifica effettivamente l'ETA (valore diverso dal precedente)
- Countdown basato su timestamp per precisione

### 3. Fixare il bug NaN in adjustEta
- Inizializzare `remainingMinutes` dal valore del database se null prima di calcolare

### 4. Ottimizzare la query get_active_rides
- Aggiungere filtro per status anche per utenti non-admin, per evitare di caricare corse completate/cancellate inutilmente

## Dettagli tecnici

### File: `src/components/RideRequestCard.tsx`
- Aggiungere `lastKnownEtaRef` (useRef) per tracciare l'ultimo `eta_min` dal database
- Modificare l'useEffect del countdown per:
  - Inizializzare il countdown solo al primo mount o quando l'ETA cambia realmente
  - Usare `setInterval` ogni 60 secondi per decrementare
  - Non resettare quando il parent ri-renderizza con lo stesso `eta_min`
- Fixare `adjustEta`: usare `(remainingMinutes ?? ride.eta_min ?? 0) + delta`

### File: `src/components/ActiveRideRequests.tsx`
- Wrappare il rendering in un try-catch per evitare crash
- Se il fetch fallisce, mantenere i dati precedenti invece di mostrare errore

### File: `supabase/functions/admin-settings/index.ts`
- Nella sezione `get_active_rides` per utenti non-admin, aggiungere `.in("status", ["pending", "confirmed", "picked_up"])` al filtro della query

