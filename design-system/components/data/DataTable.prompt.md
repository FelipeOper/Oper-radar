Tabular data (listings, dealers, price history). Put it in a `<Card flush>`.
```jsx
<Card flush title="Anúncios recentes"><DataTable columns={[{ key: "modelo", header: "Modelo" }, { key: "preco", header: "Preço", align: "right", sortable: true }]} rows={rows} /></Card>
```
- Right-align numbers; tabular numerals are on by default.
- `stackOnMobile` (default) renders label/value cards <640px — no horizontal scroll needed.