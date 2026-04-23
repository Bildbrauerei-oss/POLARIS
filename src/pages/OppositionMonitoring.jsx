import { useState } from 'react'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Monitor, RefreshCw, ExternalLink, AlertTriangle, Clock } from 'lucide-react'

const PARTEIEN = ['', 'spd.de', 'gruene.de', 'afd.de', 'fdp.de', 'bsw.de']
const PARTEI_LABELS = { 'spd.de': 'SPD', 'gruene.de': 'Grüne', 'afd.de': 'AfD', 'fdp.de': 'FDP', 'bsw.de': 'BSW' }
const PARTEI_COLORS = { 'spd.de': '#E3000F', 'gruene.de': '#46962B', 'afd.de': '#009EE0', 'fdp.de': '#FFED00', 'bsw.de': '#7B2D8B' }

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}

export default function OppositionMonitoring() {
  const [partei, setPartei] = useState('')
  const [syncing, setSyncing] = useState(false)
  const lastRun = getLastRun()

  const { articles, loading, count, refetch } = useArticles({ kategorie: 'gegner', limit: 200 })

  const filtered = partei ? articles.filter(a => a.quelle?.includes(partei)) : articles
  const attacks = filtered.filter(a => a.handlungsbedarf || a.sentiment === 'negativ')

  async function handleSync() {
    setSyncing(true)
    await runFeedSync(true)
    setSyncing(false)
    refetch()
  }

  const stats = PARTEIEN.filter(Boolean).map(p => ({
    partei: p,
    label: PARTEI_LABELS[p] || p,
    color: PARTEI_COLORS[p] || '#94A3B8',
    count: articles.filter(a => a.quelle?.includes(p)).length,
  }))

  return (
    <div style={{ maxWidth: 1200 }}>
      <PageHeader
        title="Opposition Monitoring"
        description="24/7-Beobachtung von SPD, Grüne, AfD, FDP und BSW."
        icon={Monitor}
        color="#A855F7"
      >
        <button onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem', background: syncing ? '#253550' : '#A855F7', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: syncing ? 'wait' : 'pointer' }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          {syncing ? 'Läuft…' : 'Aktualisieren'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </PageHeader>

      {/* Partei-Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {stats.map(s => (
          <button key={s.partei} onClick={() => setPartei(partei === s.partei ? '' : s.partei)} style={{
            background: partei === s.partei ? `${s.color}15` : '#1E293B',
            border: `1px solid ${partei === s.partei ? s.color : '#334155'}`,
            borderRadius: 8, padding: '0.875rem', textAlign: 'center', cursor: 'pointer',
            borderTop: `3px solid ${s.color}`, transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>{s.count}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: s.color, marginTop: '0.25rem' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Angriffs-Banner */}
      {attacks.length > 0 && (
        <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={16} color="#A855F7" />
          <span style={{ fontSize: '0.875rem', color: '#D8B4FE', fontWeight: 600 }}>
            {attacks.length} potenzielle Angriffe auf CDU erkannt
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: '#64748B' }}>
            Letzter Sync: {lastRun ? lastRun.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
        </div>
      )}

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '4rem', textAlign: 'center' }}>
          <Monitor size={40} color="#253550" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748B' }}>Keine Oppositionsartikel vorhanden. Starte den Feed-Sync.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(a => {
            const isAttack = a.handlungsbedarf || a.sentiment === 'negativ'
            const quellColor = Object.entries(PARTEI_COLORS).find(([k]) => a.quelle?.includes(k))?.[1] || '#64748B'
            return (
              <div key={a.id} style={{
                background: isAttack ? 'rgba(168,85,247,0.06)' : '#1E293B',
                border: `1px solid ${isAttack ? 'rgba(168,85,247,0.3)' : '#334155'}`,
                borderRadius: 8, padding: '1rem 1.25rem',
                borderLeft: `3px solid ${isAttack ? '#A855F7' : quellColor}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 4, background: `${quellColor}20`, color: quellColor, border: `1px solid ${quellColor}40`, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {Object.entries(PARTEI_LABELS).find(([k]) => a.quelle?.includes(k))?.[1] || a.quelle}
                      </span>
                      {isAttack && <span style={{ fontSize: '0.5625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Angriff</span>}
                      {a.relevanz && <span style={{ fontSize: '0.5625rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.relevanz}</span>}
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E8F0', lineHeight: 1.4, marginBottom: '0.375rem' }}>{a.titel}</p>
                    {a.zusammenfassung && <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>{a.zusammenfassung}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 600 }}>{a.quelle}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#334155' }}>
                        <Clock size={10} />{formatDate(a.datum)}
                      </span>
                    </div>
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#A855F7'}
                      onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
