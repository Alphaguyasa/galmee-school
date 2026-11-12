# DESIGN.md: Galmee School

Written per the frontend guidelines. Change this file first, then the code.

> School now uses the shared **Galmee design system**. Tokens live in
> `src/app/globals.css` (only `--trade`, the exercise-book blue `#1D3F72`, is
> school-specific), shared components in `src/components/galmee/`. The colour
> and type tables below are superseded by those tokens and the Atkinson
> Hyperlegible / Noto Sans Ethiopic pair; the brief, the red margin line (the
> one bold thing) and the screen wireframes still apply.

## Brief

- **Subject:** the school office of a KG + primary school in Shashamane. A clerk with a phone, a stack of exercise books, a queue of parents at the window at the start of the month.
- **Audience:** the owner or director (who has not paid?), the bursar/clerk (takes fees, prints receipts), teachers (attendance and marks).
- **Primary job:** make "who has not paid this month" impossible to miss, and make taking a fee fast.

## Colour

Everything comes from a school exercise book.

| Token | Hex | Role |
| --- | --- | --- |
| `--cover` | `#1D3F72` | Dominant. The dark blue exercise-book cover: header bar, primary action. White on it is 10.1:1. |
| `--page` | `#FCFCFA` | Page background, the paper. A neutral white, not cream. |
| `--ink` | `#18233A` | Text, ballpoint blue-black. 15.6:1 on page. |
| `--rule` | `#D3DEEA` | The printed blue lines of the page: every list row divider. |
| `--margin-red` | `#C0271D` | The red margin line, and anything owed or wrong. 5.9:1 on white. |
| `--paid-green` | `#1A6B43` | Marked paid. 6.3:1 on white. |
| `--partly-amber` | `#9A5700` | Partly paid or late. 5.6:1 on white. |

Status is never colour alone: every state has a mark (✓, ✗, a half tick) and a word.

Light theme only for now: offices are bright and phones are used near windows.

## Type

- **Bitter** (Latin: English and Afaan Oromo). A sturdy slab drawn for screens, with the voice of a printed textbook. Avoids the anonymous-sans SaaS look and holds its shape at 360 px.
- **Noto Sans Ethiopic** for Amharic. Bitter is listed first so Latin text and digits use it; Ethiopic falls through to Noto.
- Both self-hosted with `next/font/local`, so they work offline and need no external request.
- Scale (1.25): 13 / 16 (body) / 20 / 25 / 31 px. Weights 400 and 700 (Ethiopic 600). Sentence case; no all-caps labels.
- Numbers use the `.num` class (`tabular-nums`) so columns line up.

## The one bold thing: the margin

Every register list is drawn like a page of a class register: blue ruled lines between rows and one **red margin line** running down the left, with the row's mark (paid ✓, owed ✗, present, absent) sitting in the margin the way a teacher marks a book. It is the thing a director reads in two seconds. Everything else stays quiet: flat surfaces, 1 px rules, small radius (6 px), no shadows, no gradients.

## Layout (360 px first)

```
Unpaid by class (phone)                Register (phone)
+----------------------------------+   +----------------------------------+
| [G] Bright Future School [am|om] |   | [G] Bright Future School [am|om] |  <- cover-blue bar
+----------------------------------+   +----------------------------------+
| Tikimt 2019: 37 of 120 unpaid    |   | [ Search name or phone        ]  |
| ETB 42,500.00 owed               |   | KG1 | KG2 | G1 | G2 | G3 | G4    |
| [ Remind all unpaid ]            |   |----------------------------------|
|---|------------------------------|   |   | Abdi Kedir       Roll 3       |
| ✗ | Grade 3A      9 unpaid  ...  |   |---|------------------------------|
|---|------------------------------|   |   | Bontu Hailu      Roll 4       |
| ✓ | Grade 1A      all paid       |   |---|------------------------------|
+----------------------------------+   +----------------------------------+
| Home | Students | Fees | Att | Mk |  | Home | Students | Fees | Att | Mk |
+----------------------------------+   +----------------------------------+
```

Desktop: the same lists in the content column, sidebar with the same five destinations.

## Review against generic defaults

- Not cream + terracotta: paper is neutral white, the accent is the margin-line red of an actual exercise book.
- Not identical rounded cards: lists are ruled rows with a margin, as on paper.
- No all-caps eyebrow labels, gradients or soft shadows.
- The product differs from the other Galmee systems in palette, Latin typeface and its signature element.
