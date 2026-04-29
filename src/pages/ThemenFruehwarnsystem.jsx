import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../hooks/useArticles'
import { Bell, TrendingUp, AlertTriangle, Minus, Clock, MapPin, Plus, X, Bookmark } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { setHandoff } from '../lib/handoff'
import { useKampagne } from '../lib/kampagneContext'

const LOC_FILTER_KEY = 'polaris_fruehwarn_orte'
function loadOrte() { try { return JSON.parse(localStorage.getItem(LOC_FILTER_KEY)) || [] } catch { return [] } }
function saveOrte(o) { localStorage.setItem(LOC_FILTER_KEY, JSON.stringify(o)) }

const COLOR = '#A855F7'

const THEMEN_CLUSTER = [
  { key: 'sicherheit', label: 'Sicherheit', keywords: ['kriminalität', 'sicherheit', 'polizei', 'messer', 'gewalt', 'terror', 'einbruch', 'täter'] },
  { key: 'migration', label: 'Migration', keywords: ['migration', 'asyl', 'flüchtling', 'einwanderung', 'abschiebung', 'zuwanderung', 'grenze'] },
  { key: 'wirtschaft', label: 'Wirtschaft', keywords: ['wirtschaft', 'rezession', 'inflation', 'arbeitslosigkeit', 'schulden', 'haushalt', 'konjunktur'] },
  { key: 'energie', label: 'Energie & Klima', keywords: ['energie', 'klima', 'co2', 'wärmepumpe', 'strom', 'solar', 'wind', 'heizung'] },
  { key: 'soziales', label: 'Soziales', keywords: ['bürgergeld', 'rente', 'armut', 'sozial', 'pfleg', 'gesundheit', 'grundsicherung'] },
  { key: 'bildung', label: 'Bildung', keywords: ['bildung', 'schule', 'lehrer', 'studium', 'universität', 'pisa', 'abitur'] },
  { key: 'cdu', label: 'CDU / Merz', keywords: ['cdu', 'merz', 'union', 'christdemokrat', 'konservativ', 'schwarz'] },
  { key: 'afd', label: 'AfD / Rechts', keywords: ['afd', 'rechtsextrem', 'höcke', 'weidel', 'populismus', 'rechts'] },
  { key: 'ukraine', label: 'Außenpolitik', keywords: ['ukraine', 'russland', 'nato', 'krieg', 'diplomatie', 'außenpolitik', 'putin'] },
  { key: 'digital', label: 'Digital & KI', keywords: ['digital', 'ki ', 'künstliche intelligenz', 'internet', 'daten', 'technik', 'start-up'] },
  { key: 'wohnen', label: 'Wohnen / Mieten', keywords: ['miete', 'wohnen', 'wohnungsnot', 'immobilien', 'baukosten', 'vermieter', 'mietpreise'] },
  { key: 'kommunal', label: 'Kommunalpolitik', keywords: ['gemeinderat', 'bürgermeister', 'oberbürgermeister', 'stadtrat', 'kommunal', 'rathaus', 'villingen', 'schwenningen'] },
]

function score(artikel, cluster) {
  const text = `${artikel.titel || ''} ${artikel.zusammenfassung || ''}`.toLowerCase()
  return cluster.keywords.some(k => text.includes(k))
}

const NOW = new Date()
const DAY = 1000 * 60 * 60 * 24

function ageGroup(datum) {
  if (!datum) return 'alt'
  const d = new Date(datum)
  const diff = (NOW - d) / DAY
  if (diff < 1) return 'heute'
  if (diff < 3) return 'neu'
  if (diff < 7) return 'aufsteigend'
  return 'etabliert'
}

const AGE_CONFIG = {
  heute: { label: 'Heute', color: '#ef4444', priority: 0 },
  neu: { label: 'Neu (< 3 Tage)', color: '#ffa600', priority: 1 },
  aufsteigend: { label: 'Diese Woche', color: '#22c55e', priority: 2 },
  etabliert: { label: 'Etabliert', color: '#3B82F6', priority: 3 },
}

