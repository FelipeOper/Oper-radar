import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Copy, Check, AlertCircle } from './icons.jsx';
import { apiPost, API_BASE_URL } from './apiClient.js';

export function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu analista de mercado. Posso ajudar com insights sobre seu estoque, competição, preços e oportunidades. O que deseja saber?' }
  ]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!input.trim() || enviando) return;

    const novaMsg = { role: 'user', content: input };
    const historyComNova = [...messages, novaMsg];
    setMessages(historyComNova);
    setInput('');
    setErro('');
    setEnviando(true);

    try {
      const resp = await apiPost('analista.php', {
        messages: historyComNova.map(m => ({ role: m.role, content: m.content }))
      });

      if (resp?.resposta || resp?.analise) {
        setMessages([...historyComNova, { role: 'assistant', content: resp.resposta || resp.analise }]);
      } else {
        setErro('Resposta vazia do analista.');
        setMessages(historyComNova.slice(0, -1));
      }
    } catch (e) {
      setErro(e.message || 'Falha ao conectar com o analista.');
      setMessages(historyComNova.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  };

  const copiarMsg = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiado(idx);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="oc-main oc-chat-page">
      <div className="oc-chat-container">
        <div className="oc-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`oc-chat-msg oc-chat-msg--${msg.role}`}>
              <div className="oc-chat-bubble">
                {msg.content}
              </div>
              <button
                className="oc-chat-copy"
                onClick={() => copiarMsg(msg.content, idx)}
                title="Copiar"
              >
                {copiado === idx ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ))}
          {enviando && (
            <div className="oc-chat-msg oc-chat-msg--assistant">
              <div className="oc-chat-bubble oc-chat-loading">
                Analisando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {erro && (
          <div className="oc-chat-erro">
            <AlertCircle size={18} />
            {erro}
          </div>
        )}

        <form onSubmit={enviarMensagem} className="oc-chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre seu mercado, estoque, concorrentes..."
            disabled={enviando}
            className="oc-chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || enviando}
            className="oc-chat-btn-send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
