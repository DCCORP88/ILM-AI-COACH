# DESIGN.md: App Look and Feel

**Status:** draft, awaiting Deanna's review | **Version:** 0.2 | **Date:** 16 Nov 2026
**Brand:** International Lash Masters (ILM), chosen by Deanna on 16 Nov 2026.
**Source:** the live internationallashmasters.com site (computed styles read in a browser). Canva also has an "ILM EDUCATOR" brand kit; if it differs from the website, the brand kit wins. The app's own name is still an open commercial decision.

## Feel
Clean, confident and premium: black and white with a deep wine accent and soft blush. It should feel like ILM's site, professional rather than cute. Generous white space, bold uppercase headings, and numbers presented clearly.

## Colours
| Token | Light | Dark | Use |
|---|---|---|---|
| Ink | `#232323` | `#F4EFF0` | Body text (ILM site text colour) |
| Black | `#070707` | `#F4EFF0` | Primary buttons (ILM site buttons), sidebar wordmark |
| Background | `#FAF8F8` | `#0F0E0E` | Page |
| Surface | `#FFFFFF` | `#181616` | Cards |
| Wine (accent) | `#6D0D27` | `#E0A3B5` | Links, badges, progress bars, active states |
| Blush (accent soft) | `#EFE3E5` | `#2F1C22` | Highlights, coach message bubble, borders |
| Line | `#ECE4E5` | `#2E2A2B` | Dividers |
| Muted | `#6B6466` | `#B3AAAC` | Secondary text |
| Good / warning / problem | `#2F7A55` / `#9A5B12` / `#B61D0F` | lighter tints | Status only, never decoration |

ILM's red `#B61D0F` is used only for "problem" states (overdue, losing money).

## Type
- **Montserrat** for everything (as on the ILM site): 400 body, 600 headings and labels.
- Headings and buttons in **UPPERCASE** with slight letter spacing (0.04–0.08em), like ILM's section headers.
- Numbers (stats) at 600 weight, larger size.

## Shapes
- Square, editorial edges: 4px radius on cards and inputs, 2px on buttons.
- Primary button: solid black with white uppercase text. Secondary: outlined black.

## Logo
- For now the sidebar shows a text wordmark: **INTERNATIONAL LASH MASTERS**, with "Business Coach" underneath.
- **Logo in use:** `public/logo.png`, the ILM monogram downloaded from internationallashmasters.com with Deanna's OK on 16 Nov 2026 (1878×1536 PNG). Replace that file to change it (e.g. with a Canva brand-kit version), then restart the app.

## Rules
- Every colour comes from the tokens above. No one-off colours.
- Light and dark modes both follow the device setting.
- Demo data and demo mode are always badged in amber.
- Accessibility: body text contrast stays at WCAG AA or better; never use colour alone for status (add text such as "overdue").


## v0.2 decisions (Deanna, 16 Nov 2026)
- **Feel:** luxe and editorial. Montserrat for text, **Cormorant Garamond** (serif) for welcome headings only.
- **Menu:** a **white top menu bar on every screen, also in dark mode**, with the ILM logo on the left (`public/logo.png`; a serif "ILM" wordmark until the file is added). Desktop shows Home, My program, Ask the coach, Projects, My numbers + More. Phones get a white bottom tab bar (Home, Program, Coach, Projects, More).
- **Light/dark:** follows the device by default; the sun/moon button in the menu bar switches and remembers the choice on that device.
- **Components:** welcome header (date + greeting), "Your next step" feature card with a wine button, numbered sections, round tick buttons, progress ring for program activities, tiles for projects, 44px tap targets, focus rings for keyboard users.
- **Public pages:** split sign-in and sign-up pages (black brand panel with a wine glow + form), a landing page with the 4 program stages, and an onboarding welcome with a 3-step indicator.
