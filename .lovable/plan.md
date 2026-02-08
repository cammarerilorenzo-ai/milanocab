
# Prezzo sotto la destinazione e pulsanti aeroporto dinamici

## Cosa cambia

1. **Prezzo visualizzato subito sotto il campo destinazione**: Il blocco "Price Estimate" (attualmente in fondo al form, linee 583-617) viene spostato subito dopo il campo destinazione (dopo linea 504), cosi' l'utente vede immediatamente il prezzo calcolato.

2. **Pulsanti aeroporto visibili solo prima di scegliere la destinazione**: I pulsanti "Malpensa" e "Bergamo Orio" (linee 489-503) vengono nascosti quando la destinazione e' gia' stata inserita (cioe' quando `formData.destination.trim().length > 0`). Rimangono visibili quando il campo destinazione e' vuoto.

3. **Anche il loader "Calcolo percorso" e l'errore di route** vengono spostati subito sotto la destinazione, prima della nota.

## Dettagli tecnici

### File: `src/components/RideBookingForm.tsx`

**Spostamento blocchi** (linee 488-514 e 583-617):
- I pulsanti aeroporto (linee 489-503) vengono wrappati in una condizione: `{!formData.destination.trim() && (<div className="flex flex-wrap gap-2">...</div>)}`
- Il blocco "Route Calculation Status" (loader + errore, linee 506-514) resta subito dopo i pulsanti aeroporto
- Il blocco "Price Estimate" (linee 583-617) viene spostato subito dopo il blocco errore/loader, quindi ancora dentro la sezione destinazione
- Le sezioni nota, programma corsa, data/ora e submit restano nell'ordine attuale ma senza il price estimate duplicato in fondo
