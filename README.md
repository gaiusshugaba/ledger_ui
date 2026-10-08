# Ledger

AP invoice reconciliation dashboard. Ingests invoices from email and upload, extracts structured fields with vision models, matches against POs and vendor records, and routes exceptions to humans with the reason, source document, and confidence scores all visible on one screen.

## Screens

- **Dashboard** — KPIs, recent activity, inline "why this is flagged" reasoning
- **Upload** — drag-and-drop + email forwarding channel
- **Review queue** — everything that needs a human, sorted by severity
- **Invoice detail** — PDF viewer on the left, extraction and checks on the right
- **Reconciled** — straight-through matches with match rate and confidence
- **Errors** — unresolved pipeline failures
- **Rules** — thresholds for auto-reconcile vs review, amount tolerance, severity bands
- **Vendors** — vendor master with aliases and per-vendor history
- **Notifications** — Slack routing per tier, daily summary scheduling
- **Audit log** — every action, with before/after diff for config changes
- **Team** — members, roles, seat usage

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- Supabase (Postgres, Storage, RLS)

## Design principles

- **Review reasons are first-class.** Every flagged invoice shows *why* next to the *what*.
- **Confidence is visible, not hidden.** Per-field scores sit beside extracted values.
- **Source stays in view.** The PDF doesn't disappear when you inspect the extraction.
- **Undo is cheap, mistakes are loud.** Optimistic UI with toast confirmation and audit trail.

## Local setup

```bash
git clone https://github.com/gaiusshugaba/ledger_ui.git
cd ledger_ui
npm install