// Cluster-Key → Themenfeld-ID im NarrativBoard
const CLUSTER_TO_THEMENFELD = {
  sicherheit: 'sicherheit',
  migration: 'migration',
  wirtschaft: 'wirtschaft',
  energie: 'umwelt',
  soziales: 'soziales',
  bildung: 'bildung',
}

export default function ThemenFruehwarnsystem() {
  const navigate = useNavigate()
  const { aktiveKampagne } = useKampagne()
  const { articles, loading } = useArticles({ limit: 500 })
  const [filter, setFilter] = useState('alle')
  const [orte, setOrte] = useState(loadOrte)
  const [ortInput, setOrtInput] = useState('')
  const [selectedOrt, setSelectedOrt] = useState(null)

  function entwickleNarrativ(thema) {
    // Top-Schlagzeile als Kernbotschaft-Anker
    const topArticle = thema.matched.sort((a, b) => new Date(b.datum) - new Date(a.datum))[0]
    const lokalerBezug = selectedOrt || aktiveKampagne?.ort || ''
    setHandoff('narrativ-board', {
      themenfeld: CLUSTER_TO_THEMENFELD[thema.key] || '',
      titel: `${thema.label} — ${thema.status === 'heute' ? 'aktuelles Top-Thema' : 'aufkommendes Thema'}`,
      kernbotschaft: topArticle?.titel ? `Reaktion auf: "${topArticle.titel}"` : `${thema.matched.length} aktuelle Artikel zu ${thema.label}. Eigene Position entwickeln, bevor Gegner Deutungshoheit gewinnt.`,
      lokaler_bezug: lokalerBezug,
      openModal: 'thema',
    })
    navigate('/narrativ-board')
  }

  function addOrt() {
    const name = ortInput.trim()
    if (!name || orte.includes(name)) return
    const next = [...orte, name]
    setOrte(next); saveOrte(next); setOrtInput('')
  }

  function removeOrt(name) {
    const next = orte.filter(o => o !== name)
    setOrte(next); saveOrte(next)
    if (selectedOrt === name) setSelectedOrt(null)
  }

  // Filtered articles (by location if selected)
  const filteredArticles = useMemo(() => {
    if (!selectedOrt) return articles
    const kw = selectedOrt.toLowerCase()
    return articles.filter(a => {
      const text = `${a.titel || ''} ${a.zusammenfassung || ''}`.toLowerCase()
      return text.includes(kw)
    })
  }, [articles, selectedOrt])

  const themenData = useMemo(() => {
    const srcArticles = filteredArticles
    return THEMEN_CLUSTER.map(cluster => {
      const matched = srcArticles.filter(a => score(a, cluster))
      if (matched.length === 0) return null

      const heute = matched.filter(a => ageGroup(a.datum) === 'heute')
      const neu = matched.filter(a => ageGroup(a.datum) === 'neu')
      const urgent = matched.filter(a => a.handlungsbedarf && a.cdu_wirkung === 'negativ')

      let status = 'etabliert'
      if (heute.length > 0) status = 'heute'
      else if (neu.length >= 2) status = 'neu'
      else if (neu.length >= 1) status = 'aufsteigend'

      const velocity = heute.length * 3 + neu.length * 2 + matched.filter(a => ageGroup(a.datum) === 'aufsteigend').length
      const cduPos = matched.filter(a => a.cdu_wirkung === 'positiv').length
      const cduNeg = matched.filter(a => a.cdu_wirkung === 'negativ').length

      return { ...cluster, matched, heute, neu, urgent, status, velocity, cduPos, cduNeg }
    })
      .filter(Boolean)
      .sort((a, b) => {
        const pa = AGE_CONFIG[a.status].priority
        const pb = AGE_CONFIG[b.status].priority
        if (pa !== pb) return pa - pb
        return b.velocity - a.velocity
      })
  }, [filteredArticles])

  const filtered = filter === 'alle' ? themenData : themenData.filter(t => t.status === filter)
  const urgentCount = themenData.filter(t => t.urgent.length > 0).length
  const newCount = themenData.filter(t => t.status === 'heute' || t.status === 'neu').length

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Themen-Frühwarnsystem"
        description="Frühzeitige Erkennung aufkommender politischer Themen — bevor sie zum Problem werden."
        icon={Bell}
        color={COLOR}
      />

      {/* Stat Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Aktive Themen', value: themenData.length, color: COLOR },
          { label: 'Neu / Heute', value: newCount, color: '#ffa600', icon: TrendingUp },
          { label: 'Handlungsbedarf', value: urgentCount, color: '#ef4444', icon: AlertTriangle },
          { label: 'Artikel gesamt', value: articles.length, color: '#52b7c1' },
        ].map(s => (
          <div key={s.label} style={{ background: '#162230', border: `1px solid rgba(168,85,247,0.1)`, borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
              {s.icon && <s.icon size={10} color={s.color} />}
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.04em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Standort-Filter */}
      <div style={{ background: '#162230', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
          <MapPin size={12} color="#A855F7" />
          <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>Standort-Filter</span>
          {selectedOrt && <span style={{ fontSize: '0.5625rem', color: '#ffa600', fontWeight: 700 }}>Gefiltert: {selectedOrt} ({filteredArticles.length} Artikel)</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={ortInput}
            onChange={e => setOrtInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addOrt()}
            placeholder="Ort, Bundesland oder Land + Enter"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 7, padding: '0.375rem 0.625rem', color: '#fff', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit', minWidth: 200 }}
            onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(168,85,247,0.2)'}
          />
          {orte.map(ort => (
            <div key={ort} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: selectedOrt === ort ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedOrt === ort ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.5)'}`, borderRadius: 20, padding: '0.25rem 0.625rem 0.25rem 0.5rem' }}>
              <button onClick={() => setSelectedOrt(selectedOrt === ort ? null : ort)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedOrt === ort ? '#A855F7' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: selectedOrt === ort ? 700 : 400, padding: 0, fontFamily: 'inherit' }}>
                {ort}
              </button>
              <button onClick={() => removeOrt(ort)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0, display: 'flex', lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                <X size={10} />
              </button>
            </div>
          ))}
          {orte.length === 0 && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Ort eingeben und Enter drücken</span>}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[['alle', 'Alle'], ['heute', 'Heute'], ['neu', 'Neu'], ['aufsteigend', 'Diese Woche'], ['etabliert', 'Etabliert']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: 8, border: `1px solid ${filter === key ? COLOR : 'rgba(255,255,255,0.5)'}`,
              background: filter === key ? `${COLOR}15` : 'transparent', color: filter === key ? COLOR : 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem', fontWeight: filter === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Themen werden ausgewertet…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Keine Themen in dieser Kategorie.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map((t, i) => {
            const cfg = AGE_CONFIG[t.status]
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  background: '#162230',
                  border: `1px solid ${t.urgent.length > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(168,85,247,0.1)'}`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 12, padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}
              >
                {/* Status Badge */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                    borderRadius: 6, padding: '0.2rem 0.5rem', whiteSpace: 'nowrap',
                  }}>
                    {cfg.label}
                  </div>
                </div>

                {/* Thema */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{t.label}</span>
                    {t.urgent.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.5625rem', fontWeight: 700, color: '#ef4444' }}>
                        <AlertTriangle size={9} /> Handlungsbedarf
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem' }}>
                    <span style={{ fontSize: '0.625rem', color: '#22c55e', fontWeight: 600 }}>↑ {t.cduPos} pos.</span>
                    <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 600 }}>↓ {t.cduNeg} neg.</span>
                    {t.heute.length > 0 && (
                      <span style={{ fontSize: '0.625rem', color: '#ffa600', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={8} /> {t.heute.length} heute
                      </span>
                    )}
                  </div>
                </div>

                {/* Treffer */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.03em' }}>{t.matched.length}</div>
                  <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)' }}>Artikel</div>
                </div>

                {/* Velocity dots */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[...Array(3)].map((_, j) => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: j < Math.min(3, Math.ceil(t.velocity / 2)) ? cfg.color : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>

                {/* Narrativ entwickeln */}
                <button
                  onClick={() => entwickleNarrativ(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.625rem', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 7, color: '#A855F7', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}
                  title="Narrativ im Narrativ-Board anlegen"
                >
                  <Bookmark size={10} /> Narrativ →
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
