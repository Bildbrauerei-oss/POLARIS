import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { Target, TrendingUp, TrendingDown, Minus, ExternalLink, ChevronDown, ChevronUp, Plus, X, MapPin, Settings, Radio, RefreshCw, Bookmark } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useKampagne } from '../lib/kampagneContext'
import { getThemenNarrative, getDachNarrativ } from '../lib/narrativeStore'

// Mapping: ThemenCockpit topic-key → narrative themenfeld id (NarrativBoard)
const THEMA_TO_THEMENFELD = {
  wirtschaft: 'wirtschaft',
  sicherheit: 'sicherheit',
  energie: 'umwelt',
}

const COLOR = '#ffa600'

// Shared regions with StimmungsKompass
const REGIONEN_KEY = 'polaris_stimmung_regionen'
const DEFAULT_REGIONEN = [
  { id: 'gesamt', name: 'Gesamt', keywords: [], farbe: '#52b7c1', icon: '🇩🇪' },
  { id: 'vs', name: 'Villingen-Schwenningen', keywords: ['villingen', 'schwenningen', 'villingen-schwenningen', 'vs 2026', 'jürgen roth'], farbe: '#ffa600', icon: '🏙️' },
  { id: 'muenchen', name: 'München', keywords: ['münchen', 'munich', 'baumgärtner', 'münchen 2026'], farbe: '#22c55e', icon: '🏛️' },
  { id: 'nrw', name: 'NRW', keywords: ['nrw', 'nordrhein-westfalen', 'wüst', 'düsseldorf'], farbe: '#a78bfa', icon: '🌆' },
]
function loadRegionen() { try { return JSON.parse(localStorage.getItem(REGIONEN_KEY)) || DEFAULT_REGIONEN } catch { return DEFAULT_REGIONEN } }
function filterByRegion(articles, region) {
  if (!region || region.id === 'gesamt' || !region.keywords?.length) return articles
  return articles.filter(a => {
    const text = `${a.titel || ''} ${a.zusammenfassung || ''} ${a.quelle || ''}`.toLowerCase()
    return region.keywords.some(k => text.includes(k.toLowerCase()))
  })
}

// Live RSS scan for regions
async function parseFeed(url, sourceName) {
  try {
    const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const text = await res.text()
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const items = Array.from(xml.querySelectorAll('item'))
    return items.map(item => {
      const titel = item.querySelector('title')?.textContent?.replace(/ - [^-]+$/, '').trim() || ''
      const rawUrl = item.querySelector('link')?.textContent?.trim() || item.querySelector('guid')?.textContent?.trim() || ''
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || ''
      const desc = item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').trim() || ''
      return { id: `live-${rawUrl}`, titel, url: rawUrl, datum: pubDate ? new Date(pubDate).toISOString() : null, zusammenfassung: desc.slice(0, 200), quelle: sourceName, cdu_wirkung: null, live: true }
    }).filter(a => a.titel)
  } catch { return [] }
}

async function fetchLiveRegionArticles(region) {
  const allItems = []
  const seen = new Set()
  function merge(items) {
    items.forEach(a => { if (a.titel && !seen.has(a.titel)) { seen.add(a.titel); allItems.push(a) } })
  }

  // 1. Custom RSS feeds for this region (highest priority)
  const feeds = region.feeds || []
  if (feeds.length > 0) {
    const results = await Promise.all(feeds.map(f => parseFeed(f.url, f.name)))
    results.forEach(merge)
  }

  // 2. Google News fallback (always, to complement local feeds)
  const query = region.name
  const googleUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`
  merge(await parseFeed(googleUrl, 'Google News'))

  // 3. If still few results, try first keyword as additional query
  if (allItems.length < 5 && region.keywords?.length > 0) {
    const kq = region.keywords[0]
    const kUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(kq)}&hl=de&gl=DE&ceid=DE:de`
    merge(await parseFeed(kUrl, 'Google News'))
  }

  return allItems
}

