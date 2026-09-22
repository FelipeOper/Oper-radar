Primary desktop navigation (≥900px); swap for BottomNav on mobile.
```jsx
<Sidebar brand={<Logo base="assets/" height={22} />} value="overview" onNavigate={go}
  sections={[{ items: [{ value: "overview", label: "Visão geral", icon: "gauge" }, { value: "ads", label: "Anúncios", icon: "tag", badge: 128 }] }]} />
```
- `collapsed` → 76px rail (900–1199px). Width 248 expanded.