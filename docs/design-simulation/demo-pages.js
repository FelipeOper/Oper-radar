/* DEMO Oper Radar — núcleo: monta o render da página atual (registrado via OperUI.page), tema (escuro/claro/automático) e a página Configurações. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) { console.error('[demo] motor ou UI não carregados'); return; }
  const here = location.pathname.split('/').pop() || 'index.html';

  const resolve = pref => pref === 'auto' ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : (pref === 'light' ? 'light' : 'dark');
  const applyTheme = pref => document.documentElement.setAttribute('data-theme', resolve(pref));
  applyTheme(U.store.get('theme', 'dark'));

  const themeToggle = () => {
    const bar = document.querySelector('.or-topbar__actions');
    if (!bar || bar.querySelector('[data-theme-toggle]')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'or-iconbtn or-iconbtn--outline'; btn.setAttribute('data-theme-toggle', '');
    const paint = () => { const light = document.documentElement.getAttribute('data-theme') === 'light'; btn.innerHTML = U.icon(light ? 'moon' : 'sun'); btn.setAttribute('aria-label', light ? 'Usar tema escuro' : 'Usar tema claro'); btn.title = btn.getAttribute('aria-label'); };
    btn.addEventListener('click', () => { const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; U.store.set('theme', next); applyTheme(next); paint(); });
    paint(); bar.insertBefore(btn, bar.firstChild);
  };

  // Configurações (funcional): tema e reinício da demonstração.
  U.page('configuracoes.html', main => {
    const draw = () => {
      const pref = U.store.get('theme', 'dark');
      main.innerHTML = U.stack(
        `<div><span class="or-sectiontag or-sectiontag--accent">PREFERÊNCIAS</span><h1 style="margin:var(--space-3) 0 var(--space-1)">Configurações</h1><p class="or-card__sub" style="margin:0">Ajuste a aparência e reinicie a demonstração quando quiser.</p></div>` +
        U.grid(320,
          U.section('Aparência', 'O tema é salvo neste navegador.', `<p class="or-card__sub">Escolha como o Oper Radar aparece para você.</p>${U.tabs([{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }, { value: 'auto', label: 'Automático' }], pref, 'theme-pref')}<p class="or-card__sub" style="margin-top:var(--space-3)">Automático segue o tema do seu dispositivo.</p>`) +
          U.section('Sobre esta demonstração', 'Cenário fictício de ' + D.SCENARIO_DATE, `<ul style="margin:0;padding-left:var(--space-5);line-height:1.6"><li>${U.int(D.active.length)} anúncios ativos em ${D.dealers.length} revendas de ${D.UFS.length} estados.</li><li>Tudo é gerado no seu navegador; nada é enviado nem coletado.</li><li>“IA” aqui significa regras locais sobre os dados fictícios.</li></ul>`) +
          U.section('Reiniciar demonstração', 'Volta ao estado inicial.', `<p class="or-card__sub">Apaga as ações criadas no Plano de ação, o histórico do Analista IA e o tema salvo.</p>${U.button('Reiniciar demonstração', { kind: 'outline', icon: 'arrow-counter-clockwise', data: { reset: '1' } })}<p class="or-card__sub" data-reset-msg style="margin-top:var(--space-2)" aria-live="polite"></p>`)
        ) +
        U.listrow('Minha conta', 'Identidade de demonstração', 'conta.html'));
    };
    draw();
    U.on(main, 'click', '[data-theme-pref]', el => { const v = el.getAttribute('data-theme-pref'); U.store.set('theme', v); applyTheme(v); draw(); });
    U.on(main, 'click', '[data-reset]', () => {
      try { Object.keys(localStorage).filter(k => k.startsWith('oper-demo:')).forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch { /* armazenamento indisponível */ }
      applyTheme('dark'); draw();
      const m = main.querySelector('[data-reset-msg]'); if (m) m.textContent = 'Demonstração reiniciada.';
    });
  });

  const mount = () => {
    const render = U.pages[here], main = document.querySelector('#root main');
    if (render && main) {
      const backup = main.innerHTML;
      try { main.innerHTML = ''; render(main, { here, D, U }); }
      catch (e) { console.error('[demo] falha ao montar ' + here, e); main.innerHTML = backup; }
    }
    themeToggle();
  };
  mount();
})();