// CDU intern entfernt
const THEMEN = [
  { key: 'migration', label: 'Migration & Asyl', color: '#ef4444', keywords: ['migration', 'asyl', 'flüchtling', 'einwanderung', 'abschiebung', 'grenze'] },
  { key: 'wirtschaft', label: 'Wirtschaft & Konjunktur', color: '#ffa600', keywords: ['wirtschaft', 'konjunktur', 'inflation', 'wachstum', 'arbeitslosigkeit', 'haushalt', 'schulden'] },
  { key: 'energie', label: 'Energie & Klima', color: '#22c55e', keywords: ['energie', 'klima', 'co2', 'wärmepumpe', 'heizung', 'solar', 'wind', 'strom'] },
  { key: 'sicherheit', label: 'Innere Sicherheit', color: '#3B82F6', keywords: ['sicherheit', 'polizei', 'kriminalität', 'messer', 'anschlag', 'terror', 'gewalt'] },
  { key: 'rente', label: 'Rente & Soziales', color: '#A855F7', keywords: ['rente', 'sozial', 'bürgergeld', 'grundsicherung', 'pfleg', 'gesundheit'] },
  { key: 'bildung', label: 'Bildung', color: '#52b7c1', keywords: ['bildung', 'schule', 'lehrer', 'studium', 'universität', 'abitur', 'pisa'] },
  { key: 'ukraine', label: 'Ukraine & Außenpolitik', color: '#F97316', keywords: ['ukraine', 'russland', 'nato', 'außenpolitik', 'krieg', 'diplomatie'] },
  { key: 'wahl', label: 'Wahlen', color: '#eab308', keywords: ['wahl', 'abstimmung', 'koalition', 'bundesrat', 'bundestag', 'wahlkampf'] },
  { key: 'digital', label: 'Digitalisierung & KI', color: '#06b6d4', keywords: ['digital', 'ki ', 'künstliche intelligenz', 'internet', 'technik', 'daten'] },
]

const LOC_KEY = 'polaris_themen_lokallisten'
function loadLokallisten() { try { return JSON.parse(localStorage.getItem(LOC_KEY)) || [] } catch { return [] } }
function saveLokallisten(l) { localStorage.setItem(LOC_KEY, JSON.stringify(l)) }

function matchThema(artikel, thema) {
  const text = `${artikel.titel || ''} ${artikel.zusammenfassung || ''}`.toLowerCase()
  return thema.keywords.some(k => text.includes(k))
}

function ScoreBar({ pos, neg, total }) {
  const posW = total > 0 ? (pos / total) * 100 : 0
  const negW = total > 0 ? (neg / total) * 100 : 0
  const neuW = Math.max(0, 100 - posW - negW)
  return (
    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', marginTop: '0.5rem' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${posW}%` }} transition={{ duration: 0.7 }} style={{ height: '100%', background: '#22c55e' }} />
      <motion.div initial={{ width: 0 }} animate={{ width: `${neuW}%` }} transition={{ duration: 0.7, delay: 0.1 }} style={{ height: '100%', background: 'rgba(255,166,0,0.5)' }} />
      <motion.div initial={{ width: 0 }} animate={{ width: `${negW}%` }} transition={{ duration: 0.7, delay: 0.2 }} style={{ height: '100%', background: '#ef4444' }} />
    </div>
  )
}

