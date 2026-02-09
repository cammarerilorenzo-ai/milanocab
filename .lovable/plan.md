

## Rendere il campo "Nome" obbligatorio

### Modifiche

**File: `src/pages/Referral.tsx`**
- Rimuovere la scritta "(opzionale)" dalla label del campo nome, cambiandola da "Il tuo nome (opzionale)" a "Il tuo nome"
- Aggiungere validazione: se `newName` e' vuoto, mostrare errore "Inserisci il tuo nome" prima di procedere con l'invio

### Dettagli tecnici

Nel file `src/pages/Referral.tsx`:
1. Modificare la Label da `"Il tuo nome (opzionale)"` a `"Il tuo nome"` (riga ~109)
2. Aggiungere un controllo di validazione nel metodo `handleSubmit`, dopo il check su `newPhone`, per verificare che `newName.trim()` non sia vuoto
3. Nel body della richiesta, passare `newName.trim()` direttamente invece di `newName.trim() || null`

