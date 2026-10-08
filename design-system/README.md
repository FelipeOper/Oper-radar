# Oper Radar — Design System

**Oper Radar** is a market-intelligence product by Agência Oper for the Brazilian heavy-vehicle market (trucks, tractor units and implements). A Python scraper collects listings from vehicle marketplaces (OLX, Mercado Livre, Webmotors, Caminhões e Carretas, Só Caminhões, Na Pista…), a PHP + MySQL API stores them, and a React admin dashboard lets internal users and partners monitor volume, prices vs. FIPE, competitors and opportunities. Hosting: HostGator/cPanel (no SSH).

This system covers one surface: the **admin dashboard** — modern, clean, dark "cockpit" by default, with a full light theme and a **complete mobile experience** (nothing important removed on desktop, nothing important missing on mobile).

This is the canonical source of truth for Oper Radar's design tokens, components and visual/content guidelines (the same role a `DESIGN.md` plays in other projects) — kept up to date, not the raw generator export.

## Provenance

Triaged and reorganized on 2026-09-22 from a raw `design-system-export.zip` (Claude Design tool output,
200 files, single clean generation, no duplicate component versions found). Tool-internal artifacts of the
export process (`.thumbnail`, `thumbnail.html`, `_ds_manifest.json`, `SKILL.md`, the `uploads/` mockup
screenshots) were left out of this folder — they added nothing a developer or designer needs here. Full
triage log with what was kept vs. dropped and why: ask the Orquestrador session that did this reorg, or see
the repo's change history for the commit that introduced this folder.

## Sources

- The official logo files live in `assets/` (see Iconography below).
- `sources/pilo-case-study-urls.txt` — the "Pilo" autonomous-taxi case study by Shiva Studio (Behance) that
  informed this system's *style* (palette, type pairing, pill shapes, circular nav, glass notifications).
  Reference only — URLs, not the images themselves. None of Pilo's brand, logo or copy is used.
- No codebase, Figma or existing Oper Radar UI was provided when this was authored. The dashboard screens
  are therefore **new designs** in this system's language, not recreations — validate against the real
  product before treating them as ground truth.

## Index

