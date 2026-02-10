

## Notifica email all'admin per ogni calcolo itinerario

Quando un cliente calcola un itinerario (partenza + destinazione), l'admin ricevera una email con i dettagli del percorso calcolato.

### Cosa cambia

**1. Edge function `calculate-route` (modifica)**

Aggiungere, dopo il calcolo del percorso riuscito, l'invio di una email all'admin tramite Resend con:
- Indirizzo di partenza e destinazione
- Distanza (km) e durata (min)
- ETA stimata
- Prezzo fisso aeroporto (se applicabile)
- Link Google Maps al percorso
- Numero di telefono del cliente (se disponibile dall'header di autenticazione)

L'email sara inviata in modo "fire and forget" (non blocca la risposta al cliente) per non rallentare il calcolo.

### Dettagli tecnici

- Nella edge function `calculate-route/index.ts`, dopo aver calcolato il risultato con successo, si aggiunge una chiamata a Resend API usando i secret `RESEND_API_KEY` e `ADMIN_EMAIL` gia configurati
- L'email avra un template HTML semplice e informativo, diverso da quello delle richieste corsa (per distinguerle)
- Il subject sara del tipo: "Itinerario calcolato: [partenza] -> [destinazione]"
- L'invio email sara in un blocco try/catch separato cosi che eventuali errori non influenzino la risposta del calcolo percorso
- Non serve creare nuove tabelle o migrazioni

