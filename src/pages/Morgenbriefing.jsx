import { useState, useEffect } from 'react'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync } from '../lib/feedCron'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Sun, Zap, RefreshCw, ExternalLink, Clock } from 'lucide-react'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const CACHE_KEY = 'polaris_briefing'

function getBriefingCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!c) return null
    const today = new Date().toDateString()
    if (c.date !== today) return null
    return c
  } catch { return null }
}

function setBriefingCache(text) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ text, date: new Date().toDateString(), ts: Date.now() }))
}

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}

function BriefingText({ text }) {
  const lines = text.split('\n').filter(Boolean)
  return (
    <div style={{ lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', marginTop: i > 0 ? '1.5rem' : 0, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{line.replace(/^#+\s/, '')}</h3>
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <p key={i} style={{ fontSize: '0.9375rem', color: '#CBD5E1', paddingLeft: '1rem', borderLeft: '2px solid #253550', marginBottom: '0.375rem' }}>{line.replace(/^[-*]\s/, '')}</p>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.25rem' }}>{line.replace(/\*\*/g, '')}</p>
        }
        return <p key={i} style={{ fontSize: '0.9375rem', color: '#94A3B8', marginBottom: '0.5rem' }}>{line}</p>
      })}
    </div>
  )
}

export default function Morgenbriefing() {
  const [briefing, setBriefing] = useState(() => getBriefingCache())
  const [generating, setGenerating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const { articles, loading } = useArticles({ limit: 50 })
  const todayArticles = articles.filter(a => a.datum && new Date(a.datum) >= todayStart)
  const urgentArticles = articles.filter(a => a.handlungsbedarf && a.sentiment === 'negativ').slice(0, 5)

  async function handleSync() {
    setSyncing(true)
    await runFeedSync(true)
    setSyncing(false)
  }

  async function generateBriefing() {
    if (!articles.length) { setError('Keine Artikel vorhanden. Bitte zuerst Feeds synchronisieren.'); return }
    setGenerating(true)
    setError(null)

    const top = articles.slice(0, 30)
    const artikelText = top.map(a => `- ${a.titel}${a.zusammenfassung ? ' | ' + a.zusammenfassung : ''} (${a.quelle}, ${a.sentiment || 'unbekannt'})`).join('\n')

    const prompt = `Du bist ein CDU-Kampagnenberater bei Bildbrauerei Heidelberg. Heute ist ${today}.

Erstelle ein prägnantes Morgenbriefing aus diesen Nachrichten. Strukturiere es in maximal 5 Abschnitte:
1. Wichtigste Nachricht des Tages
2. CDU-relevante Entwicklungen
3. Opposition & Angriffe (was planen SPD, Grüne, AfD?)
4. Chancen für CDU heute
5. Empfehlungen für das Team

Nachrichten:
${artikelText}

Antworte auf Deutsch, prägnant, max. 500 Wörter. Nutze ## für Überschriften und - für Bullet Points.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) throw new Error(`API Fehler: ${res.status}`)
      const data = await res.json()
      const text = data.content[0].text
      setBriefingCache(text)
      setBriefing({ text, date: new Date().toDateString(), ts: Date.now() })
    } catch (e) {
      setError(`Fehler: ${e.message}`)
    }
    setGenerating(false)
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Morgenbriefing"
        description={`KI-Tagesbriefing · ${today}`}
        icon={Sun}
        color="#F97316"
      >
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
            Sync
          </button>
          <button onClick={generateBriefing} disabled={generating || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: generating ? '#253550' : '#F97316', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: generating ? 'wait' : 'pointer', letterSpacing: '0.04em' }}>
            <Zap size={13} />
            {generating ? 'Wird generiert…' : briefing ? 'Neu generieren' : 'Briefing generieren'}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </PageHeader>

      {error && (
        <div style={{ background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.3)', borderRadius: 8, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', color: '#FCA5A5', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Artikel heute', value: loading ? '…' : todayArticles.length, color: '#F97316' },
          { label: 'Dringend', value: loading ? '…' : urgentArticles.length, color: '#CC0000' },
          { label: 'Stand', value: briefing ? new Date(briefing.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '—', color: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '1rem 1.25rem', borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {generating ? (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ color: '#64748B', marginTop: '1rem', fontSize: '0.875rem' }}>POLARIS analysiert die aktuellen Nachrichten…</p>
        </div>
      ) : briefing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #253550' }}>
              <Sun size={16} color="#F97316" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316', letterSpacing: '0.08em', textTransform: 'uppercase' }}>POLARIS Morgenbriefing</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: '#475569' }}>{today}</span>
            </div>
            <BriefingText text={briefing.text} />
          </div>

          {urgentArticles.length > 0 && (
            <div style={{ background: '#1E293B', border: '1px solid rgba(204,0,0,0.3)', borderRadius: 8, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CC0000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>⚡ Dringlich – Handlungsbedarf</p>
              {urgentArticles.map(a => (
                <div key={a.id} style={{ padding: '0.625rem 0', borderBottom: '1px solid #253550', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '0.25rem' }}>{a.titel}</p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B' }}>{a.quelle} · {formatDate(a.datum)}</p>
                  </div>
                  {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', flexShrink: 0 }}><ExternalLink size={13} /></a>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#1E293B', border: '1px dashed #334155', borderRadius: 8, padding: '4rem 2rem', textAlign: 'center' }}>
          <Sun size={48} color="#253550" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.5rem' }}>Kein Briefing für heute</p>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem' }}>Synchronisiere zuerst die Feeds, dann generiere dein tägliches Briefing.</p>
          <button onClick={generateBriefing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#F97316', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
            <Zap size={14} /> Briefing jetzt generieren
          </button>
        </div>
      )}
    </div>
  )
}
