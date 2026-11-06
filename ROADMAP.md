# ROADMAP: Galmee School

## M0: Foundation (shared pattern for all Galmee products)

- [ ] Next.js App Router + TS + Tailwind + shadcn/ui scaffold; `npm run build` passes
- [ ] PWA manifest, icons, offline shell; installs from Android Chrome
- [ ] Supabase client (`@supabase/ssr`) with `.env.example` values; middleware session refresh
- [ ] Auth: sign up, log in, log out; after first signup call `create_tenant` (vertical `school`)
- [ ] next-intl with `am`, `om`, `en`; language switcher; Ethiopic-friendly font (Noto Sans Ethiopic)
- [ ] Ethiopian calendar date display helper + tests
- [ ] App shell: bottom navigation on mobile, sidebar on desktop, tenant name and logo
- [ ] Staff management (owner only): invite staff, set role
- [ ] Generated Supabase TypeScript types committed

## M1: Core screens

- [ ] Customers: list, search by name/phone, detail with balance
- [ ] Items and stock (if this product uses stock): list, add, receive stock
- [ ] Payments and credit: record payment, credit statement
- [ ] Reports: today / this week / this Ethiopian month; export CSV
- [ ] Offline queue for the main money action with sync status indicator

## M2: Galmee School features

- [ ] Student register by class and section
- [ ] Fee plans per grade
- [ ] Fee collection with receipt
- [ ] Unpaid fees by class
- [ ] Grade entry and report card print
- [ ] Attendance
- [ ] Parent contact list
- [ ] Migration: sc_students
- [ ] Migration: sc_guardians
- [ ] Migration: sc_classes
- [ ] Migration: sc_enrollments
- [ ] Migration: sc_fee_plans
- [ ] Migration: sc_fee_invoices
- [ ] Migration: sc_subjects
- [ ] Migration: sc_grades
- [ ] Migration: sc_attendance
- [ ] Generate monthly/term invoices for all students in one click
- [ ] `sc_record_fee_payment` RPC (writes core `payments`)
- [ ] Rank calculation per class

## M3: Notifications

- [ ] SMS/Telegram to parents: fee due, payment received, report card ready, absence
- [ ] Edge Function reads `notifications` queue and sends (needs AfroMessage/Telegram keys: ask in NEEDS_APPROVAL.md)

## M4: Demo ready

- [ ] Demo tenant "Galmee School Demo" with data: 1 KG + primary school, 6 classes, 120 fictional students, fee plans, one term of grades
- [ ] Demo login documented in NEEDS_APPROVAL.md for Alpha (password set by Alpha, never committed)
- [ ] 5-minute demo path works on a phone in airplane mode for the main action
- [ ] Amharic and Afaan Oromo text reviewed list in NEEDS_APPROVAL.md for Alpha (native speaker)

## M5: Client ready

- [ ] Receipt printing (58/80 mm thermal) and Telegram receipt
- [ ] Data import from Excel/CSV
- [ ] Export all tenant data to Excel
- [ ] Error monitoring hook (Sentry, DSN via env)
- [ ] README: setup, env vars, deploy steps
