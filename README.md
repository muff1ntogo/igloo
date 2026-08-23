# Igloo Vital Companion

Build a mobile-web front-end prototype for Igloo, a vitals-tracking

companion app for elderly users and the family members who help care for

them. This is a UI/UX prototype only — use mock/hardcoded data throughout.

No backend, no database, no authentication, no Supabase setup — I'll handle

the real data layer separately.

DESIGN SYSTEM — apply exactly and consistently across every screen:

- Background #EEF2F0 (soft sage-mist). Cards #FFFFFF with a 1px #E2E8E4

  border and soft shadow, 20–24px corner radius.

- Text: #22322D primary, #6F7D77 secondary/muted.

- Brand color (primary buttons, active states): #93304A, with a pale tint

  #F6E9EC for icon backgrounds and highlights.

- Per-metric colors, used consistently everywhere that metric appears —

  icon, chart line, badge: Blood Pressure #B14A62, Heart Rate #C17A3B,

  Oxygen #2C7A78, Glucose #6B5B95, each with its own pale tint for icon

  circles.

- Status colors, always paired with a text label, never color alone:

  Good #457A5C, Watch #B0813A, Urgent #B03D3D, each with a pale tint for

  badge backgrounds.

- Typography: clean sans-serif for all UI chrome and labels; serif ONLY

  for the big numeric vital-sign readings — a deliberate, restrained

  contrast, not used anywhere else.

- Recurring signature motif: a thin horizontal line with a single

  ECG-style pulse blip in the brand color, used as a small divider under

  page headers.

- Generous padding, minimum 44px tap targets, high contrast — this is

  for older adults, so nothing cramped or low-contrast.

SCREENS — bottom tab bar with 4 destinations plus a 5th elevated circular

"+" button centered in the bar, which opens an add-reading sheet rather

than switching tabs:

1. Dashboard — greeting + date, the pulse-line motif, a conditional alert

   banner when a reading is flagged, a 2-column grid of metric cards

   (icon, label, big serif number + unit, and a segmented control per

   card-grid toggling between a "vs Yesterday" delta and a colored status

   tag), a 7-day weekly consistency strip, two small trend line charts.

2. Log — readings grouped by day, each row showing a colored icon circle,

   metric + value, timestamp, a small capture-method tag (Scanned /

   Manual / Auto-synced), and a status badge.

3. Add sheet — first a choice between "Scan a reading" (mock camera view)

   and "Enter manually" (metric picker + input), then for scan, a confirm

   step showing an editable extracted value before saving.

4. Family — cards per connected family member (avatar, name, relation,

   status badge, short note), an "Invite a family member" button, and a

   per-metric toggle list controlling what's shared with them.

5. Profile — avatar/name/email header, a working "Simple view" toggle

   (when on, Dashboard swaps to one large status card instead of the

   grid), grouped settings rows (Preferences, Connected apps, Support)

   with icon + label + chevron, and a sign-out row.

Make it feel warm and human, not clinical — this is for people's health

and their family's peace of mind, not a hospital dashboard. Everything

should actually work: real tab navigation, toggles that actually change

what's displayed, the add sheet actually appends a new entry to the Log.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e8a52933-30c5-42d0-9f5a-7aae79197d24).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
