/* DEMO Oper Radar — RUMO: página Minha conta. Identidade e plano FICTÍCIOS. Só OperUI/OperDemo, classes or-* e tokens. Sem rede. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;

  U.page('conta.html', main => {
    const themeLabel = { dark: 'Escuro', light: 'Claro', auto: 'Automático' }[U.store.get('theme', 'dark')] || 'Escuro';
    const rows = items => U.stack(items.map(([t, s]) => U.listrow(U.esc(t), U.esc(s))).join(''), 'var(--space-2)');

    main.innerHTML = U.stack(
      `<div><span class="or-sectiontag or-sectiontag--accent">PERFIL</span><h1 style="margin:var(--space-3) 0 var(--space-1)">Minha conta</h1><p class="or-card__sub" style="margin:0">Identidade e plano de demonstração. Nada aqui é real.</p></div>` +
      U.grid(320,
        U.section('Identidade', 'Perfil fictício', rows([
          ['Felipe Hilario', 'Gestor comercial'],
          ['Revenda Demo', 'Curitiba/PR · ' + D.own.length + ' veículos na Minha Loja']
        ])) +
        U.section('Plano', 'Ilustrativo, sem cobrança', U.stack(
          U.row(U.badge('accent', 'Plano Profissional') + U.badge('neutral', 'Fictício')) +
          rows([
            ['Regiões acompanhadas', D.UFS.map(u => D.UF_NAMES[u]).join(', ')],
            ['Revendas no radar', U.int(D.dealers.length) + ' revendas · ' + U.int(D.active.length) + ' anúncios ativos'],
            ['Atualização dos dados', 'Cenário de ' + D.SCENARIO_DATE]
          ]), 'var(--space-3)')) +
        U.section('Preferências', 'Salvas neste navegador', U.stack(
          rows([['Aparência', themeLabel]]) +
          '<p class="or-card__sub" style="margin:0">Região e período são escolhidos em cada tela, pelos filtros.</p>' +
          U.row(U.button('Abrir Configurações', { href: 'configuracoes.html', icon: 'gear' })), 'var(--space-3)')) +
        U.section('Reiniciar demonstração', 'Volta ao estado inicial', U.stack(
          '<p class="or-card__sub" style="margin:0">Apaga as ações criadas no Plano de ação, o histórico do Analista IA e o tema salvo.</p>' +
          U.row(U.button('Reiniciar demonstração', { kind: 'outline', href: 'configuracoes.html', icon: 'arrow-counter-clockwise' })), 'var(--space-3)'))
      ) +
      U.alert('info', 'Demonstração', 'Os dados desta conta são fictícios e nenhuma informação é enviada ou coletada.')
    );
  });
})();
