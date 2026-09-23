/* Painel visual local: estado entre páginas, sem requisições ou resposta gerada. */
(() => {
  const key = 'oper-radar-simulacao-analista';
  const saved = () => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const remember = value => { try { sessionStorage.setItem(key, value); } catch { /* file:// pode restringir armazenamento */ } };
  let open = false;
  document.getElementById('analyst')?.remove();
  const header = document.querySelector('.or-topbar__actions, .top');
  if (header && !header.querySelector('[data-analyst]')) header.insertAdjacentHTML('beforeend', '<button class="or-btn or-btn--secondary" type="button" data-analyst>Analista IA</button>');

  function show() {
    if (open) return;
    open = true;
    remember('open');
    const overlay = document.createElement('div');
    overlay.className = 'or-dialog-scrim';
    overlay.id = 'analyst-overlay';
    overlay.innerHTML = `<section class="or-dialog or-dialog--lg" role="dialog" aria-modal="true" aria-labelledby="analyst-title"><div class="or-dialog__head"><div><h2 class="or-dialog__t" id="analyst-title">Analista IA</h2><p class="or-dialog__d">Painel da simulação · estado preservado entre telas</p></div><button class="or-iconbtn or-iconbtn--ghost" type="button" data-analyst-close aria-label="Fechar Analista IA"><i class="ph ph-x" aria-hidden="true"></i></button></div><div class="or-alert or-alert--warning"><span class="or-alert__ic"><i class="ph ph-warning" aria-hidden="true"></i></span><span class="or-alert__body"><strong class="or-alert__t">Contexto ainda não conectado</strong><span class="or-alert__d">analista.php e insights.php não recebem o recorte da tela. A resposta abaixo é texto fictício, não gerado por IA.</span></span></div><p><strong>Pergunta de exemplo:</strong> O preço do FH 540 2021 em Curitiba está competitivo?</p><p>R$ 489.900 está abaixo da FIPE fictícia de R$ 505.000 e da mediana qualificada ilustrativa de R$ 498.000. Recorte: Curitiba/PR · 30 dias. Amostra: 11 ofertas, 9 válidas. Confiança média. Atualizado em 22/09/2026. Verifique versão e condição antes de decidir.</p><div class="or-dialog__foot"><a class="or-btn or-btn--secondary" href="comparador.html">Abrir evidências</a><button class="or-btn or-btn--primary" type="button" data-analyst-close>Fechar painel</button></div></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-analyst-close]').focus();
  }
  function close() {
    document.getElementById('analyst-overlay')?.remove();
    open = false;
    remember('closed');
    document.querySelector('[data-analyst]')?.focus();
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-analyst-close]')) { close(); return; }
    if (event.target.closest('[data-analyst]')) { show(); return; }
    const link = event.target.closest('a[href]');
    if (open && link) {
      const href = link.getAttribute('href');
      if (href && /^[\w-]+\.html(?:[?#].*)?$/.test(href)) {
        const url = new URL(href, location.href);
        url.searchParams.set('analista', '1');
        link.href = url.href;
      }
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) close(); });
  if (saved() === 'open' || (saved() === null && new URLSearchParams(location.search).get('analista') === '1')) show();
})();