- `styles.css` — entry point (imports only). Link this one file.
- `tokens/` — `fonts.css`, `icons-*.css` (Phosphor), `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `base.css`.
- `components/components.css` — all component classes (`or-*`), shipped via `styles.css`.
- `components/` — React primitives (see list below), source only (`.jsx` + `.d.ts` + `.prompt.md`).
- `_ds_bundle.js` — pre-built UMD bundle of the components (`window.OperRadarDesignSystem_f1ea51`). Required
  at runtime by every standalone HTML page under `reference/` and `guidelines/` — don't delete it even though
  the name looks like tool scaffolding.
- `reference/component-showcases/` — one `.html` per component category (Core, Data, Feedback, Forms,
  Navigation), open directly in a browser to see every variant/state live.
- `reference/ui-kit-admin/` — click-through admin dashboard (`index.html` desktop/responsive, `mobile.html`
  390px frame), a full example composed from these components.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand), open directly in a browser.
- `assets/` — logos (original + cropped transparent mark/wordmark/lockup).
- `fonts/` — Manjari (100/400/700), Inter variable, Phosphor regular/fill/bold.
- `lint/adherence.oxlintrc.json` — design-system adherence rules (raw hex colors, raw px values, importing
  component internals instead of the barrel, off-brand fonts). Wired into `app/`'s lint script — see the
  root repo README.

All the HTML pages above (`reference/**/*.html`, `guidelines/*.html`) are self-contained: they reference
`styles.css` and `_ds_bundle.js` via relative paths and render with no build step, no dev server, and no
dependency on `app/`. Just open them in a browser.

## Components

- **core/** — Button, IconButton, Icon, Badge, Tag, SectionTag, Avatar, LiveIndicator, Logo
- **forms/** — Input, Select, Checkbox, Radio, Switch
- **navigation/** — Sidebar (+ NavItem), Topbar, Tabs, BottomNav, Pagination
- **data/** — Card, StatCard, Sparkline, AreaChart, BarChart, DataTable, ProgressBar, ListRow
- **feedback/** — Alert, Toast, Tooltip, Dialog

No source component inventory existed when this was authored, so this is an authored standard set sized to
a data dashboard. Intentional additions beyond the generic list: **Icon** (wrapper for the Phosphor font),
**SectionTag** (the outlined eyebrow pill — brand signature), **LiveIndicator** (scraper status / radar
sweep), **Logo** (raster brand files), **StatCard / Sparkline / AreaChart / BarChart / DataTable** (dashboard
needs), **Sidebar / Topbar / BottomNav** (responsive shell).

Namespace for the prebuilt bundle/reference pages: `window.OperRadarDesignSystem_f1ea51`.

**Known gap:** the lint config (`lint/adherence.oxlintrc.json`) expects component imports to go through a
barrel file (`"Import design-system components from 'index.js', not component internals"`), but no such
`index.js` exists in `components/` yet. Not fabricated here since it wasn't part of the original export —
whoever wires this design system into `app/` for real should add it.

## UI kit — Oper Radar Admin

Screens: Login · Visão geral · Anúncios (+ detail dialog) · Alertas · Fontes · Configurações. Responsive:
≥1200 full sidebar, 900–1199 collapsed 76px rail, <900 top bar + bottom nav, tables stack into cards <640.
Theme toggle in the top bar. See `reference/ui-kit-admin/`.

---

## CONTENT FUNDAMENTALS

- **Language:** Brazilian Portuguese, always. Formal-technical but plain — an instrument panel, not a sales pitch.
- **Voice:** product speaks as the system, neutral third person; addresses the user implicitly or with "você" only when needed ("Avisaremos quando…"). Never "nós somos". No slang, no exclamation marks.
- **Casing:** Sentence case everywhere — titles, buttons, tabs ("Criar alerta", "Visão geral", "Preço caiu"). UPPERCASE only for eyebrow SectionTags / micro-labels ("VISÃO GERAL", "OPERAÇÃO").
- **Buttons:** verb first, 1–3 words: "Exportar CSV", "Coletar agora", "Monitorar preço", "Tentar de novo".
- **Numbers:** pt-BR format — `R$ 489.900`, `18.742`, `−4,2%`, `312.000 km`, dates `dd/mm/aaaa`, times `08:42`. Use real minus sign (−) and signed deltas (+4,8%). Abbreviate large money in KPIs with a unit: `R$ 412` + `mil`.
- **Relative time** for freshness: "há 2 min", "há 3 h", "ontem 23:10".
- **Headline pattern** (from the reference): a short statement where one clause is highlighted in radar green and an optional coda in muted gray — "Mercado de pesados **hoje.**" / "O mercado de pesados *em tempo real.* Sem ruído." Keep to one highlight.
- **Status words** are fixed vocabulary: Novo · Preço caiu · Oportunidade · Estável · Vendido · Coletando · Atrasado · Pausado.
- **Errors** say what happened + when + what to do: "Webmotors respondendo com atraso — Última coleta completa há 3 h." + "Tentar de novo".
- **Emoji:** never. Unicode used only for `→`, `·`, `−`, `…`, `⌘K`.

## VISUAL FOUNDATIONS

- **Mood:** dark cockpit. Near-black layers, one electric accent, lots of air, rounded everything. Calm until something matters — then green.
- **Color:** `--radar-500 #46F84B` (sampled from the neon logo) is the only accent; use it for the primary action, active nav, the single highlighted data series/bar, live dots and one accent card per view. Navy `#00285A` and blip orange `#F88000` come from the light logo — navy is the ink of the light logo only; orange = warning/attention. Neutrals follow the reference ramp (#0A0A0A → #141414 → #1A1A1A → #2E2E2E → #808080 → white). Text on green is always near-black, never white.
- **Themes:** dark default on `:root`; `[data-theme="light"]` flips surfaces to white cards on #F2F2F2 with soft shadows, and text-accent to `#007A22` for contrast.
- **Type:** Manjari 700 (rounded geometric, tight −0.025em) for page titles, dialog titles and hero statements only. Inter for everything else; KPI numerals Inter 700, tabular, −0.025em. Eyebrows Inter 500 11px uppercase +0.06em. Don't use Manjari inside small controls (its vertical metrics sit low).
- **Spacing:** 4px base (2/4/6/8/12/16/20/24/32/40/48/64). Card padding 20 (16 on mobile), grid gaps 16 (10 on mobile), page gutter 24/16.
- **Radii:** controls are pills (999); cards 20; dialogs, toasts, hero panels 28; inputs 14; small tiles 10. No sharp corners anywhere.
- **Cards:** surface-1 on bg-app, 1px hairline `rgba(255,255,255,.06)` border in dark, no shadow; in light, no border + `--shadow-sm`. Variants: accent (solid green, black text), inverse (white on dark), sunken (nested). No colored left-border cards, no gradients on surfaces.
- **Backgrounds:** flat. No textures, no full-bleed imagery in the app. The login brand panel is pure #000 with the glowing logo. The only gradients: chart area fills (series color → transparent) and the conic radar sweep.
- **Borders:** hairlines only (6% / 10% / 22% white). Outlined pills (22%) for eyebrows and outline buttons.
- **Shadows:** dark theme relies on surface steps; shadows only for floating layers (`--shadow-lg` on dialogs, toasts, floating nav). Glow (`--glow-dot`) only on live dots.
- **Transparency & blur:** glass (`rgba(20,20,20,.72)` + 16px blur) for the sticky top bar, bottom nav and toasts — elements that float over scrolling content. Scrim 64% black + 4px blur behind dialogs.
- **Motion:** quiet and quick — ease-out `cubic-bezier(.2,.8,.2,1)`, 140ms hovers, 200–320ms enters (fade + 6px rise). Press = scale .97. Live dot pings; one radar sweep (4s linear) per screen max. `prefers-reduced-motion` disables all.
- **Hover:** surfaces step one level lighter (surface-2 → surface-3); primary green lightens (`--accent-hover`); ghost gains a surface fill. **Press:** darker green + slight shrink. **Focus:** 2px ring in radar green offset by bg.
- **Selection states:** filter chips & tabs go *inverse* (white pill, black text) — the reference's "All" chip; nav items go *green*.
- **Data viz:** series 1 always radar green with a fading area; comparison series white/gray and dashed; bars are pill-shaped with only the peak/highlight in green; dashed hairline gridlines; tabular numerals.
- **Imagery:** none in the app. If ever needed (reports, marketing), cool, clean, high-contrast photography of trucks/roads; no grain.
- **Layout:** fixed sidebar (248 / 76 collapsed) + sticky glass top bar on desktop; mobile gets a sticky top bar + fixed bottom nav with 48px circular items (reference pattern). Max content width 1440.

## ICONOGRAPHY

- **System:** [Phosphor Icons](https://phosphoricons.com) v2.1.1, self-hosted webfont (`fonts/Phosphor*.woff2`, classes in `tokens/icons-*.css`). Use via `<Icon name="truck" />` or `<i class="ph ph-truck">`.
- **Why Phosphor:** the reference uses soft, solid, rounded glyphs (home, car, clock, gear). No icon set was supplied, so Phosphor is a **substitution** — its *fill* weight matches that look and its *regular* weight suits dense UI. Flagged for review.
- **Weights:** regular for inline/UI (1.5px-ish stroke); **fill** for navigation, active states and icons inside colored discs; bold at ≤12px (carets, ×).
- **Containers:** icons often sit in circles — 36–48px discs on surface-2, or solid green/orange/red discs for status (Alert, activity feed). Toasts use a 44px rounded-square tile.
- **Sizes:** 16 in inputs, 18–20 in nav, 1.15em in buttons, 45% of the IconButton diameter.
- **No emoji, no hand-drawn SVG icons.** Unicode arrows only in copy.
- **Logo:** use the PNGs in `assets/` (`logo-oper-radar-dark.png`, `logo-oper-radar-light.png`, and cropped `mark-*`, `wordmark-*`, `logo-*-transparent.png`). Never redraw or recolor. Vector versions were not provided.

## Fonts

Manjari and Inter are the reference's own pairing, self-hosted from Google Fonts (latin subset). The Oper Radar wordmark itself is a different geometric sans (raster only); if the brand has an official typeface, supply it and we'll swap `--font-display`.
