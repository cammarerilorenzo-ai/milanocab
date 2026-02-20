
# Piano: Sistema di Crediti e Gruppo Ambassador

## Panoramica

Il sistema introduce:
1. Un nuovo gruppo clienti **Ambassador** (aggiunto all'enum `customer_group`)
2. Una tabella `user_credits` per tracciare il saldo crediti di ogni utente
3. Una tabella `credit_transactions` per lo storico movimenti
4. Logica automatica: ad ogni login di un utente referralizzato da un Ambassador, quest'ultimo riceve +€20
5. Un badge **credito** visibile nell'header per tutti gli utenti
6. Un pannello admin per gestire manualmente i crediti

---

## Architettura del flusso

```text
Login utente X
     │
     ▼
verify-phone edge function
     │
     ├── Trova authorized_phones di X
     │       └── Ha referred_by? ──► Trova il referrer
     │                                     │
     │                               Il referrer è Ambassador?
     │                                     │
     │                               SÌ ──► Accredita +€20 al referrer
     │                                      (solo al PRIMO login di X)
     │
     └── Risponde con user + credit_balance
```

---

## Modifiche al Database (Migrazioni)

### 1. Aggiunta valore enum `ambassador`
```sql
ALTER TYPE customer_group ADD VALUE 'ambassador';
```

### 2. Tabella `user_credits`
Ogni riga rappresenta il saldo attuale di un utente:
```sql
CREATE TABLE user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
Popolata automaticamente alla prima verifica del telefono.

### 3. Tabella `credit_transactions`
Storico completo dei movimenti:
```sql
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,           -- chi riceve/perde il credito
  amount numeric NOT NULL,        -- positivo = accredito, negativo = addebito
  reason text NOT NULL,           -- es. "Referral: Mario Rossi"
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 4. RLS Policies
- `user_credits`: nessuna lettura diretta pubblica (solo tramite Edge Function)
- `credit_transactions`: nessuna lettura diretta pubblica

---

## Modifiche al Backend

### `verify-phone` Edge Function (modificata)
Dopo la verifica del numero, la funzione:

1. Crea/recupera il saldo crediti dell'utente (`user_credits`)
2. Controlla se è il **primo login** dell'utente (nessuna sessione preesistente in `auth_sessions`)
3. Se è primo login E il referrer è Ambassador:
   - Aggiunge una riga in `credit_transactions` per il referrer (+€20)
   - Aggiorna `user_credits` del referrer (`balance += 20`)
   - Il credito viene assegnato UNA SOLA VOLTA (primo login = prima sessione)
4. Restituisce anche `creditBalance` nella risposta

### Nuova Edge Function `manage-credits`
Usata dall'admin per:
- `get_balance`: leggere il saldo di un utente (per numero di telefono)
- `add_credit`: aggiungere credito manualmente
- `get_transactions`: storico movimenti di un utente
- `list_users_credits`: lista di tutti gli utenti con i loro saldi

---

## Modifiche al Frontend

### 1. `AuthContext.tsx`
Aggiunta di `creditBalance: number` nell'interfaccia `AuthUser` e nel contesto, popolato dalla risposta del login.

### 2. Header in `Index.tsx`
Aggiunta di un badge **€ credito** in alto a sinistra, vicino al pulsante "Invita":
```
[€ 20,00]  [👤 Invita]  LOGO  [telefono] [🚪]
```
Il badge sarà giallo/dorato, visibile per tutti (anche con €0,00), e cliccabile per vedere il dettaglio transazioni in un popover o modale.

### 3. Pannello Admin — Sezione Crediti
Nuova sezione nella pagina `/admin` chiamata **Gestione Crediti** con:
- Lista utenti con saldo e gruppo (evidenziando gli Ambassador)
- Campo per cercare un utente per telefono
- Form per aggiungere credito manualmente (importo + motivo)
- Possibilità di cambiare `customer_group` a `ambassador` direttamente
- Storico transazioni per utente

---

## Flusso dettagliato del credito Ambassador

| Evento | Azione |
|---|---|
| Utente A (Ambassador) invita Utente B | B viene registrato con `referred_by = A.id` |
| Utente B fa login per la prima volta | `verify-phone` rileva: primo login + referrer Ambassador → +€20 a A |
| Utente B fa login di nuovo | Nessun credito aggiuntivo (già assegnato) |
| Admin aggiunge credito manuale | Edge function `manage-credits` → accredito + transazione |

---

## File da creare/modificare

| File | Operazione |
|---|---|
| Migrazione SQL | CREA (enum + tabelle + RLS + indici) |
| `supabase/functions/verify-phone/index.ts` | MODIFICA (logica credito + ritorno saldo) |
| `supabase/functions/manage-credits/index.ts` | CREA (gestione admin crediti) |
| `supabase/config.toml` | MODIFICA (aggiunge `manage-credits` con `verify_jwt=false`) |
| `src/contexts/AuthContext.tsx` | MODIFICA (aggiunge `creditBalance`) |
| `src/pages/Index.tsx` | MODIFICA (badge credito in header) |
| `src/pages/Admin.tsx` | MODIFICA (sezione Gestione Crediti) |
