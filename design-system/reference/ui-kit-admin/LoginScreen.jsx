function LoginScreen({ onLogin }) {
  const { Input, Button, Checkbox, LiveIndicator, Logo } = ORK;
  const [loading, setLoading] = React.useState(false);
  const submit = (e) => { e.preventDefault(); setLoading(true); setTimeout(onLogin, 700); };
  return (
    <div className="kit-login">
      <div className="kit-login__brand">
        <img src="../../assets/logo-dark-transparent.png" alt="Oper Radar" style={{ width: 'min(360px, 70%)', height: 'auto' }} />
        <p className="kit-display" style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', textAlign: 'center', maxWidth: 520 }}>O mercado de pesados <span style={{ color: 'var(--text-accent)' }}>em tempo real.</span> <span style={{ color: 'var(--text-tertiary)' }}>Sem ruído.</span></p>
        <LiveIndicator>7 fontes monitoradas agora</LiveIndicator>
      </div>
      <form className="kit-login__form" onSubmit={submit}>
        <div className="kit-login__mobilelogo"><Logo base="../../assets/" height={22} /></div>
        <div>
          <h1 className="kit-display" style={{ fontSize: 32 }}>Entrar</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Acesse o painel de inteligência de mercado.</p>
        </div>
        <Input label="E-mail" type="email" size="lg" defaultValue="felipe@oper.com.br" autoComplete="email" />
        <Input label="Senha" type="password" size="lg" defaultValue="••••••••••" autoComplete="current-password" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><Checkbox label="Manter conectado" defaultChecked /><a href="#">Esqueci a senha</a></div>
        <Button type="submit" size="lg" block endCircle disabled={loading}>{loading ? 'Entrando…' : 'Entrar no painel'}</Button>
      </form>
    </div>
  );
}
window.LoginScreen = LoginScreen;
