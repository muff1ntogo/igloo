# Igloo

Build a mobile-web front-end prototype for Igloo, a vitals-tracking

companion app for elderly users and the family members who help care for

them. This is a UI/UX prototype only — use mock/hardcoded data throughout.

No backend, no database, no authentication, no Supabase setup — I'll handle

the real data layer separately.

DESIGN SYSTEM — apply exactly and consistently across every screen:

- Background: #EFF7F9. Cards: #FFFFFF with a 1px #DCEAEE border, soft shadow,

  22px corner radius.

- Ink (primary text, headings): #123247. Muted text: #5C7E8C.

- Brand (primary buttons, "+" button, active tab, active segmented-control):

  #186787, with a soft tint #E3F1F5 for large fill backgrounds.

- Brand-mid (avatars, secondary icon fills): #2087A8.

- Brand-light (icon chips, secondary highlights): #2FC1D3.

- Yellow accent: #FCD462, with pale tint #FBEFC6. Use sparingly for

  secondary highlights (e.g., "Invite a family member" button, soft glow

  behind mascot when status is "Good").

- Per-metric colors, used consistently everywhere that metric appears —

  icon, chart line, badge: Blood Pressure, Heart Rate, Oxygen, Glucose —

  each with its own tint. Do not modify these.

- Status colors, always paired with a text label: Good, Watch, Urgent —

  each with its own tint for badge backgrounds. Do not modify these.

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
