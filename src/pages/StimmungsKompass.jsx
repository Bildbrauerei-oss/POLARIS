import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { isUrgent } from '../lib/utils'
import { Compass, TrendingUp, TrendingDown, Minus, AlertTriangle, ExternalLink, Clock, Plus, X, Search, MapPin, Settings, ChevronDown } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#52b7c1'
const REGIONEN_KEY = 'polaris_stimmung_regionen'
const LISTS_KEY = 'polaris_stimmung_listen'

const DEFAULT_REGIONEN = [
  { id: 'gesamt', name: 'Gesamt', keywords: [], feeds: [], farbe: '#52b7c1', icon: '🇩🇪' },
  { id: 'vs', name: 'Villingen-Schwenningen', keywords: ['villingen', 'schwenningen', 'villingen-schwenningen', 'vs 2026', 'jürgen roth', 'schwarzwald-baar', 'baaremer'], farbe: '#ffa600', icon: '🏙️',
    feeds: [
      { name: 'Schwarzwälder Bote', url: 'https://www.schwarzwaelder-bote.de/rss/feed/' },
      { name: 'NRWZ', url: 'https://www.nrwz.de/feed' },
      { name: 'Südkurier', url: 'https://www.suedkurier.de/feed/index.rss' },
      { name: 'SWR BW', url: 'https://www.swr.de/swraktuell/baden-wuerttemberg/rss.xml' },
    ]
  },
  { id: 'muenchen', name: 'München', keywords: ['münchen', 'munich', 'baumgärtner', 'münchen 2026', 'münchner'], farbe: '#22c55e', icon: '🏛️',
    feeds: [
      { name: 'Abendzeitung München', url: 'https://www.abendzeitung-muenchen.de/rss.xml' },
      { name: 'TZ München', url: 'https://www.tz.de/rss.xml' },
      { name: 'Münchner Merkur', url: 'https://www.merkur.de/rss.xml' },
    ]
  },
  { id: 'nrw', name: 'NRW', keywords: ['nrw', 'nordrhein-westfalen', 'wüst', 'düsseldorf', 'köln', 'dortmund'], farbe: '#a78bfa', icon: '🌆',
    feeds: [
      { name: 'RP Online', url: 'https://rp-online.de/rss.xml' },
      { name: 'WDR NRW', url: 'https://www1.wdr.de/nachrichten/nachrichten-100~_format-rss.xml' },
    ]
  },
]

function loadRegionen() {
  try { return JSON.parse(localStorage.getItem(REGIONEN_KEY)) || DEFAULT_REGIONEN }
  catch { return DEFAULT_REGIONEN }
}
function saveRegionen(r) { localStorage.setItem(REGIONEN_KEY, JSON.stringify(r)) }
function loadListen() {
  try { return JSON.parse(localStorage.getItem(LISTS_KEY)) || [] }
  catch { return [] }
}
function saveListen(l) { localStorage.setItem(LISTS_KEY, JSON.stringify(l)) }

function filterByRegion(articles, region) {
  if (!region || region.id === 'gesamt' || !region.keywords?.length) return articles
  return articles.filter(a => {
    const text = `${a.titel || ''} ${a.zusammenfassung || ''} ${a.quelle || ''}`.toLowerCase()
    return region.keywords.some(k => text.includes(k.toLowerCase()))
  })
}

function Bar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{value} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>({pct}%)</span></span>
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderTop: `3px solid ${color}`, borderRadius: 14, padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <div style={{ width: 30, height: 30, background: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.375rem' }}>{sub}</div>}
    </motion.div>
  )
}

// ── Region Tabs ────────────────────────────────────────────────────────────────
function RegionTabs({ regionen, activeId, onSelect, onManage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {regionen.map(r => (
        <button key={r.id} onClick={() => onSelect(r.id)} style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer',
          border: `1px solid ${activeId === r.id ? r.farbe : 'rgba(255,255,255,0.12)'}`,
          background: activeId === r.id ? `${r.farbe}18` : 'rgba(255,255,255,0.03)',
          color: activeId === r.id ? r.farbe : 'rgba(255,255,255,0.65)',
          fontSize: '0.8125rem', fontWeight: activeId === r.id ? 700 : 500,
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: '0.875rem' }}>{r.icon}</span>
          {r.name}
        </button>
      ))}
      <button onClick={onManage} style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.5rem 0.875rem', borderRadius: 10, cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
        color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', transition: 'all 0.15s',
      }} onMouseEnter={e => e.currentTarget.style.color = COLOR}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
        <Settings size={12} /> Regionen verwalten
      </button>
    </div>
  )
}

