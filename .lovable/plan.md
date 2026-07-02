# Multi-Tenant SaaS Conversion Plan

Convert the app from a single-company tool into a multi-tenant SaaS where you (super admin) provision companies, each company has strict data isolation, and tenants pay via subscription.

## Phase 1 — Data model (multi-tenancy foundation)

Add `tenant_id uuid` (references a new `tenants` table) to every operational table:
`customers, invoices, invoice_items, quotations, quotation_items, purchases, products, inventory, assets, ledger_transactions, remarks, shop_settings`.

New tables:
- `tenants` — company/workspace record: `name, slug, logo_url, contact_email, phone, address, status (active|suspended|trial|canceled), plan, trial_ends_at, created_by`.
- `tenant_members` — links `auth.users` to `tenants` with role (`admin`, `staff`). Replaces the current global `user_roles` for tenant-scoped roles.
- `subscriptions` — one row per tenant: `provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at`.
- Keep `user_roles` only for the `super_admin` platform role (you).

RLS rewrite:
- Add helper `public.current_tenant_id()` (security definer) that returns the caller's active tenant from `tenant_members`.
- Add `public.is_super_admin()` helper.
- Every operational table's policies become: `tenant_id = public.current_tenant_id() OR public.is_super_admin()`.
- `has_role(auth.uid(),'admin')` becomes tenant-scoped `is_tenant_admin(tenant_id)`.

Trigger updates:
- `handle_new_user` no longer auto-creates a shop; new users have no tenant until invited/provisioned.
- Invoice/quotation numbering functions (`generate_next_invoice_number`, `generate_next_quotation_number`) take `tenant_id` and read/write that tenant's `shop_settings` row (one row per tenant, not global).
- `recalculate_party_balance`, purchase/customer sync triggers stay logic-identical but scoped by `tenant_id`.

## Phase 2 — Migration of existing data

Single migration:
1. Create the new tables.
2. Insert one default tenant `"Primary Shop"` (name pulled from existing `shop_settings.shop_name`).
3. Backfill `tenant_id` on every existing row to that default tenant.
4. Insert every existing `auth.users` id into `tenant_members` as `admin` of that default tenant.
5. Promote your account to platform `super_admin` via `user_roles` (you confirm the email before running).
6. Make `tenant_id` NOT NULL after backfill.
7. Replace existing RLS policies with tenant-scoped versions.

Nothing existing is lost.

## Phase 3 — Super Admin console

New route group `/admin/*` gated by `is_super_admin()`:
- **Tenants list** — search, filter by status/plan, quick suspend/reactivate.
- **Create Tenant** wizard — company name, slug, contact, plan, trial length, initial admin email + auto-generated password (invite email sent via existing edge functions pattern). This is how you provision new customers.
- **Tenant detail** — members list, subscription status, usage counts (invoices, customers, storage), impersonate button (session flag routes queries via that `tenant_id` — only for super_admin, audit-logged).
- **Billing overview** — MRR, active tenants, trials expiring.

## Phase 4 — Tenant-side changes

- Add a slim **tenant context** (`useTenant()`) hydrated once on login from `tenant_members`. If a user belongs to only one active tenant, auto-select. If none, show "no workspace assigned" screen. All Supabase queries continue to work unchanged because RLS enforces the filter.
- **Settings → Shop Profile** now edits that tenant's `shop_settings` row (logo, contact, terms, numbering prefixes). Fully white-labeled per tenant.
- **Users page** (tenant admin only) — invite staff into their own tenant, remove members. Cannot touch other tenants.
- Print templates already read from `shop_settings`; they now read the tenant's row, so branding is automatic.

## Phase 5 — Subscriptions (billing)

- Use Lovable's built-in Stripe payments (recommended for SaaS; no user-managed keys). Flow:
  1. Enable Stripe payments via the platform tool.
  2. Define plans (e.g. Starter / Pro / Business — you'll define exact prices next step).
  3. Checkout is initiated from the tenant's **Billing** page → creates a Stripe Checkout session with tenant metadata.
  4. Webhook edge function updates the tenant's `subscriptions` row and flips `tenants.status` (`trial → active → past_due → canceled`).
- **Gate rule:** if `tenants.status` is `suspended`, `canceled`, or trial expired without upgrade, tenant users see a "Renew subscription" screen instead of the app. Super admin is never gated.
- Trial: 14 days on tenant creation by default (configurable in the create wizard).

## Phase 6 — Auth & routing

- Login page unchanged. After login: resolve tenant → if none, show onboarding-blocked screen with "Contact administrator". If super_admin, show `/admin` by default with a tenant switcher.
- Password reset, invite acceptance, and mobile number login flows preserved.

## Technical details

- All schema/policy changes go through one large migration (with GRANTs on every new public table for `authenticated` and `service_role`; no `anon`).
- Numbering sequences move from global `shop_settings` columns to per-tenant `shop_settings` rows, so tenants never collide on invoice numbers.
- Storage bucket `company-logos` gets path prefix `${tenant_id}/...` and a storage policy checking `tenant_members`.
- Edge functions that touch data (e.g. WhatsApp send, admin actions) accept `tenant_id` from JWT/session and re-verify membership.
- Client-side type changes: extend the generated Supabase types after migration; add `TenantProvider` at the top of `App.tsx` inside `BrowserRouter`.
- Impersonation stored in a signed cookie/local flag readable only when `is_super_admin()` returns true server-side.

## Rollout order

1. Migration + backfill (tenants, members, tenant_id everywhere, RLS rewrite). **Requires your confirmation before running — this is the big one.**
2. `TenantProvider` + login gating + tenant-scoped settings.
3. Super Admin console.
4. Stripe subscriptions + gating.
5. Cutover: invite-only for new tenants; existing data continues working as the default tenant.

## Open items before starting

- Confirm your admin email so migration promotes the right account to `super_admin`.
- Confirm subscription plan names + prices, or I can seed placeholders you edit later.
