import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from './icons.jsx';
import { apiPost } from './apiClient.js';

export function IaBalloonModal({ onNavigateToChat }) {
  const [aberto, setAberto] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Oi! Faça uma pergunta sobre seu mercado.' }
  ]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!input.trim() || enviando) return;

    const novaMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, novaMsg]);
    setInput('');
    setEnviando(true);

    try {
      const resp = await apiPost('analista.php', {
        messages: [...messages, novaMsg]
      });
      if (resp?.analise) {
        setMessages(prev => [...prev, { role: 'assistant', content: resp.analise }]);
      }
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setEnviando(false);
    }
  };

  if (!aberto) {
    return (
      <button
        className="oc-balloon-btn"
        onClick={() => setAberto(true)}
        title="Abrir Analista IA"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="oc-balloon-modal">
      <div className="oc-balloon-header">
        <h3>Analista IA</h3>
        <div>
          <button
            className="oc-balloon-link-btn"
            onClick={() => {
              onNavigateToChat?.();
              setAberto(false);
            }}
            title="Abrir análise completa"
          >
            Expandir
          </button>
          <button
            className="oc-balloon-close"
            onClick={() => setAberto(false)}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="oc-balloon-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`oc-balloon-msg oc-balloon-msg--${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {enviando && (
          <div className="oc-balloon-msg oc-balloon-msg--assistant">
            Analisando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={enviar} className="oc-balloon-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunta rápida..."
          disabled={enviando}
          className="oc-balloon-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || enviando}
          className="oc-balloon-send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