// ── Region Manager Panel ───────────────────────────────────────────────────────
const FARBEN = ['#52b7c1', '#ffa600', '#22c55e', '#a78bfa', '#f472b6', '#60a5fa', '#fb923c', '#34d399']
const ICONS = ['🏙️', '🌆', '🏛️', '🗺️', '📍', '🏘️', '🌍', '⭐']

function RegionCard({ region, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [kwInput, setKwInput] = useState('')
  const [feedName, setFeedName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')

  const feeds = region.feeds || []
  const keywords = region.keywords || []

  function addKeyword() {
    const kws = kwInput.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    if (!kws.length) return
    onUpdate({ ...region, keywords: [...keywords, ...kws.filter(k => !keywords.includes(k))] })
    setKwInput('')
  }

  function removeKeyword(kw) { onUpdate({ ...region, keywords: keywords.filter(k => k !== kw) }) }

  function addFeed() {
    if (!feedUrl.trim()) return
    const name = feedName.trim() || new URL(feedUrl.trim()).hostname.replace('www.', '')
    onUpdate({ ...region, feeds: [...feeds, { name, url: feedUrl.trim() }] })
    setFeedName(''); setFeedUrl('')
  }

  function removeFeed(url) { onUpdate({ ...region, feeds: feeds.filter(f => f.url !== url) }) }

  return (
    <div style={{ background: `${region.farbe}08`, border: `1px solid ${region.farbe}25`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: region.id !== 'gesamt' ? 'pointer' : 'default' }}
        onClick={() => region.id !== 'gesamt' && setExpanded(e => !e)}>
        <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{region.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.8125rem' }}>{region.name}</div>
          <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
            {region.id === 'gesamt' ? 'Alle Artikel' : `${keywords.length} Buzzwords · ${feeds.length} Quellen`}
          </div>
        </div>
        {region.id !== 'gesamt' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button onClick={e => { e.stopPropagation(); onDelete(region.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
              <X size={10} />
            </button>
            <ChevronDown size={12} color="rgba(255,255,255,0.35)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${region.farbe}20`, padding: '0.875rem 1rem' }}>
          {/* Buzzwords */}
          <div style={{ marginBottom: '0.875rem' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Buzzwords / Suchbegriffe</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {keywords.map(kw => (
                <span key={kw} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: `${region.farbe}15`, border: `1px solid ${region.farbe}30`, borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.6875rem', color: region.farbe }}>
                  {kw}
                  <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {keywords.length === 0 && <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>Noch keine Buzzwords</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="Begriff1, Begriff2, …" style={{ ...iStyle, flex: 1, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} />
              <button onClick={addKeyword} disabled={!kwInput.trim()} style={{ padding: '0.375rem 0.625rem', background: `${region.farbe}15`, border: `1px solid ${region.farbe}40`, borderRadius: 6, color: region.farbe, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* RSS-Quellen */}
          <div>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lokale RSS-Quellen</div>
            {feeds.map(f => (
              <div key={f.url} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                <span style={{ fontSize: '0.75rem', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{f.url}</span>
                <button onClick={() => removeFeed(f.url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                  <X size={10} />
                </button>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.375rem', marginTop: '0.5rem' }}>
              <input value={feedName} onChange={e => setFeedName(e.target.value)} placeholder="Name (z.B. SWR)" style={{ ...iStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} />
              <input value={feedUrl} onChange={e => setFeedUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeed()} placeholder="RSS-URL (https://…/feed)" style={{ ...iStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} />
              <button onClick={addFeed} disabled={!feedUrl.trim()} style={{ padding: '0.375rem 0.625rem', background: `${region.farbe}15`, border: `1px solid ${region.farbe}40`, borderRadius: 6, color: region.farbe, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                <Plus size={10} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RegionManager({ regionen, onClose, onSave }) {
  const [list, setList] = useState(() => regionen.map(r => ({ feeds: [], ...r })))
  const [name, setName] = useState('')
  const [kw, setKw] = useState('')
  const [farbe, setFarbe] = useState(FARBEN[1])
  const [icon, setIcon] = useState(ICONS[0])

  function updateRegion(updated) { setList(l => l.map(r => r.id === updated.id ? updated : r)) }
  function deleteRegion(id) { if (id !== 'gesamt') setList(l => l.filter(r => r.id !== id)) }

  function add() {
    if (!name.trim()) return
    const keywords = kw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    setList(prev => [...prev, { id, name: name.trim(), keywords, feeds: [], farbe, icon }])
    setName(''); setKw('')
  }

  function save() { onSave(list); onClose() }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#0f1923', border: `1px solid ${COLOR}30`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={14} color={COLOR} />
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase' }}>Regionen & Quellen verwalten</span>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>— Region anklicken zum Bearbeiten</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}><X size={14} /></button>
      </div>

      {/* Bestehende Regionen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {list.map(r => <RegionCard key={r.id} region={r} onUpdate={updateRegion} onDelete={deleteRegion} />)}
      </div>

      {/* Neue Region */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Neue Region</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder='Regionsname (z.B. "Stuttgart")' style={iStyle} />
          <input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder='Buzzwords kommagetrennt' style={iStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>FARBE</span>
            {FARBEN.map(f => (
              <button key={f} onClick={() => setFarbe(f)} style={{ width: 18, height: 18, borderRadius: '50%', background: f, border: farbe === f ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>ICON</span>
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ fontSize: '1rem', background: icon === ic ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '0 2px' }}>{ic}</button>
            ))}
          </div>
        </div>
        <button onClick={add} disabled={!name.trim()} style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.5rem 1rem', background: name.trim() ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${name.trim() ? COLOR : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8, color: name.trim() ? COLOR : 'rgba(255,255,255,0.35)',
          fontSize: '0.8125rem', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
        }}>
          <Plus size={12} /> Region hinzufügen
        </button>
      </div>

      <button onClick={save} style={{
        padding: '0.625rem 1.5rem', background: `${COLOR}20`, border: `1px solid ${COLOR}`,
        borderRadius: 10, color: COLOR, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Speichern & schließen
      </button>
    </motion.div>
  )
}

// ── Custom Monitoring Listen ───────────────────────────────────────────────────
function MonitoringListenPanel({ articles }) {
  const [listen, setListen] = useState(loadListen)
  const [nameInput, setNameInput] = useState('')
  const [kwInput, setKwInput] = useState('')

  function add() {
    const name = nameInput.trim(); const kw = kwInput.trim()
    if (!name || !kw) return
    const keywords = kw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    const next = [...listen, { name, keywords }]
    setListen(next); saveListen(next)
    setNameInput(''); setKwInput('')
  }

  function remove(name) {
    const next = listen.filter(l => l.name !== name)
    setListen(next); saveListen(next)
  }

  return (
    <div style={{ background: '#162230', border: `1px solid ${COLOR}15`, borderTop: `3px solid ${COLOR}`, borderRadius: 14, padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Search size={13} color={COLOR} />
        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase' }}>Custom Monitoring-Listen</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder='Name (z.B. "CDU Positiv")' style={iStyle} />
        <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder='Suchbegriffe kommagetrennt' style={iStyle} />
        <button onClick={add} disabled={!nameInput.trim() || !kwInput.trim()} style={{ padding: '0.5rem 0.875rem', background: nameInput.trim() && kwInput.trim() ? `${COLOR}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${nameInput.trim() && kwInput.trim() ? `${COLOR}40` : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: nameInput.trim() && kwInput.trim() ? COLOR : 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', fontWeight: 700, cursor: nameInput.trim() && kwInput.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Plus size={12} /> Hinzufügen
        </button>
      </div>
      {listen.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Noch keine Listen angelegt</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {listen.map(l => {
            const matched = articles.filter(a => {
              const text = `${a.titel || ''} ${a.zusammenfassung || ''}`.toLowerCase()
              return l.keywords.some(k => text.includes(k))
            })
            const pos = matched.filter(a => a.cdu_wirkung === 'positiv').length
            const neg = matched.filter(a => a.cdu_wirkung === 'negativ').length
            const score = matched.length > 0 ? Math.round(((pos - neg) / matched.length) * 100) : 0
            const scoreColor = score > 10 ? '#22c55e' : score < -10 ? '#ef4444' : '#ffa600'
            return (
              <div key={l.name} style={{ background: `${COLOR}05`, border: `1px solid ${COLOR}15`, borderRadius: 10, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', flex: 1 }}>{l.name}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: scoreColor }}>{score > 0 ? '+' : ''}{score}</span>
                  <button onClick={() => remove(l.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}><X size={10} /></button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.625rem', color: '#22c55e', fontWeight: 600 }}>↑ {pos}</span>
                  <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 600 }}>↓ {neg}</span>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{matched.length} Treffer</span>
                </div>
                <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{l.keywords.join(', ')}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const iStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StimmungsKompass() {
  const { articles, loading } = useArticles({ limit: 500 })
  const [regionen, setRegionen] = useState(loadRegionen)
  const [activeRegionId, setActiveRegionId] = useState('gesamt')
  const [showManager, setShowManager] = useState(false)

  const activeRegion = regionen.find(r => r.id === activeRegionId) || regionen[0]
  const regionArticles = useMemo(() => filterByRegion(articles, activeRegion), [articles, activeRegion])

  const stats = useMemo(() => {
    if (!regionArticles.length) return null
    const pos = regionArticles.filter(a => a.cdu_wirkung === 'positiv').length
    const neg = regionArticles.filter(a => a.cdu_wirkung === 'negativ').length
    const neu = regionArticles.filter(a => a.cdu_wirkung === 'neutral').length
    const total = regionArticles.length
    const score = total > 0 ? Math.round(((pos - neg) / total) * 100) : 0
    const urgent = regionArticles.filter(a => isUrgent(a))
    return { pos, neg, neu, total, score, urgent }
  }, [regionArticles])

  // Bundesscore: über alle Artikel (Vergleichsanker)
  const bundStats = useMemo(() => {
    if (!articles.length) return null
    const pos = articles.filter(a => a.cdu_wirkung === 'positiv').length
    const neg = articles.filter(a => a.cdu_wirkung === 'negativ').length
    const total = articles.length
    const score = total > 0 ? Math.round(((pos - neg) / total) * 100) : 0
    return { score, total }
  }, [articles])

  function handleSaveRegionen(newList) {
    setRegionen(newList)
    saveRegionen(newList)
    if (!newList.find(r => r.id === activeRegionId)) setActiveRegionId('gesamt')
  }

  const topNeg = regionArticles.filter(a => a.cdu_wirkung === 'negativ' && a.zusammenfassung).slice(0, 5)
  const topPos = regionArticles.filter(a => a.cdu_wirkung === 'positiv' && a.zusammenfassung).slice(0, 5)
  const scoreColor = !stats ? COLOR : stats.score > 10 ? '#22c55e' : stats.score < -10 ? '#bf111b' : '#ffa600'

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Stimmungskompass" description="CDU-Wirkung der Medienberichterstattung — regional auswertbar." icon={Compass} color={COLOR} />

      {/* Region Tabs */}
      <RegionTabs regionen={regionen} activeId={activeRegionId} onSelect={setActiveRegionId} onManage={() => setShowManager(s => !s)} />

      {/* Region Manager */}
      <AnimatePresence>
        {showManager && (
          <RegionManager regionen={regionen} onClose={() => setShowManager(false)} onSave={handleSaveRegionen} />
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.65)' }}>Analysiere Stimmungslage…</div>
      ) : !stats || stats.total === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <MapPin size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
            {activeRegion.id === 'gesamt' ? 'Noch keine analysierten Artikel. Bitte Sync starten.' : `Keine Artikel für "${activeRegion.name}" gefunden.`}
          </p>
          {activeRegion.id !== 'gesamt' && activeRegion.keywords.length > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Suchbegriffe: {activeRegion.keywords.join(', ')}</p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeRegionId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Region Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem' }}>{activeRegion.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: activeRegion.farbe }}>{activeRegion.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>· {stats.total} Artikel</span>
              {activeRegion.keywords.length > 0 && (
                <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  ({activeRegion.keywords.slice(0, 3).join(', ')}{activeRegion.keywords.length > 3 ? '…' : ''})
                </span>
              )}
            </div>

            {/* Score + Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: '#162230', border: `1px solid ${scoreColor}30`, borderRadius: 20, padding: '2rem', textAlign: 'center', minWidth: 180 }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  {activeRegion.id === 'gesamt' ? 'CDU Score' : `${activeRegion.name} · CDU Score`}
                </div>
                <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '3.5rem', color: scoreColor, letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {stats.score > 0 ? '+' : ''}{stats.score}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                  {stats.score > 20 ? 'Sehr positiv' : stats.score > 5 ? 'Leicht positiv' : stats.score < -20 ? 'Kritisch' : stats.score < -5 ? 'Leicht negativ' : 'Ausgeglichen'}
                </div>
                {/* Bundesscore-Vergleich (nur wenn nicht Gesamt) */}
                {activeRegion.id !== 'gesamt' && bundStats && (() => {
                  const bundColor = bundStats.score > 10 ? '#22c55e' : bundStats.score < -10 ? '#bf111b' : '#ffa600'
                  const delta = stats.score - bundStats.score
                  const deltaColor = delta > 0 ? '#22c55e' : delta < 0 ? '#bf111b' : 'rgba(255,255,255,0.4)'
                  return (
                    <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bund</span>
                        <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '1rem', color: bundColor, letterSpacing: '-0.02em' }}>
                          {bundStats.score > 0 ? '+' : ''}{bundStats.score}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.5625rem', color: deltaColor, fontWeight: 700 }}>
                        {delta > 0 ? `↑ ${delta} besser als Bund` : delta < 0 ? `↓ ${Math.abs(delta)} schlechter als Bund` : '= wie Bund'}
                      </div>
                    </div>
                  )
                })()}
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <StatCard label="Positiv" value={stats.pos} color="#22c55e" icon={TrendingUp} sub={`${Math.round((stats.pos / stats.total) * 100)}% aller Artikel`} />
                  <StatCard label="Neutral" value={stats.neu} color="#ffa600" icon={Minus} sub={`${Math.round((stats.neu / stats.total) * 100)}% aller Artikel`} />
                  <StatCard label="Negativ" value={stats.neg} color="#bf111b" icon={TrendingDown} sub={`${Math.round((stats.neg / stats.total) * 100)}% aller Artikel`} />
                  <StatCard label="Dringend" value={stats.urgent.length} color="#ff4040" icon={AlertTriangle} sub="Sofortreaktion nötig" />
                </div>
                <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    CDU-Wirkung Verteilung ({stats.total} Artikel{activeRegion.id !== 'gesamt' ? ` · ${activeRegion.name}` : ''})
                  </p>
                  <Bar label="CDU ↑ Positiv" value={stats.pos} total={stats.total} color="#22c55e" />
                  <Bar label="CDU → Neutral" value={stats.neu} total={stats.total} color="#ffa600" />
                  <Bar label="CDU ↓ Negativ" value={stats.neg} total={stats.total} color="#bf111b" />
                </div>
              </div>
            </div>

            {/* Top Artikel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingDown size={13} color="#bf111b" />
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#bf111b', textTransform: 'uppercase' }}>CDU Negativ · Top 5</span>
                </div>
                <div>
                  {topNeg.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>Keine negativen Artikel</div>
                  ) : topNeg.map((a, i) => (
                    <div key={a.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(191,17,27,0.5)', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{a.zusammenfassung}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.5625rem', color: COLOR, fontWeight: 600 }}>{a.quelle}</span>
                          <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{new Date(a.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                      {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#bf111b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}><ExternalLink size={11} /></a>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={13} color="#22c55e" />
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#22c55e', textTransform: 'uppercase' }}>CDU Positiv · Top 5</span>
                </div>
                <div>
                  {topPos.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>Keine positiven Artikel</div>
                  ) : topPos.map((a, i) => (
                    <div key={a.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgba(34,197,94,0.5)', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titel}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{a.zusammenfassung}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.5625rem', color: COLOR, fontWeight: 600 }}>{a.quelle}</span>
                          <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{new Date(a.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                      {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#22c55e'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}><ExternalLink size={11} /></a>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <MonitoringListenPanel articles={regionArticles} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
