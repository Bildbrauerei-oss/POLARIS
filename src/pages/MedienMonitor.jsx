import { useState } from 'react'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Newspaper, RefreshCw, ExternalLink, AlertTriangle, Clock, Filter } from 'lucide-react'

const KATEGORIEN = [
  { value: '', label: 'Alle Quellen' },
  { value: 'nachrichten', label: 'Nachrichten' },
  { value: 'politik', label: 'Politik' },
  { value: 'cdu', label: 'CDU' },
  { value: 'gegner', label: 'Gegner' },
  { value: 'google_news', label: 'Google News' },
]
const SENTIMENTS = [
  { value: '', label: 'Alle Sentiments' },
  { value: 'positiv', label: '↑ Positiv' },
  { value: 'neutral', label: '→ Neutral' },
  { value: 'negativ', label: '↓ Negativ' },
]

function sentimentStyle(s) {
  if (s === 'positiv') return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }
  if (s === 'negativ') return { color: '#ff9999', bg: 'rgba(191,17,27,0.1)', border: 'rgba(191,17,27,0.25)' }
  return { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' }
}

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

export default function MedienMonitor() {
  const [kat, setKat] = useState('')
  const [sent, setSent] = useState('')
  const [nurHandlung, setNurHandlung] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncLog, setSyncLog] = useState(null)
  const lastRun = getLastRun()
  const { articles, loading, count, refetch } = useArticles({ kategorie: kat || undefined, sentiment: sent || undefined, handlungsbedarf: nurHandlung || undefined, limit: 200 })

  async function handleSync() {
    setSyncing(true); setSyncLog(null)
    const result = await runFeedSync(true)
    setSyncLog(result); setSyncing(false); refetch()
  }

  const urgent = articles.filter(a => a.handlungsbedarf && a.sentiment === 'negativ')

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Medien-Monitor" description="Alle analysierten Artikel aus Nachrichten, Politik und CDU-Quellen." icon={Newspaper} color="#52b7c1">
        <button onClick={handleSync} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.125rem',
          background: syncing ? 'rgba(255,255,255,0.05)' : '#bf111b',
          border: `1px solid ${syncing ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
          borderRadius: 10, color: '#fff', fontSize: '0.8125rem',
          fontWeight: 700, cursor: syncing ? 'wait' : 'pointer',
          letterSpacing: '0.04em',
          boxShadow: syncing ? 'none' : '0 4px 16px rgba(191,17,27,0.3)',
          transition: 'all 0.15s',
        }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          {syncing ? 'Sync läuft…' : 'Feeds synchronisieren'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </PageHeader>

      {/* Stats */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Artikel gesamt', value: count, color: '#52b7c1' },
          { label: 'Dringend', value: urgent.length, color: '#bf111b' },
          { label: 'Letzter Sync', value: lastRun ? lastRun.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—', color: '#22C55E' },
          { label: 'Heute', value: articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString()).length, color: '#ffa600' },
        ].map(s => (
          <motion.div key={s.label}
            whileHover={{ translateY: -2 }}
            style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.15)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>{s.label}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Sync Log */}
      {syncLog && (
        <div style={{ background: '#162230', border: `1px solid ${syncLog.success ? 'rgba(34,197,94,0.3)' : 'rgba(191,17,27,0.3)'}`, borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: syncLog.success ? '#22C55E' : '#ff9999', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {syncLog.success ? '✓ Sync abgeschlossen' : '✗ Sync mit Fehlern'}
          </p>
          {syncLog.log.map((l, i) => <p key={i} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{l}</p>)}
        </div>
      )}

      {/* Urgency Banner */}
      {urgent.length > 0 && (
        <div style={{ background: 'rgba(191,17,27,0.08)', border: '1px solid rgba(191,17,27,0.3)', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={16} color="#bf111b" />
          <span style={{ fontSize: '0.875rem', color: '#ff9999', fontWeight: 600 }}>
            {urgent.length} Artikel mit negativem CDU-Sentiment und Handlungsbedarf
          </span>
        </div>
      )}

      {/* Filter */}
      <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Filter size={13} color="rgba(255,255,255,0.3)" />
        {[
          { val: kat, set: setKat, opts: KATEGORIEN },
          { val: sent, set: setSent, opts: SENTIMENTS },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{
            background: '#0a0f1a', border: '1px solid rgba(82,183,193,0.2)', color: '#fff',
            padding: '0.375rem 0.75rem', borderRadius: 7, fontSize: '0.8125rem',
            fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}>
            {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
          <input type="checkbox" checked={nurHandlung} onChange={e => setNurHandlung(e.target.checked)} style={{ accentColor: '#52b7c1' }} />
          Nur Handlungsbedarf
        </label>
        <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)' }}>{articles.length} Ergebnisse</span>
      </div>

      {/* Artikel */}
      {loading ? <LoadingSpinner /> : articles.length === 0 ? (
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 10, padding: '4rem', textAlign: 'center' }}>
          <Newspaper size={40} color="rgba(82,183,193,0.15)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9375rem' }}>Keine Artikel vorhanden. Starte den Feed-Sync.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {articles.map((a, i) => {
            const ss = sentimentStyle(a.sentiment)
            const isUrgent = a.handlungsbedarf && a.sentiment === 'negativ'
            return (
              <motion.div key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                style={{
                  background: isUrgent ? 'rgba(191,17,27,0.06)' : '#162230',
                  border: `1px solid ${isUrgent ? 'rgba(191,17,27,0.3)' : 'rgba(82,183,193,0.1)'}`,
                  borderRadius: 10, padding: '1rem 1.25rem',
                  borderLeft: `3px solid ${isUrgent ? '#bf111b' : a.sentiment === 'positiv' ? '#22C55E' : 'rgba(82,183,193,0.2)'}`,
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      {a.sentiment && (
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.15rem 0.5rem', borderRadius: 4, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase' }}>
                          {a.sentiment}
                        </span>
                      )}
                      {a.relevanz && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.relevanz}</span>}
                      {a.handlungsbedarf && (
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(255,166,0,0.1)', color: '#ffa600', border: '1px solid rgba(255,166,0,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          ⚡ Handlungsbedarf
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: '0.375rem' }}>{a.titel}</p>
                    {a.zusammenfassung && (
                      <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        {a.zusammenfassung}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.2)' }}>
                        <Clock size={10} />{formatDate(a.datum)}
                      </span>
                      {a.kategorie && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{a.kategorie}</span>}
                    </div>
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, padding: '0.25rem', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