function ThemaCard({ thema, articles, index, narrativeMatches = [] }) {
  const [expanded, setExpanded] = useState(false)
  const matched = articles.filter(a => matchThema(a, thema))
  if (matched.length === 0) return null

  const pos = matched.filter(a => a.cdu_wirkung === 'positiv').length
  const neg = matched.filter(a => a.cdu_wirkung === 'negativ').length
  const trend = pos - neg
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#ffa600'
  const score = matched.length > 0 ? Math.round(((pos - neg) / matched.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: '#162230', border: `1px solid rgba(255,255,255,0.08)`, borderLeft: `3px solid ${thema.color}`, borderRadius: 12, overflow: 'hidden' }}
    >
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{thema.label}</span>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: `${thema.color}18`, color: thema.color, border: `1px solid ${thema.color}30`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>
              {matched.length} Artikel
            </span>
            {narrativeMatches.length > 0 && (
              <span title={narrativeMatches.map(n => n.titel).join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.5625rem', fontWeight: 700, background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                <Bookmark size={9} /> {narrativeMatches.length} Narrativ
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.625rem', color: '#22c55e', fontWeight: 600 }}>↑ {pos}</span>
            <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 600 }}>↓ {neg}</span>
            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{matched.length - pos - neg} neutral</span>
          </div>
          <ScoreBar pos={pos} neg={neg} total={matched.length} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <TrendIcon size={14} color={trendColor} />
            <span style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.5rem', color: trendColor, letterSpacing: '-0.04em' }}>{score > 0 ? '+' : ''}{score}</span>
          </div>
          {expanded ? <ChevronUp size={12} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.35)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {matched.slice(0, 8).map(a => (
            <div key={a.id} style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.cdu_wirkung === 'positiv' ? '#22c55e' : a.cdu_wirkung === 'negativ' ? '#ef4444' : '#ffa600', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', color: '#fff', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                {a.zusammenfassung && <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginTop: '0.125rem' }}>{a.zusammenfassung}</p>}
              </div>
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = thema.color} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}><ExternalLink size={11} /></a>}
            </div>
          ))}
          {matched.length > 8 && (
            <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              + {matched.length - 8} weitere Artikel
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function LokallistePanel({ articles }) {
  const [listen, setListen] = useState(loadLokallisten)
  const [input, setInput] = useState('')

  function add() {
    const name = input.trim()
    if (!name || listen.some(l => l.name === name)) return
    const next = [...listen, { name, keywords: [name.toLowerCase()] }]
    setListen(next); saveLokallisten(next); setInput('')
  }

  function remove(name) {
    const next = listen.filter(l => l.name !== name)
    setListen(next); saveLokallisten(next)
  }

  return (
    <div style={{ background: '#162230', border: '1px solid rgba(255,166,0,0.2)', borderTop: '3px solid #ffa600', borderRadius: 14, padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <MapPin size={13} color="#ffa600" />
        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase' }}>Lokale Themen-Listen</span>
        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)' }}>Eigene Suchbegriffe für lokale Beobachtung</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="z.B. Villingen-Schwenningen, VS-Villingen, Schwarzwald-Baar…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,166,0,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,166,0,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,166,0,0.2)'}
        />
        <button onClick={add} disabled={!input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: input.trim() ? 'rgba(255,166,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${input.trim() ? 'rgba(255,166,0,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: input.trim() ? '#ffa600' : 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {listen.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '1rem' }}>Noch keine lokalen Listen. Begriff eingeben und auf Enter drücken.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {listen.map(l => {
            const matched = articles.filter(a => {
              const text = `${a.titel || ''} ${a.zusammenfassung || ''}`.toLowerCase()
              return l.keywords.some(k => text.includes(k))
            })
            return (
              <div key={l.name} style={{ background: 'rgba(255,166,0,0.04)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPin size={10} color="#ffa600" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', flex: 1 }}>{l.name}</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#ffa600' }}>{matched.length} Treffer</span>
                  <button onClick={() => remove(l.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                    <X size={10} />
                  </button>
                </div>
                {matched.slice(0, 3).map(a => (
                  <div key={a.id} onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
                    style={{ padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: a.url ? 'pointer' : 'default' }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                  </div>
                ))}
                {matched.length === 0 && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Keine Artikel gefunden</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ThemenCockpit() {
  const { articles, loading } = useArticles({ limit: 500 })
  const { aktiveKampagne, aktivesProfil } = useKampagne()
  const dachNarrativ = aktiveKampagne ? getDachNarrativ(aktiveKampagne.id) : null
  const themenNarrative = aktiveKampagne ? getThemenNarrative(aktiveKampagne.id).filter(n => n.status === 'aktiv') : []
  const [regionen] = useState(loadRegionen)
  const [activeRegionId, setActiveRegionId] = useState('gesamt')
  const [liveArticles, setLiveArticles] = useState([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState(null)
  const [liveScanned, setLiveScanned] = useState({}) // regionId → timestamp
  const scanRef = useRef({})

  const activeRegion = regionen.find(r => r.id === activeRegionId) || regionen[0]

  // Auto-scan when switching to non-Gesamt region (once per region per session)
  useEffect(() => {
    if (activeRegion.id === 'gesamt') { setLiveArticles([]); return }
    if (scanRef.current[activeRegion.id]) return // already scanned this session
    scanRef.current[activeRegion.id] = true
    setLiveLoading(true); setLiveError(null)
    fetchLiveRegionArticles(activeRegion).then(items => {
      setLiveArticles(items)
      setLiveScanned(prev => ({ ...prev, [activeRegion.id]: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }))
      setLiveLoading(false)
    }).catch(() => { setLiveError('Scan fehlgeschlagen'); setLiveLoading(false) })
  }, [activeRegion.id])

  function rescan() {
    if (activeRegion.id === 'gesamt') return
    scanRef.current[activeRegion.id] = false
    setLiveArticles([]); setLiveLoading(true); setLiveError(null)
    fetchLiveRegionArticles(activeRegion).then(items => {
      setLiveArticles(items)
      setLiveScanned(prev => ({ ...prev, [activeRegion.id]: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }))
      setLiveLoading(false)
      scanRef.current[activeRegion.id] = true
    }).catch(() => { setLiveError('Scan fehlgeschlagen'); setLiveLoading(false) })
  }

  // Merge: DB articles filtered by region + live RSS articles
  const supabaseFiltered = useMemo(() => filterByRegion(articles, activeRegion), [articles, activeRegion])
  const regionArticles = useMemo(() => {
    const combined = [...supabaseFiltered]
    liveArticles.forEach(la => { if (!combined.some(a => a.url === la.url)) combined.push(la) })
    return combined
  }, [supabaseFiltered, liveArticles])

  const themenMitCount = useMemo(() =>
    THEMEN.map(t => ({ ...t, count: regionArticles.filter(a => matchThema(a, t)).length }))
      .sort((a, b) => b.count - a.count),
    [regionArticles]
  )

  // Bundesthemen (immer alle Artikel, nie regional gefiltert) — als Vergleich
  const bundesThemenMitCount = useMemo(() =>
    THEMEN.map(t => ({ ...t, count: articles.filter(a => matchThema(a, t)).length }))
      .sort((a, b) => b.count - a.count),
    [articles]
  )

  const isLokalView = activeRegion.id !== 'gesamt'

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Themen-Cockpit"
        description="Politische Themen und ihre CDU-Wirkung — regional filterbar."
        icon={Target}
        color={COLOR}
      />

      {/* Region Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {regionen.map(r => (
          <button key={r.id} onClick={() => setActiveRegionId(r.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${activeRegionId === r.id ? r.farbe : 'rgba(255,255,255,0.12)'}`,
            background: activeRegionId === r.id ? `${r.farbe}18` : 'rgba(255,255,255,0.03)',
            color: activeRegionId === r.id ? r.farbe : 'rgba(255,255,255,0.65)',
            fontSize: '0.8125rem', fontWeight: activeRegionId === r.id ? 700 : 500,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: '0.875rem' }}>{r.icon}</span>
            {r.name}
          </button>
        ))}
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', marginLeft: '0.5rem' }}>
          Regionen in Stimmungskompass verwalten
        </span>
      </div>

      {/* Kampagnen-Themen aus Profil */}
      {aktivesProfil?.lokale_themen?.length > 0 && (
        <div style={{ background: '#162230', border: '1px solid rgba(255,166,0,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <Target size={12} color={COLOR} />
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase' }}>Kampagnen-Themen · {aktiveKampagne?.ort}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {aktivesProfil.lokale_themen.map((t, i) => {
              const brennColor = t.brennstufe === 'hoch' ? '#ef4444' : t.brennstufe === 'mittel' ? '#ffa600' : '#52b7c1'
              const count = regionArticles.filter(a => {
                const text = `${a.titel || ''} ${a.zusammenfassung || ''}`.toLowerCase()
                return t.titel && text.includes(t.titel.toLowerCase())
              }).length
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', background: `${brennColor}10`, border: `1px solid ${brennColor}30`, borderRadius: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{t.titel}</span>
                  {t.position && <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{t.position}</span>}
                  {count > 0 && <span style={{ fontSize: '0.625rem', fontWeight: 700, color: brennColor }}>{count} Art.</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Narrativ-Banner */}
      {dachNarrativ && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', marginBottom: '1rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10 }}>
          <Bookmark size={13} color="#A855F7" />
          <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>Dach-Narrativ</span>
          <span style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600 }}>{dachNarrativ.titel}</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginLeft: 'auto', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>{dachNarrativ.kernbotschaft}</span>
        </div>
      )}

      {/* Live Scan Status Bar */}
      {activeRegion.id !== 'gesamt' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.625rem 1rem', background: liveLoading ? 'rgba(82,183,193,0.08)' : liveError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${liveLoading ? 'rgba(82,183,193,0.2)' : liveError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 10 }}>
          {liveLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
              <Radio size={13} color="#52b7c1" />
            </motion.div>
          ) : (
            <Radio size={13} color={liveError ? '#ef4444' : '#22c55e'} />
          )}
          <span style={{ fontSize: '0.75rem', color: liveLoading ? '#52b7c1' : liveError ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
            {liveLoading ? `Scanne Medien für "${activeRegion.name}"…` : liveError ? liveError : `Live-Scan: ${liveArticles.length} Artikel · ${liveScanned[activeRegion.id] || ''}`}
          </span>
          {!liveLoading && (
            <button onClick={rescan} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem' }}>
              <RefreshCw size={10} /> Neu scannen
            </button>
          )}
        </div>
      )}

      {loading || liveLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <Radio size={32} color="rgba(82,183,193,0.5)" />
          </motion.div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem' }}>
            {liveLoading ? `Scanne Medien & Presse für "${activeRegion.name}"…` : 'Lade Themen…'}
          </p>
        </div>
      ) : regionArticles.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <MapPin size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem' }}>
            {activeRegion.id === 'gesamt' ? 'Keine Artikel. Bitte Sync starten.' : `Keine Artikel für "${activeRegion.name}" gefunden.`}
          </p>
          {activeRegion.keywords?.length > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Suchbegriffe: {activeRegion.keywords.join(', ')}</p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeRegionId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Section Header — Lokale Themen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem' }}>{activeRegion.icon}</span>
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: activeRegion.farbe, textTransform: 'uppercase' }}>
                {isLokalView ? `Lokale Themen — ${activeRegion.name}` : 'Themen bundesweit'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>· {regionArticles.length} Artikel</span>
              {liveArticles.length > 0 && <span style={{ fontSize: '0.6875rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '0.1rem 0.4rem' }}>⚡ {liveArticles.length} live</span>}
            </div>

            {/* Top-5 Score Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.625rem', marginBottom: '1.5rem' }}>
              {themenMitCount.slice(0, 5).map((t, i) => {
                const pos = regionArticles.filter(a => matchThema(a, t) && a.cdu_wirkung === 'positiv').length
                const neg = regionArticles.filter(a => matchThema(a, t) && a.cdu_wirkung === 'negativ').length
                const score = t.count > 0 ? Math.round(((pos - neg) / t.count) * 100) : 0
                const scoreColor = score > 10 ? '#22c55e' : score < -10 ? '#ef4444' : COLOR
                return (
                  <motion.div key={t.key}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ background: '#162230', border: `1px solid rgba(255,255,255,0.08)`, borderTop: `3px solid ${t.color}`, borderRadius: 12, padding: '0.875rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{t.count}</div>
                    <div style={{ fontSize: '0.625rem', color: t.color, fontWeight: 700, marginTop: '0.25rem', lineHeight: 1.3 }}>{t.label}</div>
                    <div style={{ fontSize: '0.5625rem', color: scoreColor, fontWeight: 700, marginTop: '0.25rem' }}>{score > 0 ? '+' : ''}{score} Score</div>
                  </motion.div>
                )
              })}
            </div>

            {/* Themen-Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {themenMitCount.map((t, i) => {
                const fieldId = THEMA_TO_THEMENFELD[t.key]
                const matches = fieldId ? themenNarrative.filter(n => n.themenfeld === fieldId) : []
                return <ThemaCard key={t.key} thema={t} articles={regionArticles} index={i} narrativeMatches={matches} />
              })}
            </div>

            {/* Bundesthemen-Vergleich (nur in Lokal-View) */}
            {isLokalView && articles.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>🇩🇪</span>
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>Bundesthemen — Vergleich</span>
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>Was bewegt Deutschland gerade · {articles.length} Artikel</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {bundesThemenMitCount.slice(0, 5).map(t => {
                    const lokalCount = themenMitCount.find(l => l.key === t.key)?.count || 0
                    const lokalRatio = articles.length > 0 ? (t.count / articles.length) : 0
                    const regionRatio = regionArticles.length > 0 ? (lokalCount / regionArticles.length) : 0
                    const overWeighted = regionRatio > lokalRatio * 1.4
                    const underWeighted = regionRatio < lokalRatio * 0.6
                    return (
                      <div key={t.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${t.color}80`, borderRadius: 10, padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.03em', lineHeight: 1 }}>{t.count}</div>
                        <div style={{ fontSize: '0.5625rem', color: t.color, fontWeight: 700, marginTop: '0.25rem', lineHeight: 1.3, opacity: 0.85 }}>{t.label}</div>
                        <div style={{ fontSize: '0.5rem', color: overWeighted ? '#22c55e' : underWeighted ? '#bf111b' : 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: '0.25rem', letterSpacing: '0.05em' }}>
                          {overWeighted ? `↑ lokal stärker` : underWeighted ? `↓ lokal schwächer` : `≈ wie Bund`}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.625rem', fontStyle: 'italic' }}>
                  Vergleich: Anteil eines Themas an allen Artikeln in {activeRegion.name} vs. bundesweit. „Lokal stärker" = das Thema dominiert vor Ort mehr als in Deutschland insgesamt.
                </p>
              </div>
            )}

            {/* Lokallisten */}
            <LokallistePanel articles={regionArticles} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
