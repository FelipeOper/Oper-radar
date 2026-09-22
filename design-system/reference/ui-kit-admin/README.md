# Oper Radar Admin — UI kit

Click-through prototype of the Oper Radar admin dashboard, composed entirely from `components/`.

- `index.html` — responsive app (open at any width). Starts on Visão geral; "Sair" in Configurações shows Login.
- `mobile.html` — the same app inside a 390px frame.
- `App.jsx` — shell: Sidebar (≥900) / BottomNav (<900), Topbar, theme toggle, toasts, listing dialog. State persisted in `localStorage["or-kit"]`.
- Screens: `OverviewScreen`, `ListingsScreen`, `ListingDialog`, `AlertsScreen`, `SourcesScreen`, `SettingsScreen`, `LoginScreen`.
- `data.js` — fictional sample data. `kit.css` — layout grids and breakpoints only.

Interactions: switch screens, filter/sort/search listings, open a listing → "Monitorar preço" (toast), mark alerts read, toggle rules/sources, "Coletar agora" (progress + toast), dark/light theme.

Note: no existing Oper Radar UI was provided — these are new designs in the system's language.
