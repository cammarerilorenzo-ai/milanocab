
## Aggiungere fascia di sconto 3-5 km all'8%

### Situazione attuale
Il pricing ha due fasce di sconto:
- Sotto 5 km: 20% di sconto (moltiplicatore 0.80)
- Sopra 5 km: 15% di sconto (moltiplicatore 0.85)

### Cosa cambia
Si aggiunge una fascia intermedia, ottenendo tre fasce:
- **Sotto 3 km**: 20% di sconto (moltiplicatore 0.80) -- invariato
- **Da 3 a 5 km**: 8% di sconto (moltiplicatore 0.92) -- NUOVA
- **Sopra 5 km**: 15% di sconto (moltiplicatore 0.85) -- invariato

### Modifiche tecniche

**1. `src/components/RideBookingForm.tsx`**
- Aggiungere al blocco `PRICING` le nuove costanti:
  - `discount3to5km: 0.92` (8% di sconto)
  - `distanceThresholdLow: 3` (soglia 3 km)
- Aggiornare la logica di calcolo sconto (riga ~262) da un `if/else` a un blocco a tre livelli:
  - `distanza <= 3 km` -> `discountUnder5km` (0.80)
  - `distanza > 3 km e <= 5 km` -> `discount3to5km` (0.92)
  - `distanza > 5 km` -> `discountOver5km` (0.85)

**2. `src/components/PricingConfigPanel.tsx`**
- Aggiungere `discount3to5km: 0.92` e `distanceThresholdLow: 3` ai valori di default
- Aggiungere un campo input per visualizzare/modificare lo sconto della fascia 3-5 km
- Aggiornare la formula di esempio per tenere conto delle tre fasce
