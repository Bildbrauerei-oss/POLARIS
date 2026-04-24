import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { Target, TrendingUp, TrendingDown, Minus, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

// Schlüsselthemen extrahieren aus Artikeln (einfaches Keyword-Matching)
const THEMEN = [
  { key: 'migration', label: 'Migration & Asyl', keywords: ['migration', 'asyl', 'flüchtling', 'einwanderung', 'abschiebung', 'grenze'] },
  { key: 'wirtschaft', label: 'Wirtschaft & Konjunktur', keywords: ['wirtschaft', 'konjunktur', 'inflation', 'wachstum', 'arbeitslosigkeit', 'haushalt', 'schulden'] },
  { key: 'energie', label: 'Energie & Klima', keywords: ['energie', 'klima', 'co2', 'wärmepumpe', 'heizung', 'solar', 'wind', 'strom'] },
  { key: 'sicherheit', label: 'Innere Sicherheit', keywords: ['sicherheit', 'polizei', 'kriminalität', 'messer', 'anschlag', 'terror', 'gewalt'] },
  { key: 'rente', label: 'Rente & Soziales', keywords: ['rente', 'sozial', 'bürgergeld', 'grundsicherung', 'pfleg', 'gesundheit'] },
  { key: 'bildung', label: 'Bildung', keywords: ['bildung', 'schule', 'lehrer', 'studium', 'universität', 'abitur', 'pisa'] },
  { key: 'cdu', label: 'CDU intern', keywords: ['cdu', 'merz', 'unions', 'christdemokrat', 'konservativ'] },
  { key: 'ukraine', label: 'Ukraine & Außenpolitik', keywords: ['ukraine', 'russland', 'nato', 'außenpolitik', 'krieg', 'diplomatie'] },
  { key: 'wahl', label: 'Wahlen', keywords: ['wahl', 'abstimmung', 'koalition', 'bundesrat', 'bundestag', 'wahlkampf'] },
  { key: 'digital', label: 'Digitalisierung & KI', keywords: ['digital', 'ki ', 'künstliche intelligenz', 'internet', 'technik', 'daten'] },
]

function matchThema(artikel, thema) {
  const text = `${artikel.titel || ''} ${artikel.zusammenfassung || ''}`.toLowerCase()
  return thema.keywords.some(k => text.includes(k))
}

function ThemaCard({ thema, articles, index }) {
  const [expanded, setExpanded] = useState(false)
  const matched = articles.filter(a => matchThema(a, thema))
  if (matched.length === 0) return null

  const pos = matched.filter(a => a.cdu_wirkung === 'positiv').length
  const neg = matched.filter(a => a.cdu_wirkung === 'negativ').length
  const trend = pos - neg
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#bf111b' : '#ffa600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 12, overflow: 'hidden' }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{thema.label}</span>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: 'rgba(82,183,193,0.1)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.2)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
              {matched.length} Artikel
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#22c55e', fontWeight: 600 }}>↑ {pos} positiv</span>
            <span style={{ fontSize: '0.625rem', color: '#bf111b', fontWeight: 600 }}>↓ {neg} negativ</span>
            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{matched.length - pos - neg} neutral</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendIcon size={14} color={trendColor} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: trendColor }}>
              {trend > 0 ? '+' : ''}{trend}
            </span>
          </div>
          {expanded ? <ChevronUp size={13} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {matched.slice(0, 8).map(a => (
            <div key={a.id} style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.cdu_wirkung === 'positiv' ? '#22c55e' : a.cdu_wirkung === 'negativ' ? '#bf111b' : '#ffa600', flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', color: '#fff', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                {a.zusammenfassung && <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, marginTop: '0.125rem' }}>{a.zusammenfassung}</p>}
              </div>
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.12)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#ffa600'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}><ExternalLink size={11} /></a>}
            </div>
          ))}
          {matched.length > 8 && (
            <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              + {matched.length - 8} weitere Artikel
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function ThemenCockpit() {
  const { articles, loading } = useArticles({ limit: 500 })

  const themenMitCount = useMemo(() =>
    THEMEN.map(t => ({ ...t, count: articles.filter(a => matchThema(a, t)).length }))
      .sort((a, b) => b.count - a.count),
    [articles]
  )

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Themen-Cockpit"
        description="Politische Themen und ihre CDU-Wirkung im Überblick."
        icon={Target}
        color="#ffa600"
      />

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Lade Themen…</div>
      ) : articles.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Keine Artikel vorhanden. Bitte Sync starten.</div>
      ) : (
        <>
          {/* Übersicht */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.625rem', marginBottom: '1.5rem' }}>
            {themenMitCount.slice(0, 5).map((t, i) => (
              <motion.div key={t.key}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                style={{ background: '#162230', border: '1px solid rgba(255,166,0,0.15)', borderTop: '3px solid #ffa600', borderRadius: 12, padding: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.04em' }}>{t.count}</div>
                <div style={{ fontSize: '0.625rem', color: '#ffa600', fontWeight: 700, marginTop: '0.25rem', lineHeight: 1.3 }}>{t.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Themen-Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {themenMitCount.map((t, i) => (
              <ThemaCard key={t.key} thema={t} articles={articles} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
