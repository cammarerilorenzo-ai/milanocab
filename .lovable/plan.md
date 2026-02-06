

## Rinominare `vehicle_type` in `vehicle_name` e aggiornare i valori

### Cosa cambia

1. **Colonna database**: `vehicle_type` viene rinominata in `vehicle_name`
2. **Valori nel database**:
   - `economy` diventa `fiat500`
   - `premium` diventa `vwtroc`
   - `ghetto` resta `ghetto`
3. **Tutto il codice** viene aggiornato per usare `vehicle_name` al posto di `vehicle_type` e i nuovi nomi

### Passaggi

**1. Migrazione database**
- Rinominare la colonna `vehicle_type` in `vehicle_name` nella tabella `vehicle_settings`
- Aggiornare i valori: `economy` -> `fiat500`, `premium` -> `vwtroc`

**2. Aggiornare `VehicleTypeSelector.tsx`**
- Rinominare tutte le occorrenze di `vehicle_type` in `vehicle_name` nell'interfaccia e nella logica
- Aggiornare le mappe `fallbackImages` e `vehicleImageStyles` per usare `fiat500` e `vwtroc` come chiavi

**3. Aggiornare `RideBookingForm.tsx`**
- Stato iniziale `vehicleType` da `"economy"` a `"fiat500"`
- Riferimenti alla colonna `vehicle_type` diventano `vehicle_name`
- Logica ETA: il check `"premium"` diventa `"vwtroc"`
- Costante `premiumEtaExtra` rinominata in `vwtrocEtaExtra`

**4. Aggiornare `Admin.tsx`**
- Funzione `getVehicleImage`: i check `"economy"` e `"premium"` diventano `"fiat500"` e `"vwtroc"`
- Tutti i riferimenti a `vehicle_type` diventano `vehicle_name`

**5. Aggiornare `PricingConfigPanel.tsx`**
- Tutti i riferimenti a `vehicle_type` nella prop e nella logica diventano `vehicle_name`

### Dettagli tecnici

- La migrazione usa `ALTER TABLE ... RENAME COLUMN` (operazione sicura, non distruttiva)
- Gli `UPDATE` cambiano i valori esistenti
- Il file `types.ts` si aggiornerà automaticamente dopo la migrazione
- Nessun impatto sulle RLS policies (non dipendono dal nome della colonna)
- I veicoli con `is_available: false` (ghetto, premium/vwtroc) non sono visibili agli utenti ma vengono aggiornati per coerenza

