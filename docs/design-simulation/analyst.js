/* Analista IA da DEMO: chat local. As respostas são calculadas por regras sobre o cenário FICTÍCIO (OperDemo.answer). Sem rede. Estado preservado entre telas. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  const key = 'oper-radar-simulacao-analista', logKey = 'oper-radar-simulacao-analista-log';
  const saved = () => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const remember = v => { try { sessionStorage.setItem(key, v); } catch { /* armazenamento indisponível */ } };
  const loadLog = () => { try { return JSON.parse(sessionStorage.getItem(logKey) || '[]'); } catch { return []; } };
  const saveLog = l => { try { sessionStorage.setItem(logKey, JSON.stringify(l.slice(-20))); } catch { /* ok */ } };
  const esc = U ? U.esc : (s => String(s));
  const SUGGESTED = ['O preço do meu Volvo FH 540 está competitivo?', 'Onde há mais oportunidade para vender?', 'Quais erros e inconsistências nos dados?', 'Qual concorrente reduziu mais o preço?', 'Como está a cobertura da FIPE?', 'Me dê um panorama de hoje'];
  let open = false;
  document.getElementById('analyst')?.remove();
  const header = document.querySelector('.or-topbar__actions, .top');
  if (header && !header.querySelector('[data-analyst]')) header.insertAdjacentHTML('beforeend', '<button class="or-btn or-btn--secondary" type="button" data-analyst>Analista IA</button>');

  const msgHtml = m => m.q !== undefined
    ? `<div style="align-self:flex-end;max-width:85%" class="or-card or-card--sunken"><p style="margin:0">${esc(m.q)}</p></div>`
    : `<div style="align-self:flex-start;max-width:95%" class="or-card"><p style="margin:0;line-height:1.5">${esc(m.a.text)}</p><p class="or-card__sub" style="margin:var(--space-2) 0 0">Confiança: <strong>${esc(m.a.conf)}</strong>${(m.a.sources || []).length ? ' · Fontes: ' + m.a.sources.map(s => `<a href="${esc(s.href)}" style="color:var(--text-link)">${esc(s.label)}</a>`).join(' · ') : ''}</p></div>`;
  const render = () => {
    const log = document.getElementById('analyst-log'); if (!log) return;
    const items = loadLog();
    log.innerHTML = items.length ? items.map(msgHtml).join('') : `<p class="or-card__sub" style="margin:0">Faça uma pergunta ou escolha uma sugestão. As respostas usam os dados fictícios desta demonstração e sempre mostram a confiança e as fontes.</p>`;
    log.scrollTop = log.scrollHeight;
  };
  const ask = q => {
    q = (q || '').trim(); if (!q || !D) return;
    const items = loadLog(); items.push({ q }); items.push({ a: D.answer(q) }); saveLog(items); render();
    const inp = document.getElementById('analyst-input'); if (inp) { inp.value = ''; inp.focus(); }
  };

  function show() {
    if (open) return; open = true; remember('open');
    const overlay = document.createElement('div');
    overlay.className = 'or-dialog-scrim'; overlay.id = 'analyst-overlay';
    overlay.innerHTML = `<section class="or-dialog or-dialog--lg" role="dialog" aria-modal="true" aria-labelledby="analyst-title" style="max-height:92vh;display:flex;flex-direction:column"><div class="or-dialog__head"><div><h2 class="or-dialog__t" id="analyst-title">Analista IA</h2><p class="or-dialog__d">IA de demonstração · respostas calculadas localmente sobre o cenário fictício</p></div><button class="or-iconbtn or-iconbtn--ghost" type="button" data-analyst-close aria-label="Fechar Analista IA"><i class="ph ph-x" aria-hidden="true"></i></button></div>
      <div class="or-alert or-alert--info"><span class="or-alert__ic"><i class="ph ph-info" aria-hidden="true"></i></span><span class="or-alert__body"><strong class="or-alert__t">Como funciona na demonstração</strong><span class="or-alert__d">Na versão de produção o Analista consulta um resumo real do banco. Aqui as respostas vêm de regras locais sobre dados fictícios — não é uma IA generativa.</span></span></div>
      <div id="analyst-log" style="display:flex;flex-direction:column;gap:var(--space-3);overflow:auto;min-height:120px;max-height:38vh;padding:var(--space-2) 0"></div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">${SUGGESTED.map(s => `<button type="button" class="or-tag" data-suggest="${esc(s)}"><span>${esc(s)}</span></button>`).join('')}</div>
      <form data-analyst-form style="display:flex;gap:var(--space-2);align-items:flex-end;margin-top:var(--space-3)"><label class="or-field" style="flex:1;min-width:0"><span class="or-field__label">Sua pergunta</span><span class="or-input"><i class="ph ph-chat-circle-text" aria-hidden="true"></i><input id="analyst-input" autocomplete="off" placeholder="Ex.: meu Scania R 450 está caro?"></span></label><button class="or-btn or-btn--primary" type="submit">Enviar</button></form>
      <div class="or-dialog__foot"><a class="or-btn or-btn--secondary" href="inteligencia.html">Abrir Inteligência</a><button class="or-btn or-btn--ghost" type="button" data-analyst-clear>Limpar conversa</button><button class="or-btn or-btn--primary" type="button" data-analyst-close>Fechar painel</button></div></section>`;
    document.body.appendChild(overlay); render();
    overlay.querySelector('#analyst-input')?.focus();
  }
  function close() { document.getElementById('analyst-overlay')?.remove(); open = false; remember('closed'); document.querySelector('[data-analyst]')?.focus(); }

  document.addEventListener('click', event => {
    if (event.target.id === 'analyst-overlay') { close(); return; }
    if (event.target.closest('[data-analyst-close]')) { close(); return; }
    if (event.target.closest('[data-analyst]')) { show(); return; }
    const sug = event.target.closest('[data-suggest]'); if (sug) { ask(sug.getAttribute('data-suggest')); return; }
    if (event.target.closest('[data-analyst-clear]')) { saveLog([]); render(); return; }
  });
  document.addEventListener('submit', event => { if (event.target.closest('[data-analyst-form]')) { event.preventDefault(); ask(document.getElementById('analyst-input')?.value); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) close(); });
  if (new URLSearchParams(location.search).get('analista') === '1') show();
})();
