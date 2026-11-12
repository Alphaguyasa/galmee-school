# ROADMAP: Galmee School

## M0: Foundation (shared pattern for all Galmee products)

- [x] Next.js App Router + TS + Tailwind + shadcn/ui scaffold; `npm run build` passes
- [x] PWA manifest, icons, offline shell; installs from Android Chrome
- [x] Supabase client (`@supabase/ssr`) with `.env.example` values; middleware session refresh
- [x] Auth: sign up, log in, log out; after first signup call `create_tenant` (vertical `school`)
- [x] next-intl with `am`, `om`, `en`; language switcher; Ethiopic-friendly font (Noto Sans Ethiopic)
- [x] Ethiopian calendar date display helper + tests
- [x] App shell: bottom navigation on mobile, sidebar on desktop, tenant name and logo
- [ ] Staff management (owner only): invite staff, set role
- [x] Generated Supabase TypeScript types committed

## M1: Core screens

- [ ] Customers: list, search by name/phone, detail with balance
- [ ] Payments and credit: record payment, credit statement
- [ ] Reports: today / this week / this Ethiopian month; export CSV
- [ ] Offline queue for fee payments only, with sync status indicator

## M2: Galmee School features

- [x] Student register by class and section
- [x] Fee plans per grade
- [x] Fee collection with receipt
- [x] Unpaid fees by class
- [x] Grade entry and report card print
- [x] Attendance
- [x] Parent contact list
- [x] Migration: sc_students
- [x] Migration: sc_guardians
- [x] Migration: sc_classes
- [x] Migration: sc_enrollments
- [x] Migration: sc_fee_plans
- [x] Migration: sc_fee_invoices
- [x] Migration: sc_subjects
- [x] Migration: sc_grades
- [x] Migration: sc_attendance
- [x] Generate monthly/term invoices for all students in one click
- [x] `sc_record_fee_payment` RPC (writes core `payments`)
- [x] Rank calculation per class

## M-next: Tier 1 close-out

- [x] Thermal receipt layout (Amharic) for fee receipts
- [x] Print + reprint from the receipt screen
- [ ] Payment-received SMS row queued by `sc_record_fee_payment`

## M-after: Tier 2 and 3

- [ ] Fee-due SMS generator per class/period into notifications
- [ ] Absence SMS on attendance save
- [ ] Collections report screen (today / Ethiopian month) + CSV
- [ ] Offline queue for fee payment with client_ref
- [ ] Report-card-ready Telegram batch
- [ ] Teacher role: restrict mark entry to own subjects (with audit log)
- [ ] Academic-year roll-over (promote classes, close year)
- [ ] Excel import of students; export everything

## M3: Notifications

- [ ] SMS/Telegram to parents: fee due, payment received, report card ready, absence
- [ ] Edge Function reads `notifications` queue and sends (needs AfroMessage/Telegram keys: ask in the decision log)

## M4: Demo ready

- [ ] Demo tenant "Galmee School Demo" with data: 1 KG + primary school, 6 classes, 120 fictional students, fee plans, one term of grades
- [ ] Demo login documented in the decision log for Alpha (password set by Alpha, never committed)
- [ ] 5-minute demo path works on a phone in airplane mode for the main action
- [ ] Amharic and Afaan Oromo text reviewed list in the decision log for Alpha (native speaker)

## M5: Client ready

- [ ] Receipt printing (58/80 mm thermal) and Telegram receipt
- [ ] Data import from Excel/CSV
- [ ] Export all tenant data to Excel
- [ ] Error monitoring hook (Sentry, DSN via env)
- [ ] README: setup, env vars, deploy steps

## Q: Quality and security baseline (do these inside M0 and M1, not after)

- [x] `docs/DESIGN.md` written per the frontend guidelines (palette, type with Ethiopic support, layout wireframes, reviewed against generic defaults)
- [x] Tailwind theme tokens and `next/font` fonts from DESIGN.md
- [x] `server-only` Data Access Layer in `src/server/dal/`; every Server Action validates with zod and re-checks auth + role
- [x] Security headers and CSP with nonce (the security guidelines section 5)
- [x] Cross-tenant RLS test extended to this product's tables and passing
- [x] Playwright screenshot script for 360 px and 1280 px
- [ ] `npm audit` clean, Dependabot active
- [ ] Self-audit (the security guidelines section 9) recorded in the dev log
