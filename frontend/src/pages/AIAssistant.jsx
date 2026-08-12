import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BarChart3 } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import { postAiChat } from '../services/aiService';
import { highlightMetrics } from '../components/highlightMetrics';
import AIChatChart from '../components/charts/AIChatChart';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [openCharts, setOpenCharts] = useState(new Set());
  const bottomRef = useRef(null);

  const toggleChart = (i) => {
    setOpenCharts((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsSending(true);

    try {
      const data = await postAiChat(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, chart: data.chart }]);
    } catch (e) {
      let content;
      if (e.status === 403) {
        content = "You don't have permission to use the AI Assistant.";
      } else if (e.status === 429) {
        content = 'Please wait a moment — too many requests.';
      } else {
        content = `Something went wrong: ${e.message}`;
      }
      setMessages((prev) => [...prev, { role: 'error', content }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageContainer
      title="AI Assistant"
      subtitle="Ask questions about greenhouse, solar, weather and emissions data in plain English"
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          backgroundImage: 'radial-gradient(var(--chat-dot-line) 1.6px, transparent 1.6px)',
          backgroundSize: '24px 24px',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Message thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              <Sparkles size={28} strokeWidth={1.5} style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                Ask something like "What was energy use last week?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === 'user') {
              return (
                <div key={i} className="gbtac-fade-in" style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
                  <div
                    style={{
                      background: 'var(--accent-blue)',
                      color: '#fff',
                      borderRadius: '12px 12px 2px 12px',
                      padding: '10px 14px',
                      fontSize: '14px',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }
            if (msg.role === 'error') {
              return (
                <div key={i} className="gbtac-fade-in" style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
                  <div
                    style={{
                      background: 'var(--status-red-bg)',
                      color: 'var(--status-red-text)',
                      borderRadius: '12px 12px 12px 2px',
                      padding: '10px 14px',
                      fontSize: '14px',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }
            const isChartOpen = openCharts.has(i);
            return (
              <div
                key={i}
                className="gbtac-fade-in"
                style={{ alignSelf: 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{
                    background: 'var(--bg)',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '10px 14px',
                    fontSize: '14px',
                  }}
                >
                  {highlightMetrics(msg.content)}
                </div>

                {msg.chart && (
                  <>
                    <button
                      type="button"
                      className="gbtac-btn-fx"
                      onClick={() => toggleChart(i)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        alignSelf: 'flex-start',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--ai-accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '6px 12px 6px 10px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(147,51,234,0.12)',
                        }}
                      >
                        <BarChart3 size={10} />
                      </span>
                      {isChartOpen ? 'Hide graph' : 'See AI-generated graph'}
                    </button>
                    {isChartOpen && <AIChatChart chart={msg.chart} />}
                  </>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="gbtac-fade-in" style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ display: 'flex', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data…"
            disabled={isSending}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              background: 'var(--bg)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="gbtac-btn-fx"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-blue)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isSending || !input.trim() ? 0.6 : 1,
            }}
          >
            <Send size={15} /> Send
          </button>
        </div>
      </div>
    </PageContainer>
  );
}