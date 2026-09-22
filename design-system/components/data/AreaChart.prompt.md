Time-series trend (listings per day, average price over time).
```jsx
<AreaChart height={220} labels={["01/09","08/09","15/09","22/09"]} series={[{ name: "Anúncios", data: [120,180,160,240] }, { name: "Período anterior", data: [100,140,150,170], dashed: true, area: false }]} />
```
