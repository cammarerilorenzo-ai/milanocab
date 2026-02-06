

## Aggiornamento info temporale nella card corsa

Attualmente in alto a destra nella card viene mostrato `date_time` (es. "Subito" o l'orario prenotato). Verra' sostituito con informazioni temporali dinamiche in base allo stato:

- **pending**: "In attesa da X min" (calcolato da `created_at`)
- **confirmed**: "Confermata da X min" (calcolato da `confirmed_at` o `created_at`)
- **completed**: data e ora di completamento (es. "06/02/2026 18:30")
- **cancelled / picked_up / altro**: comportamento attuale invariato

### Dettagli tecnici

**File: `src/components/RideRequestCard.tsx`**

1. Sostituire il contenuto dello `<span>` in alto a destra (attualmente `formatDateTime(ride.date_time)`) con una logica condizionale basata su `ride.status`.

2. Per gli stati `pending` e `confirmed`, calcolare i minuti trascorsi da `created_at` / `confirmed_at` usando `Date.now()` e aggiornare il valore ogni 60 secondi tramite un `useEffect` + `setInterval` con stato locale.

3. Per `completed`, formattare `confirmed_at` (o `created_at` come fallback) in formato "dd/MM/yyyy HH:mm" usando `date-fns`.

4. Per tutti gli altri stati, mantenere il comportamento attuale con `formatDateTime(ride.date_time)`.

