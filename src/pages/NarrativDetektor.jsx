import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { Search, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#A855F7'

const NARRATIVE = [
  {
    key: 'sicherheit',
    label: 'Sicherheit & Ordnung',
    keywords: ['kriminalität', 'sicherheit', 'polizei', 'messer', 'anschlag', 'gewalt', 'terror', 'täter', 'einbruch'],
    frame: 'Handlungsbedarf bei innerer Sicherheit — klassisches CDU-Terrain',
  },
  {
    key: 'migration',
    label: 'Migrationsdruck',
    keywords: ['migration', 'asyl', 'flüchtling', 'einwanderung', 'abschiebung', 'grenze', 'illegale', 'zuwanderung'],
    frame: 'Dominierendes Narrativ der Rechten — CDU unter Zugzwang',
  },
  {
    key: 'wirtschaft',
    label: 'Wirtschaftsversagen',
    keywords: ['wirtschaft', 'rezession', 'arbeitslosigkeit', 'inflation', 'pleite', 'krise', 'schulden', 'haushalt'],
    frame: 'Regierungsversagen-Narrativ — nutzt CDU als Oppositionspartei',
  },
  {
    key: 'klima',
    label: 'Klimapolitik-Streit',
    keywords: ['klima', 'wärmepumpe', 'heizung', 'co2', 'energiewende', 'verbrenner', 'solar', 'windkraft'],
    frame: 'Belastungs-Narrativ — gefährlich bei hohen Energiepreisen',
  },
  {
    key: 'cdu_kompetenz',
    label: 'CDU-Kompetenz',
    keywords: ['merz', 'cdu', 'union', 'konservativ', 'christdemokrat', 'schwarz', 'friedrich'],
    frame: 'Direktes CDU-Narrativ — Vertrauen vs. Ablehnung',
  },
  {
    key: 'demokratie',
    label: 'Demokratie-Krise',
    keywords: ['demokratie', 'afd', 'rechtsextrem', 'populismus', 'verfassung', 'extremismus', 'polarisierung'],
    frame: 'Abgrenzungs-Narrativ — Position CDU gegenüber AfD',
  },
  {
    key: 'sozial',
    label: 'Soziale Gerechtigkeit',
    keywords: ['bürgergeld', 'rente', 'armut', 'ungleichheit', 'sozial', 'pfleg', 'minijob', 'grundsicherung'],
    frame: 'Linkes Kernnarra tiv — CDU muss Gegenerzählung aufbauen',
  },
  {
    key: 'ukraine',
    label: 'Ukraine & Außenpolitik',
    keywords: ['ukraine', 'russland', 'nato', 'krieg', 'waffen', 'diplomatie', 'putin', 'scholz außen'],
    frame: 'Außenpolitische Profilierung — Sicherheitspolitik als Chance',
  },
]

function matchNarrative(artikel, narr) {
  const text = `${artikel.titel || ''} ${artikel.zusammenfassung || ''}`.toLowerCase()
  return narr.keywords.some(k => text.includes(k))
}

function NarrCard({ narr, articles, index }) {
  const [expanded, setExpanded] = useState(false)
  const matched = articles.filter(a => matchNarrative(a, narr))
  if (matched.length === 0) return null

  const pos = matched.filter(a => a.cdu_wirkung === 'positiv').length
  const neg = matched.filter(a => a.cdu_wirkung === 'negativ').length
  const urgent = matched.filter(a => a.handlungsbedarf).length
  const net = pos - neg
  const TrendIcon = net > 2 ? TrendingUp : net < -2 ? TrendingDown : Minus
  const trendColor = net > 2 ? '#22c55e' : net < -2 ? '#ef4444' : '#ffa600'
  const intensity = Math.min(100, Math.round((matched.length / Math.max(articles.length, 1)) * 100 * 3))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: '#162230', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Intensität-Bar */}
        <div style={{ width: 4, height: 40, background: 'rgba(255,255,255,0.06)', borderRadius: 2, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${intensity}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 0, width: '100%', background: `${trendColor}`, borderRadius: 2 }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{narr.label}</span>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: 'rgba(168,85,247,0.12)', color: COLOR, border: '1px solid rgba(168,85,247,0.2)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
              {matched.length} Treffer
            </span>
            {urgent > 0 && (
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.1rem 0.4rem', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <AlertTriangle size={8} /> {urgent} dringend
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.4 }}>{narr.frame}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <TrendIcon size={14} color={trendColor} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.625rem', color: '#22c55e' }}>+{pos}</div>
            <div style={{ fontSize: '0.625rem', color: '#ef4444' }}>−{neg}</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(168,85,247,0.1)', padding: '0.75rem 1.25rem 1rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Aktuelle Artikel
          </p>
          {matched.slice(0, 4).map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                background: a.cdu_wirkung === 'positiv' ? '#22c55e' : a.cdu_wirkung === 'negativ' ? '#ef4444' : '#ffa600',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', color: '#e2e8f0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                <span style={{ fontSize: '0.5625rem', color: '#52b7c1' }}>{a.quelle}</span>
              </div>
            </div>
          ))}
          {matched.length > 4 && (
            <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>+ {matched.length - 4} weitere Artikel</p>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function NarrativDetektor() {
  const { articles, loading } = useArticles({ limit: 500 })
  const [claudeResult, setClaudeResult] = useState('')
  const [claudeLoading, setClaudeLoading] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const sortedNarrative = useMemo(() => {
    return NARRATIVE
      .map(n => ({ ...n, count: articles.filter(a => matchNarrative(a, n)).length }))
      .filter(n => n.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [articles])

  const totalMatched = sortedNarrative.reduce((s, n) => s + n.count, 0)

  async function analyzeWithClaude() {
    if (!apiKey || articles.length === 0) return
    setClaudeLoading(true)
    setClaudeResult('')

    const topHeadlines = articles.slice(0, 30).map(a => `• ${a.titel} (${a.quelle}, CDU: ${a.cdu_wirkung})`).join('\n')

    const prompt = `Du bist POLARIS-Narrative-Analyst. Analysiere folgende Presseschlagzeilen aus CDU-Kampagnenperspektive:

${topHeadlines}

Identifiziere:
1. Die 3 dominantesten politischen Narrative dieser Woche
2. Welches davon ist gefährlichstes für die CDU?
3. Welches bietet die beste Angriffsvorlage?
4. Empfohlene CDU-Gegennarrative in je einem Satz

Antworte strukturiert, maximal 250 Wörter. Fokus: OB-Wahl VS / kommunale Ebene.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      setClaudeResult(data.content[0].text)
    } catch {
      setClaudeResult('Fehler beim Abrufen der Analyse.')
    }
    setClaudeLoading(false)
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Narrativ-Detektor"
        description="Dominante politische Narrative aus der Medienberichterstattung — erkannt und bewertet."
        icon={Search}
        color={COLOR}
      >
        <button
          onClick={analyzeWithClaude}
          disabled={claudeLoading || articles.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: `${COLOR}18`, border: `1px solid ${COLOR}35`, borderRadius: 10,
            padding: '0.625rem 1.125rem', cursor: 'pointer', color: COLOR,
            fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.15s',
            opacity: claudeLoading ? 0.6 : 1,
          }}
        >
          {claudeLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
          KI-Analyse
        </button>
      </PageHeader>

      {/* KI-Analyse Result */}
      {claudeResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: `${COLOR}0C`, border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <Zap size={13} color={COLOR} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: COLOR, textTransform: 'uppercase' }}>Claude Narrativ-Analyse</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{claudeResult}</p>
        </motion.div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Narrative werden analysiert…</div>
      ) : articles.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Keine Artikel. Bitte zuerst Medien-Monitor synchronisieren.</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Aktive Narrative', value: sortedNarrative.length, color: COLOR },
              { label: 'Artikel zugeordnet', value: totalMatched, color: '#52b7c1' },
              { label: 'Dringend', value: articles.filter(a => a.handlungsbedarf).length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#162230', border: `1px solid rgba(168,85,247,0.1)`, borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{s.label}</div>
                <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.04em' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Narrative Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Narrative nach Intensität — klicken zum Aufklappen
            </p>
            {sortedNarrative.map((narr, i) => (
              <NarrCard key={narr.key} narr={narr} articles={articles} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
