

## Test di 100 itinerari Milano - Confronto con Google Maps

### Obiettivo
Creare un test Deno per la Edge Function `calculate-route` con 100 coppie di indirizzi reali a Milano, verificando coerenza km/tempo e generando link Google Maps per il confronto diretto.

### Distribuzione itinerari
- **70 itinerari corti** (attesi sotto 5 km): coppie di vie vicine nella stessa zona
- **30 itinerari medi** (attesi 5-7 km): coppie di vie in zone distanti di Milano

### Come funziona il test

1. Definisce 100 coppie pickup/destination con vie reali di Milano
2. Chiama la Edge Function `calculate-route` per ogni coppia
3. Verifica che la risposta sia valida (success: true, distanceKm > 0, durationMin > 0)
4. Controlla che i 70 itinerari corti siano effettivamente sotto 5 km
5. Controlla che i 30 itinerari medi siano tra 5 e 7 km
6. Genera un link Google Maps Directions per ogni itinerario per confronto manuale
7. Produce un report finale con tabella riassuntiva (pickup, dest, km, min, link Google Maps)

### Output del test
Per ogni itinerario il test stampa:
- Indirizzo partenza e destinazione
- Distanza in km e durata in minuti (da OpenRouteService)
- Link Google Maps per confronto visivo
- Esito: PASS/FAIL rispetto alla fascia km attesa

### Dettagli tecnici

**Nuovo file:** `supabase/functions/calculate-route/route_test.ts`

Il test:
- Usa `Deno.test()` con un timeout esteso (300s) per gestire 100 chiamate API sequenziali
- Chiama la Edge Function deployata tramite fetch HTTP
- Aggiunge un delay di 1.5s tra le chiamate per rispettare i rate limit di OpenRouteService
- Raggruppa i risultati in "corti" e "medi" e valida le fasce
- Stampa un report CSV-like alla fine per analisi

**Rate limiting**: OpenRouteService ha limiti di 40 req/min sul piano gratuito. Il test inserisce pause tra le chiamate per evitare errori 429. Con 100 itinerari e 3 chiamate API ciascuno (geocode pickup, geocode dest, route), il test impieghera' circa 8-10 minuti.

**Nessuna API key Google Maps necessaria**: il confronto avviene tramite link Google Maps che si aprono nel browser per verifica visuale.

### Esempio di output
```text
#001 | Via Torino 5 -> Corso Buenos Aires 20 | 3.2 km | 12 min | PASS (<5km)
     | https://www.google.com/maps/dir/Via+Torino+5+Milano/Corso+Buenos+Aires+20+Milano
#002 | Piazza Duomo -> Via Padova 100        | 5.8 km | 18 min | PASS (5-7km)
     | https://www.google.com/maps/dir/Piazza+Duomo+Milano/Via+Padova+100+Milano
```
