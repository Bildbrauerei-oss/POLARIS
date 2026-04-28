import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Scale, Send, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import PageHeader from '../components/ui/PageHeader'

const FRAGEN = [
  'Welche Fristen gelten für die Kandidaturanmeldung?',
  'Wie funktioniert die Stichwahl bei OB-Wahlen in BW?',
  'Was darf ich als Kandidat in der heißen Phase?',
  'Welche Plakatierungsregeln gibt es?',
  'Wann beginnt die offizielle Wahlkampfzeit?',
  'Welche Ausgaben müssen im Rechenschaftsbericht erscheinen?',
]

const SYSTEM = `Du bist RECHT, der Wahlrecht-Assistent von POLARIS. Du bist Experte für deutsches Kommunalwahlrecht, insbesondere Baden-Württemberg.

Kontext: Jürgen Roth kandidiert bei der OB-Wahl Villingen-Schwenningen, September 2026, parteilos mit CDU-Unterstützung.

Deine Aufgaben:
- Beantworte Fragen zu Wahlrecht, Kandidaturvoraussetzungen, Fristen, Wahlkampfrecht, Finanzierung
- Verweise auf relevante Gesetze (KomWG BW, GemO BW, BWahlG wo relevant)
- Sei präzise und praktisch nutzbar
- Bei komplexen Fragen: Punkte-Liste, klar strukturiert
- Hinweis bei Unsicherheit: Rechtsberatung empfehlen
- Sprache: Deutsch, professionell aber verständlich
- Keine allgemeinen Einleitungen — sofort zum Punkt`

export default function WahlrechtAssistent() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Guten Tag. Ich bin dein Wahlrecht-Assistent für die OB-Wahl Villingen-Schwenningen. Welche rechtliche Frage hast du?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const q = (text || input).trim()
    if (!q) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    const history = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }))

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 800,
          system: SYSTEM,
          messages: [...history, { role: 'user', content: q }],
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.content?.[0]?.text || 'Kein Ergebnis.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Verbindungsfehler. Bitte erneut versuchen.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Wahlrecht-Assistent"
        description="KI-gestützte Auskunft zu Wahlrecht, Fristen und Kandidaturregeln in Baden-Württemberg."
        icon={Scale}
        color="#F97316"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Schnellfragen */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#F97316', textTransform: 'uppercase' }}>Schnellfragen</span>
          </div>
          {FRAGEN.map((f, i) => (
            <button key={i} onClick={() => send(f)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.625rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4, transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
            >
              {f}
            </button>
          ))}
          <div style={{ padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Kein Ersatz für Rechtsberatung. Bei rechtssicheren Entscheidungen bitte Fachanwalt konsultieren.
            </p>
          </div>
        </div>

        {/* Chat */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 580 }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={13} color="#F97316" />
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#F97316', textTransform: 'uppercase' }}>Wahlrecht-Chat · KomWG BW</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', animation: 'pulse-dot 2s ease infinite' }} />
              <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Claude Sonnet 4.5</span>
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '0.75rem 1rem',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #F97316, #ea6800)'
                    : 'rgba(255,255,255,0.06)',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '0.875rem', color: '#fff', lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  {m.role === 'assistant' ? (
                    <ReactMarkdown components={{
                      p: ({children}) => <p style={{ margin: '0 0 0.5em', lineHeight: 1.65 }}>{children}</p>,
                      strong: ({children}) => <strong style={{ color: '#fff', fontWeight: 700 }}>{children}</strong>,
                      h2: ({children}) => <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F97316', margin: '0.75em 0 0.375em' }}>{children}</h2>,
                      h3: ({children}) => <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0.625em 0 0.25em' }}>{children}</h3>,
                      ul: ({children}) => <ul style={{ paddingLeft: '1.25em', margin: '0.375em 0' }}>{children}</ul>,
                      ol: ({children}) => <ol style={{ paddingLeft: '1.25em', margin: '0.375em 0' }}>{children}</ol>,
                      li: ({children}) => <li style={{ marginBottom: '0.25em', lineHeight: 1.55 }}>{children}</li>,
                      code: ({children}) => <code style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '0.1em 0.35em', fontSize: '0.8125em', fontFamily: 'monospace' }}>{children}</code>,
                    }}>
                      {m.text}
                    </ReactMarkdown>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 2px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
              placeholder="Wahlrechtsfrage stellen…"
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 36, height: 36, background: input.trim() && !loading ? '#F97316' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', flexShrink: 0 }}>
              <Send size={13} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.7)'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
