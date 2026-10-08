Focused task or confirmation (create alert, confirm delete). Title uses Manjari display.
```jsx
<Dialog title="Novo alerta de preço" description="Avisaremos quando um anúncio entrar na faixa." onClose={close} footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button>Criar alerta</Button></>}>…</Dialog>
```
- Destructive confirm: footer primary becomes `variant="danger"`, name the object in the title.