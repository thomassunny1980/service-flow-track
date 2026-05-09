## Purchase Entry MVP — Implementation Plan

A new **Purchases** module with vendor/customer master, purchase entries, and an automatic ledger that drives running balances. Builds on existing `customers`, `invoices`, and `quotations` tables.

---

### 1. Database changes (new migration)

**Extend `customers` table** (acts as Customer/Vendor master):
- `gstin` text
- `opening_balance` numeric default 0
- `party_type` text default `'customer'` — values: `customer`, `vendor`, `both`

**New table `purchases`** (purchase invoices from vendors):
- `vendor_id` uuid → customers.id
- `vendor_name` text
- `invoice_no` text, `purchase_date` date
- `items` jsonb (item_name, qty, rate, amount)
- `subtotal`, `tax_amount`, `total_amount`, `paid_amount`, `balance_amount` numeric
- `payment_type` text — `cash` | `credit` | `partial`
- `payment_mode` text — `cash` | `bank` | `upi` | `card`
- `notes` text, `created_by`, timestamps

**New table `ledger_transactions`**:
- `customer_id` uuid → customers.id
- `transaction_type` text — `purchase`, `sale`, `payment_in`, `payment_out`, `opening`
- `reference_no` text, `reference_id` uuid, `reference_table` text
- `credit` numeric (money owed to party / reduces receivable)
- `debit` numeric (money party owes / increases receivable)
- `transaction_date` date, `notes` text
- `running_balance` numeric (snapshot at time of insert)

**RLS:** admin full access; staff select/insert/update — same pattern as `invoices`.

**DB functions / triggers (SECURITY DEFINER, `SET search_path = public`):**
- `recalculate_party_balance(p_customer_id uuid)` — recomputes running balances chronologically.
- Trigger on `purchases` insert/update/delete → upserts a ledger row (`credit = total_amount`, `debit = paid_amount`) and recalculates that vendor's ledger.
- Trigger on `invoices` insert/update/delete → upserts ledger row (`debit = total_amount`, `credit = amount_paid`).
- Trigger on `customers` insert/update of `opening_balance` → upserts opening ledger row.

**Balance formula** stored as a view `party_balances`:
`balance = opening_balance + total_sales - total_purchases - payments_received + payments_made`
Positive = receivable, negative = payable. Convention matches the spec (Sales − Purchase + Opening).

---

### 2. Pages & routing (added to `App.tsx`)

```
/parties                → Parties.tsx       (list: name, mobile, purchase, sales, balance)
/parties/new            → PartyForm.tsx
/parties/edit/:id       → PartyForm.tsx
/parties/:id            → PartyLedger.tsx   (date, type, ref, credit, debit, running balance)
/purchases              → Purchases.tsx     (list with date / vendor / invoice / pending filters)
/purchases/new          → PurchaseForm.tsx
/purchases/edit/:id     → PurchaseForm.tsx
/purchases/:id          → PurchaseDetail.tsx
```

`AppSidebar.tsx` gets two new entries: **Parties** and **Purchases**.

---

### 3. Key UI behavior

**PurchaseForm**
- Vendor selector reuses `CustomerSearchInput` pattern; on select shows current balance badge (live from `party_balances`).
- Items table identical UX to `QuotationForm` (item_name, qty, rate, amount; auto totals).
- Payment type radio: Cash (paid = total) / Credit (paid = 0) / Partial (manual paid amount).
- Save → insert `purchases` row → trigger writes ledger → toast with new balance.

**Parties list**
- Columns: Name | Mobile | Purchase total | Sales total | Balance (color-coded: green receivable, red payable).
- Search by name/mobile/GSTIN; filter by type (customer/vendor/both).

**PartyLedger**
- Header: party info + opening + current balance.
- Table: Date | Type | Ref No | Credit | Debit | Running Balance, sorted ascending.
- Date range filter, transaction type filter, print/export later.

**Dashboard additions** (`Dashboard.tsx`)
- Cards: Total Purchases, Total Sales, Pending Receivables (sum positive balances), Pending Payables (sum negative balances).

---

### 4. Out of scope for this MVP
PDF/print for purchases, WhatsApp statements, inventory linkage from purchases, advanced GST, multi-warehouse, barcode, payment-only entries UI (payments still recordable via direct ledger insert later).

---

### Technical notes
- All money math in numeric columns; never `auth.uid()` in DB defaults.
- Triggers keep `ledger_transactions` as the single source of truth — UI never writes to it directly except via opening-balance change.
- `running_balance` is recomputed by `recalculate_party_balance` after any change so historical rows stay consistent.
- Reuse design tokens; no raw colors. Mobile: card layout under 768px, table on desktop (matches existing pattern).

Confirm and I'll run the migration and build the pages.
