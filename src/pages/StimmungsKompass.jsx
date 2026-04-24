import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { isUrgent } from '../lib/utils'
import { Compass, TrendingUp, TrendingDown, Minus, AlertTriangle, ExternalLink, Clock } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

function Bar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{value} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 4 }}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderTop: `3px solid ${color}`, borderRadius: 14, padding: '1.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <div style={{ width: 30, height: 30, background: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.375rem' }}>{sub}</div>}
    </motion.div>
  )
}

export default function StimmungsKompass() {
  const { articles, loading } = useArticles({ limit: 500 })

  const stats = useMemo(() => {
    if (!articles.length) return null
    const pos = articles.filter(a => a.cdu_wirkung === 'positiv').length
    const neg = articles.filter(a => a.cdu_wirkung === 'negativ').length
    const neu = articles.filter(a => a.cdu_wirkung === 'neutral').length
    const total = articles.length
    const score = total > 0 ? Math.round(((pos - neg) / total) * 100) : 0
    const urgent = articles.filter(a => isUrgent(a))
    const heute = articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString())
    return { pos, neg, neu, total, score, urgent, heute }
  }, [articles])

  const topNeg = articles.filter(a => a.cdu_wirkung === 'negativ' && a.zusammenfassung).slice(0, 5)
  const topPos = articles.filter(a => a.cdu_wirkung === 'positiv' && a.zusammenfassung).slice(0, 5)

  const scoreColor = !stats ? '#52b7c1' : stats.score > 10 ? '#22c55e' : stats.score < -10 ? '#bf111b' : '#ffa600'

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Stimmungskompass" description="CDU-Wirkung der Medienberichterstattung in Echtzeit." icon={Compass} color="#52b7c1" />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Analysiere Stimmungslage…</div>
      ) : !stats || stats.total === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Noch keine analysierten Artikel. Bitte Sync starten.</div>
      ) : (
        <>
          {/* Score + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>

            {/* Score Kreis */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ background: '#162230', border: `1px solid ${scoreColor}30`, borderRadius: 20, padding: '2rem', textAlign: 'center', minWidth: 180 }}
            >
              <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>CDU Score</div>
              <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '3.5rem', color: scoreColor, letterSpacing: '-0.05em', lineHeight: 1 }}>
                {stats.score > 0 ? '+' : ''}{stats.score}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem' }}>
                {stats.score > 20 ? 'Sehr positiv' : stats.score > 5 ? 'Leicht positiv' : stats.score < -20 ? 'Kritisch' : stats.score < -5 ? 'Leicht negativ' : 'Ausgeglichen'}
              </div>
            </motion.div>

            {/* Balken + Stat Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <StatCard label="Positiv" value={stats.pos} color="#22c55e" icon={TrendingUp} sub={`${Math.round((stats.pos / stats.total) * 100)}% aller Artikel`} />
                <StatCard label="Neutral" value={stats.neu} color="#ffa600" icon={Minus} sub={`${Math.round((stats.neu / stats.total) * 100)}% aller Artikel`} />
                <StatCard label="Negativ" value={stats.neg} color="#bf111b" icon={TrendingDown} sub={`${Math.round((stats.neg / stats.total) * 100)}% aller Artikel`} />
                <StatCard label="Dringend" value={stats.urgent.length} color="#ff4040" icon={AlertTriangle} sub="Sofortreaktion nötig" />
              </div>

              {/* Balken */}
              <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
                <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1rem' }}>CDU-Wirkung Verteilung ({stats.total} Artikel)</p>
                <Bar label="CDU ↑ Positiv" value={stats.pos} total={stats.total} color="#22c55e" />
                <Bar label="CDU → Neutral" value={stats.neu} total={stats.total} color="#ffa600" />
                <Bar label="CDU ↓ Negativ" value={stats.neg} total={stats.total} color="#bf111b" />
              </div>
            </div>
          </div>

          {/* Top Artikel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Negative */}
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={13} color="#bf111b" />
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#bf111b', textTransform: 'uppercase' }}>CDU Negativ · Top 5</span>
              </div>
              <div>
                {topNeg.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem' }}>Keine negativen Artikel</div>
                ) : topNeg.map((a, i) => (
                  <div key={a.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(191,17,27,0.5)', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{a.zusammenfassung}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.5625rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
                        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{new Date(a.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#bf111b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}><ExternalLink size={11} /></a>}
                  </div>
                ))}
              </div>
            </div>

            {/* Positive */}
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={13} color="#22c55e" />
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#22c55e', textTransform: 'uppercase' }}>CDU Positiv · Top 5</span>
              </div>
              <div>
                {topPos.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem' }}>Keine positiven Artikel</div>
                ) : topPos.map((a, i) => (
                  <div key={a.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(34,197,94,0.5)', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{a.zusammenfassung}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.5625rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
                        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{new Date(a.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#22c55e'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}><ExternalLink size={11} /></a>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
