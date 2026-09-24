import React from 'react';
import logoDark from '../../design-system/assets/logo-dark-transparent.png';
import logoLight from '../../design-system/assets/logo-light-transparent.png';

/* Tela de login no layout do projeto Beta (docs/design-simulation/login.html): painel de marca
   a esquerda e formulario a direita; abaixo de 850 px so o formulario, com a logo no topo.
   Componente apresentacional: a autenticacao (auth.php, CSRF, erros) fica em App.jsx. */

function Logo({ className = '' }) {
  return <>
    <img className={`oc-logo-dark ${className}`.trim()} src={logoDark} alt="Oper Radar" loading="lazy" decoding="async" />
    <img className={`oc-logo-light ${className}`.trim()} src={logoLight} alt="Oper Radar" loading="lazy" decoding="async" />
  </>;
}

export function LoginLayout({ email, onEmail, senha, onSenha, erro, enviando, onSubmit }) {
  return (
    <main className="oc-login">
      <section className="oc-login__marca" aria-label="Oper Radar">
        <span />
        <div className="oc-login__marca-centro">
          <Logo className="oc-login__logo" />
          <p className="oc-login__frase">Inteligência para decidir <strong>com clareza.</strong></p>
          <span className="or-sectiontag">MERCADO DE VEÍCULOS PESADOS</span>
        </div>
        <span className="oc-login__marca-rodape">Oper Radar · Agência Oper</span>
      </section>

      <section className="oc-login__painel">
        <div className="oc-login__caixa">
          <div className="oc-login__logo-mobile"><Logo /></div>
          <div className="oc-login__titulo">
            <span className="or-sectiontag or-sectiontag--accent">ÁREA RESTRITA</span>
            <h1>Acesse sua área</h1>
            <p>Dados de mercado, FIPE e seu estoque em um ambiente privado.</p>
          </div>
          <form className="oc-login__form" onSubmit={onSubmit}>
            <label className="or-field">
              <span className="or-field__label">E-mail</span>
              <span className="or-input or-input--lg">
                <i className="ph ph-envelope-simple" aria-hidden="true" />
                <input type="email" autoComplete="username" required value={email} onChange={e => onEmail(e.target.value)} placeholder="seu@email.com" />
              </span>
            </label>
            <label className="or-field">
              <span className="or-field__label">Senha</span>
              <span className="or-input or-input--lg">
                <i className="ph ph-lock-key" aria-hidden="true" />
                <input type="password" autoComplete="current-password" required value={senha} onChange={e => onSenha(e.target.value)} placeholder="Sua senha" />
              </span>
            </label>
            {erro && (
              <div role="alert" className="or-alert or-alert--danger">
                <span className="or-alert__ic"><i className="ph-bold ph-warning" aria-hidden="true" /></span>
                <span className="or-alert__body"><span className="or-alert__d">{erro}</span></span>
              </div>
            )}
            <button type="submit" disabled={enviando} className="or-btn or-btn--primary or-btn--lg or-btn--block">
              {enviando ? 'Entrando…' : <>Entrar no radar <i className="ph ph-arrow-right" aria-hidden="true" /></>}
            </button>
          </form>
          <p className="oc-login__rodape"><i className="ph ph-shield-check" aria-hidden="true" /> Sessão protegida e senha criptografada</p>
        </div>
      </section>
    </main>
  );
}
