import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ExternalLink, Newspaper, Zap, Minus, MapPin } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

// ── Bundesdaten (Sonntagsfrage, Stand April 2026) ────────────────────────────
const BUND_UMFRAGEN = [
  { institut: 'Forsa',          datum: '22.04.2026', quelle: 'RTL/ntv', werte: { CDU: 30, SPD: 16, Grüne: 11, AfD: 20, FDP: 5, BSW: 4, Sonstige: 14 } },
  { institut: 'INSA',           datum: '18.04.2026', quelle: 'Bild',    werte: { CDU: 29, SPD: 15, Grüne: 12, AfD: 21, FDP: 5, BSW: 4, Sonstige: 14 } },
  { institut: 'Infratest dimap',datum: '10.04.2026', quelle: 'ARD',     werte: { CDU: 31, SPD: 17, Grüne: 10, AfD: 19, FDP: 5, BSW: 5, Sonstige: 13 } },
  { institut: 'Allensbach',     datum: '05.04.2026', quelle: 'FAZ',     werte: { CDU: 33, SPD: 16, Grüne: 11, AfD: 18, FDP: 6, BSW: 4, Sonstige: 12 } },
]

const BUND_TREND = [
  { monat: 'Mai 25', wert: 28 }, { monat: 'Jun 25', wert: 29 }, { monat: 'Jul 25', wert: 27 },
  { monat: 'Aug 25', wert: 28 }, { monat: 'Sep 25', wert: 30 }, { monat: 'Okt 25', wert: 31 },
  { monat: 'Nov 25', wert: 32 }, { monat: 'Dez 25', wert: 30 }, { monat: 'Jan 26', wert: 29 },
  { monat: 'Feb 26', wert: 30 }, { monat: 'Mär 26', wert: 31 }, { monat: 'Apr 26', wert: 30 },
]

// ── 16 Bundesländer ──────────────────────────────────────────────────────────
const BUNDESLAENDER = [
  { kuerzel: 'BW',  name: 'Baden-Württemberg',       naechsteWahl: 'LTW März 2026',  hauptpartei: 'Grüne/CDU' },
  { kuerzel: 'BY',  name: 'Bayern',                  naechsteWahl: 'LTW Okt 2028',   hauptpartei: 'CSU' },
  { kuerzel: 'BE',  name: 'Berlin',                  naechsteWahl: 'AH-Wahl 2026',   hauptpartei: 'CDU/SPD' },
  { kuerzel: 'BB',  name: 'Brandenburg',             naechsteWahl: 'LTW Sep 2029',   hauptpartei: 'SPD' },
  { kuerzel: 'HB',  name: 'Bremen',                  naechsteWahl: 'BürgerschaftW. Mai 2027', hauptpartei: 'SPD' },
  { kuerzel: 'HH',  name: 'Hamburg',                 naechsteWahl: 'BürgerschaftW. Feb 2029', hauptpartei: 'SPD' },
  { kuerzel: 'HE',  name: 'Hessen',                  naechsteWahl: 'LTW Okt 2028',   hauptpartei: 'CDU' },
  { kuerzel: 'MV',  name: 'Mecklenburg-Vorpommern',  naechsteWahl: 'LTW Sep 2026',   hauptpartei: 'SPD' },
  { kuerzel: 'NI',  name: 'Niedersachsen',           naechsteWahl: 'LTW Okt 2027',   hauptpartei: 'SPD' },
  { kuerzel: 'NW',  name: 'Nordrhein-Westfalen',     naechsteWahl: 'LTW Mai 2027',   hauptpartei: 'CDU' },
  { kuerzel: 'RP',  name: 'Rheinland-Pfalz',         naechsteWahl: 'LTW Mär 2026',   hauptpartei: 'SPD' },
  { kuerzel: 'SL',  name: 'Saarland',                naechsteWahl: 'LTW Mär 2027',   hauptpartei: 'CDU' },
  { kuerzel: 'SN',  name: 'Sachsen',                 naechsteWahl: 'LTW Sep 2029',   hauptpartei: 'CDU' },
  { kuerzel: 'ST',  name: 'Sachsen-Anhalt',          naechsteWahl: 'LTW Jun 2026',   hauptpartei: 'CDU' },
  { kuerzel: 'SH',  name: 'Schleswig-Holstein',      naechsteWahl: 'LTW Mai 2027',   hauptpartei: 'CDU' },
  { kuerzel: 'TH',  name: 'Thüringen',               naechsteWahl: 'LTW Sep 2029',   hauptpartei: 'AfD/CDU' },
]

const PARTEI_COLORS = {
  CDU: '#ffa600', CSU: '#0570C9', SPD: '#E3000F', Grüne: '#46962B',
  AfD: '#009EE0', FDP: '#FFED00', BSW: '#7B2D8B', Linke: '#BE3075',
  Freie: '#E95C0A', Sonstige: '#94A3B8',
}

// ── Google News RSS → Artikel ────────────────────────────────────────────────
async function fetchUmfrageArtikel(bundesland) {
  const q = `"${bundesland}" Umfrage Sonntagsfrage Landtag`
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:90d&hl=de&gl=DE&ceid=DE:de`
  try {
    const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const xml = await res.text()
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const items = []
    doc.querySelectorAll('item').forEach(item => {
      const title = item.querySelector('title')?.textContent?.trim()
      const link = item.querySelector('link')?.textContent?.trim()
      const pubDate = item.querySelector('pubDate')?.textContent?.trim()
      const source = item.querySelector('source')?.textContent?.trim()
      if (title) items.push({ title, link, pubDate, source })
    })
    return items.slice(0, 12)
  } catch { return [] }
}

// ── Claude: Umfragewerte aus Schlagzeilen extrahieren ────────────────────────
async function extractUmfrageWerte(artikel, bundesland) {
  if (!API_KEY || !artikel.length) return null
  const headlines = artikel.map((a, i) =>
    `${i + 1}. ${a.title} (${a.source || ''}, ${a.pubDate ? new Date(a.pubDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''})`
  ).join('\n')

  const prompt = `Du analysierst Nachrichtenschlagzeilen über Umfragen in ${bundesland}.

Schlagzeilen:
${headlines}

Extrahiere aus diesen Schlagzeilen die aktuellsten Umfragewerte für ${bundesland} als JSON.
Suche nach Prozentzahlen für Parteien (CDU/CSU, SPD, Grüne, AfD, FDP, BSW, Linke etc.).
Nimm das aktuellste Institut.

Antworte NUR mit JSON, keine Erklärung:
{
  "institut": "Institutsname",
  "datum": "TT.MM.JJJJ",
  "quelle": "Medienquelle",
  "werte": { "CDU": 30, "SPD": 20, ... }
}

Falls keine konkreten Zahlen erkennbar: { "fehler": "Keine Umfragewerte in den Schlagzeilen gefunden" }`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: {
        'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    let raw = (data.content?.[0]?.text || '').trim()
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch { return null }
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function TrendSparkline({ data }) {
  const max = Math.max(...data.map(d => d.wert))
  const min = Math.min(...data.map(d => d.wert)) - 2
  const range = max - min || 1
  const W = 300, H = 60
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((d.wert - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  const last = data[data.length - 1].wert
  const diff = last - data[data.length - 2].wert
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <polyline points={points} fill="none" stroke="#ffa600" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * W
          const y = H - ((d.wert - min) / range) * H
          return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2} fill={i === data.length - 1 ? '#ffa600' : 'rgba(255,166,0,0.4)'} />
        })}
      </svg>
      <div>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.25rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{last}%</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
          {diff >= 0 ? <TrendingUp size={11} color="#22c55e" /> : <TrendingDown size={11} color="#ff4040" />}
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: diff >= 0 ? '#22c55e' : '#ff4040' }}>{diff >= 0 ? '+' : ''}{diff}% ggü. Vormonat</span>
        </div>
      </div>
    </div>
  )
}

// ── Balkendiagramm ───────────────────────────────────────────────────────────
function BalkenDiagramm({ werte, highlightPartei = 'CDU' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Object.entries(werte).sort((a, b) => b[1] - a[1]).map(([partei, wert]) => (
        <div key={partei}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: partei === highlightPartei ? 800 : 600, color: '#fff' }}>{partei}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: PARTEI_COLORS[partei] || '#94a3b8' }}>{wert}%</span>
          </div>
          <div style={{ height: partei === highlightPartei ? 10 : 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${wert}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ height: '100%', background: PARTEI_COLORS[partei] || '#94a3b8', borderRadius: 4, opacity: partei === highlightPartei ? 1 : 0.75 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Bundesland-Dropdown ──────────────────────────────────────────────────────
function BundeslandDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false)
  const bl = BUNDESLAENDER.find(b => b.kuerzel === selected)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: selected ? 'rgba(82,183,193,0.12)' : '#162230',
          border: `1px solid ${selected ? 'rgba(82,183,193,0.4)' : 'rgba(82,183,193,0.2)'}`,
          borderRadius: 10, padding: '0.625rem 1rem',
          color: '#fff', fontSize: '0.875rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', minWidth: 240,
          transition: 'all 0.15s',
        }}
      >
        <MapPin size={13} color={selected ? '#52b7c1' : 'rgba(255,255,255,0.5)'} />
        <span style={{ flex: 1, textAlign: 'left' }}>{bl ? bl.name : 'Bundesland wählen…'}</span>
        {selected && (
          <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#52b7c1', background: 'rgba(82,183,193,0.12)', border: '1px solid rgba(82,183,193,0.25)', borderRadius: 4, padding: '0.1rem 0.35rem' }}>
            {bl?.naechsteWahl}
          </span>
        )}
        <ChevronDown size={13} color="rgba(255,255,255,0.5)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
              background: '#1a2c3d', border: '1px solid rgba(82,183,193,0.25)',
              borderRadius: 12, overflow: 'hidden', minWidth: 300,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Bund-Option */}
            <div
              onClick={() => { onChange(null); setOpen(false) }}
              style={{ padding: '0.625rem 1rem', cursor: 'pointer', background: !selected ? 'rgba(255,166,0,0.08)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (selected) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '0.5rem', fontWeight: 700, background: 'rgba(255,166,0,0.15)', color: '#ffa600', border: '1px solid rgba(255,166,0,0.3)', borderRadius: 3, padding: '0.1rem 0.35rem' }}>BUND</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: !selected ? 700 : 500, color: !selected ? '#ffa600' : '#fff' }}>Bundesebene</span>
            </div>
            {/* Bundesländer */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {BUNDESLAENDER.map(bl => (
                <div key={bl.kuerzel}
                  onClick={() => { onChange(bl.kuerzel); setOpen(false) }}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: selected === bl.kuerzel ? 'rgba(82,183,193,0.1)' : 'transparent', borderLeft: `2px solid ${selected === bl.kuerzel ? '#52b7c1' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', transition: 'all 0.1s' }}
                  onMouseEnter={e => { if (selected !== bl.kuerzel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (selected !== bl.kuerzel) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '0.1rem 0.3rem', minWidth: 22, textAlign: 'center' }}>{bl.kuerzel}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: selected === bl.kuerzel ? 700 : 500, color: selected === bl.kuerzel ? '#fff' : 'rgba(255,255,255,0.85)' }}>{bl.name}</span>
                  </div>
                  <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{bl.naechsteWahl}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Bundesland-Umfrage-Panel ──────────────────────────────────────────────────
function BundeslandPanel({ kuerzel }) {
  const bl = BUNDESLAENDER.find(b => b.kuerzel === kuerzel)
  const [artikel, setArtikel] = useState([])
  const [umfrage, setUmfrage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')

  async function laden() {
    setLoading(true); setArtikel([]); setUmfrage(null); setError('')
    const arts = await fetchUmfrageArtikel(bl.name)
    setArtikel(arts)
    setLoading(false)
    if (arts.length > 0) {
      setExtracting(true)
      const result = await extractUmfrageWerte(arts, bl.name)
      if (result?.fehler) setError(result.fehler)
      else if (result?.werte) setUmfrage(result)
      else setError('KI konnte keine Umfragewerte extrahieren.')
      setExtracting(false)
    } else {
      setError('Keine Umfrage-Artikel in den letzten 90 Tagen gefunden.')
    }
  }

  useEffect(() => { laden() }, [kuerzel])

  const hauptPartei = bl?.hauptpartei?.split('/')[0] || 'CDU'

  return (
    <motion.div key={kuerzel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.2)', borderTop: '3px solid #52b7c1', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.5rem', fontWeight: 700, background: 'rgba(82,183,193,0.12)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.25)', borderRadius: 4, padding: '0.15rem 0.4rem', letterSpacing: '0.1em' }}>{bl?.kuerzel}</span>
              <h2 style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em' }}>{bl?.name}</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#C8DCF0' }}>Nächste Wahl: <strong style={{ color: '#ffa600' }}>{bl?.naechsteWahl}</strong> · Führende Partei: {bl?.hauptpartei}</p>
          </div>
          <button onClick={laden} disabled={loading || extracting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(82,183,193,0.1)', border: '1px solid rgba(82,183,193,0.25)', borderRadius: 8, padding: '0.5rem 0.875rem', color: '#52b7c1', fontSize: '0.75rem', fontWeight: 700, cursor: loading || extracting ? 'wait' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <RefreshCw size={11} style={{ animation: loading || extracting ? 'spin 0.8s linear infinite' : 'none' }} />
            {loading ? 'Lade…' : extracting ? 'KI analysiert…' : 'Aktualisieren'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>

        {/* Umfrage-Ergebnis */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
          <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Aktuelle Umfrage · {bl?.name}
          </p>

          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              <RefreshCw size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
              Suche Umfragen…
            </div>
          )}

          {extracting && !loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              <Zap size={24} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#52b7c1', opacity: 0.7 }} />
              KI extrahiert Umfragewerte…
            </div>
          )}

          {!loading && !extracting && error && (
            <div style={{ padding: '1.5rem', background: 'rgba(255,166,0,0.05)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: '#ffa600', marginBottom: '0.5rem', fontWeight: 600 }}>Keine aktuellen Daten</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {!loading && !extracting && umfrage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>{umfrage.institut}</p>
                  <p style={{ fontSize: '0.6875rem', color: '#C8DCF0' }}>{umfrage.datum} · {umfrage.quelle}</p>
                </div>
                {umfrage.werte[hauptPartei] && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.25rem', color: PARTEI_COLORS[hauptPartei] || '#ffa600', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {umfrage.werte[hauptPartei]}%
                    </div>
                    <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.6)' }}>{hauptPartei}</p>
                  </div>
                )}
              </div>
              <BalkenDiagramm werte={umfrage.werte} highlightPartei={hauptPartei} />
              <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.875rem', fontStyle: 'italic' }}>
                ⚠ KI-extrahiert aus Presseberichten — Werte ggf. verifizieren
              </p>
            </motion.div>
          )}
        </div>

        {/* Nachrichten-Artikel */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Newspaper size={12} color="#52b7c1" />
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#52b7c1', textTransform: 'uppercase' }}>
              Quellen · {artikel.length} Artikel
            </span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Wird geladen…</div>
            ) : artikel.length === 0 && !loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Keine Artikel gefunden</div>
            ) : artikel.map((a, i) => (
              <div key={i} style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.4, marginBottom: '0.2rem', fontWeight: 500 }}>{a.title}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {a.source && <span style={{ fontSize: '0.5625rem', color: '#52b7c1', fontWeight: 700 }}>{a.source}</span>}
                    {a.pubDate && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(a.pubDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                {a.link && (
                  <a href={a.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(255,255,255,0.65)', flexShrink: 0, transition: 'color 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function UmfrageRadar() {
  const [aktiv, setAktiv] = useState(0)
  const [selectedBL, setSelectedBL] = useState(null)
  const aktuell = BUND_UMFRAGEN[aktiv]
  const durchschnitt = Math.round(BUND_UMFRAGEN.reduce((s, u) => s + u.werte.CDU, 0) / BUND_UMFRAGEN.length * 10) / 10

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Umfrage-Radar" description="Aktuelle Sonntagsfragen Bund & Länder — live aus Presseberichten." icon={BarChart2} color="#ffa600">
        <BundeslandDropdown selected={selectedBL} onChange={setSelectedBL} />
      </PageHeader>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* BUNDESLAND-ANSICHT */}
      {selectedBL ? (
        <BundeslandPanel kuerzel={selectedBL} />
      ) : (
        /* BUNDESEBENE */
        <>
          {/* CDU Trend */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderTop: '3px solid #ffa600', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '1.25rem' }}>CDU/CSU · 12-Monats-Trend · Bundesebene</p>
            <TrendSparkline data={BUND_TREND} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {BUND_TREND.map((d, i) => (
                <span key={i} style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.6)', flex: 1, textAlign: 'center', overflow: 'hidden' }}>{d.monat}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
              <span style={{ fontSize: '0.5625rem', background: 'rgba(255,166,0,0.1)', color: '#ffa600', border: '1px solid rgba(255,166,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>Ø {durchschnitt}% (4 Institute)</span>
              <span style={{ fontSize: '0.5625rem', background: 'rgba(82,183,193,0.08)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>Stand: April 2026</span>
            </div>
          </div>

          {/* Umfragen */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Institut</span>
              </div>
              {BUND_UMFRAGEN.map((u, i) => (
                <div key={i} onClick={() => setAktiv(i)}
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', background: aktiv === i ? 'rgba(82,183,193,0.08)' : 'transparent', borderLeft: `2px solid ${aktiv === i ? '#52b7c1' : 'transparent'}`, transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (aktiv !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (aktiv !== i) e.currentTarget.style.background = 'transparent' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: aktiv === i ? 700 : 500, color: '#fff' }}>{u.institut}</p>
                  <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.125rem' }}>{u.datum} · {u.quelle}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffa600', marginTop: '0.25rem' }}>CDU: {u.werte.CDU}%</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sonntagsfrage · Bundesebene</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{aktuell.institut} · {aktuell.datum}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.75)' }}>Quelle: {aktuell.quelle}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.5rem', color: '#ffa600', letterSpacing: '-0.05em', lineHeight: 1 }}>{aktuell.werte.CDU}%</p>
                  <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.75)' }}>CDU/CSU</p>
                </div>
              </div>
              <BalkenDiagramm werte={aktuell.werte} />
            </div>
          </div>

          {/* Bundesland-Schnellwahl */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Schnellzugriff Bundesländer</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {BUNDESLAENDER.map(bl => (
                <button key={bl.kuerzel} onClick={() => setSelectedBL(bl.kuerzel)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 20, color: '#E2E8F0', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,183,193,0.1)'; e.currentTarget.style.borderColor = 'rgba(82,183,193,0.4)'; e.currentTarget.style.color = '#52b7c1' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#E2E8F0' }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{bl.kuerzel}</span>
                  {bl.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,166,0,0.05)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Minus size={14} color="#ffa600" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              Bundeswerte: Stand April 2026, manuell gepflegt. Länderdaten werden live aus Google News geladen und per KI ausgewertet — Werte bitte gegenchecken.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
