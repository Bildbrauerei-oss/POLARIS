import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Mail, Send, Settings, Plus, X, RefreshCw,
  ExternalLink, AlertTriangle, TrendingUp, TrendingDown,
  Zap, Shield, Target, Users, ChevronRight, User, Rss, Check, AlertCircle
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useKampagne } from '../lib/kampagneContext'
import { buildNarrativeContext } from '../lib/narrativeStore'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const CONFIG_KEY = 'polaris_briefing_config'
const BRIEFING_KEY = 'polaris_briefing_v2'

const DEFAULT_CONFIG = {
  recipients: [
    { id: '1', name: 'Jan Schlegel', email: 'jan@bildbrauerei.de' },
  ],
  politicians: ['Friedrich Merz', 'Manuel Hagel', 'Markus Söder', 'Olaf Scholz'],
  feeds: [
    { id: '1', label: 'CDU Bundespartei', url: 'https://news.google.com/rss/search?q=CDU&hl=de&gl=DE&ceid=DE:de' },
    { id: '2', label: 'BW Politik', url: 'https://news.google.com/rss/search?q=Baden-Württemberg+Politik&hl=de&gl=DE&ceid=DE:de' },
    { id: '3', label: 'Merz & Bundesregierung', url: 'https://news.google.com/rss/search?q=Merz+Bundesregierung&hl=de&gl=DE&ceid=DE:de' },
  ],
}

function loadConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY)) } } catch { return DEFAULT_CONFIG }
}
function saveConfig(c) { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)) }
function loadBriefing() {
  try {
    const b = JSON.parse(localStorage.getItem(BRIEFING_KEY))
    if (!b) return null
    if (new Date(b.generatedAt).toDateString() !== new Date().toDateString()) return null
    return b
  } catch { return null }
}
function saveBriefing(b) { localStorage.setItem(BRIEFING_KEY, JSON.stringify(b)) }

function parseRss(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = []
  doc.querySelectorAll('item, entry').forEach(item => {
    const title = item.querySelector('title')?.textContent?.trim() || ''
    const link = item.querySelector('link')?.textContent?.trim() || item.querySelector('link')?.getAttribute('href') || ''
    const pub = item.querySelector('pubDate, published, updated')?.textContent?.trim() || ''
    const source = item.querySelector('source')?.textContent?.trim() || ''
    if (title && title.length > 5) items.push({ title, link, pub, source })
  })
  return items
}

async function fetchFeed(url) {
  try {
    const r = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) })
    if (!r.ok) return []
    return parseRss(await r.text())
  } catch { return [] }
}

function timeAgo(pubStr) {
  if (!pubStr) return ''
  try {
    const diff = Date.now() - new Date(pubStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m`
    if (m < 1440) return `${Math.floor(m / 60)}h`
    return `${Math.floor(m / 1440)}T`
  } catch { return '' }
}

// ---- Komponenten ----

function ScoreBar({ value, max = 100, color = '#CC0000', label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

function ArticleRow({ a, rank }) {
  const ago = timeAgo(a.pub)
  return (
    <a href={a.link || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', gap: '0.875rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'flex-start' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#CC0000', minWidth: 18, marginTop: 2 }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.8375rem', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.4, marginBottom: '0.2rem' }}>{a.title}</p>
        <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>{a.source || a.feedLabel} {ago && `· vor ${ago}`}</p>
      </div>
      <ExternalLink size={11} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0, marginTop: 4 }} />
    </a>
  )
}

function PolitikerCard({ name, mentions }) {
  const intensity = Math.min(mentions, 20)
  const bars = 10
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E2E8F0' }}>{name}</div>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 12, borderRadius: 2, background: i < Math.round(intensity / 2) ? '#CC0000' : 'rgba(255,255,255,0.07)' }} />
        ))}
      </div>
      <div style={{ fontSize: '0.6875rem', color: mentions > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.7)', fontWeight: mentions > 0 ? 700 : 400 }}>
        {mentions} Meldung{mentions !== 1 ? 'en' : ''} heute
      </div>
    </div>
  )
}

function KILagebild({ data }) {
  if (!data) return null
  const score = data.stimmung_score || 50

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Persönliche Begrüßung — Politico Playbook Stil */}
      {data.gruss && (
        <div style={{ borderLeft: '3px solid #F97316', paddingLeft: '1rem', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
          <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.9375rem', fontStyle: 'italic', color: '#F1F5F9', lineHeight: 1.65, fontWeight: 400 }}>{data.gruss}</p>
        </div>
      )}

      {/* Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        {[
          { label: 'CDU-Stimmung', value: score, color: score > 60 ? '#22C55E' : score > 40 ? '#ffa600' : '#CC0000', max: 100 },
          { label: 'Bedrohungslage', value: data.bedrohung_score || 30, color: '#CC0000', max: 100 },
          { label: 'Handlungsdruck', value: data.handlungs_score || 40, color: '#F97316', max: 100 },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.875rem' }}>
            <ScoreBar {...s} />
          </div>
        ))}
      </div>

      {/* Schlagzeile / Lage des Tages */}
      {data.schlagzeile && (
        <div style={{ background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.3)', borderLeft: '3px solid #CC0000', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#CC0000', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lage des Tages</div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.5, marginBottom: data.lage_prosa ? '0.625rem' : 0 }}>{data.schlagzeile}</p>
          {data.lage_prosa && (
            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.65 }}>{data.lage_prosa}</p>
          )}
        </div>
      )}

      {/* Brennpunkte — benannte Topics */}
      {(data.brennpunkte || []).length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#52b7c1', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Shield size={10} /> Drei Brennpunkte
          </div>
          {data.brennpunkte.map((b, i) => (
            <div key={i} style={{ marginBottom: i < data.brennpunkte.length - 1 ? '0.875rem' : 0, paddingBottom: i < data.brennpunkte.length - 1 ? '0.875rem' : 0, borderBottom: i < data.brennpunkte.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#52b7c1', fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F1F5F9' }}>{b.titel || b}</span>
              </div>
              {b.text && <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.6, marginLeft: '1.75rem' }}>{b.text}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Gegner im Blick */}
      {(data.gegner_check || []).length > 0 && (
        <div style={{ background: 'rgba(255,166,0,0.04)', border: '1px solid rgba(255,166,0,0.2)', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#ffa600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Target size={10} /> Gegner im Blick
          </div>
          {data.gegner_check.map((l, i) => (
            <p key={i} style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '0.5rem' }}>• {l}</p>
          ))}
        </div>
      )}

      {/* Zahl des Tages + Ausblick */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
        {data.zahl_des_tages && (
          <div style={{ background: 'linear-gradient(135deg, rgba(204,0,0,0.12), rgba(204,0,0,0.04))', border: '1px solid rgba(204,0,0,0.3)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#CC0000', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Zahl des Tages</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '2.25rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.375rem' }}>{data.zahl_des_tages.wert}</div>
            <p style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.45 }}>{data.zahl_des_tages.kontext}</p>
          </div>
        )}
        {data.ausblick && (
          <div style={{ background: 'rgba(82,183,193,0.05)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 8, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#52b7c1', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ChevronRight size={10} /> Was heute noch kommt
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.65 }}>{data.ausblick}</p>
          </div>
        )}
      </div>

      {/* Empfehlung */}
      {(data.empfehlung || []).length > 0 && (
        <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#F97316', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Zap size={10} /> Empfehlung des Tages
          </div>
          {data.empfehlung.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F97316', minWidth: 16, marginTop: 2 }}>{i + 1}.</span>
              <p style={{ fontSize: '0.8375rem', color: '#F1F5F9', lineHeight: 1.55, fontWeight: 500 }}>{e}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConfigPanel({ config, onUpdate, onClose }) {
  const [newEmail, setNewEmail] = useState({ name: '', email: '' })
  const [newPol, setNewPol] = useState('')
  const [newFeed, setNewFeed] = useState({ label: '', url: '' })
  const [showFeedForm, setShowFeedForm] = useState(false)

  const inp = { background: '#0A1628', border: '1px solid #253550', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#E2E8F0', fontSize: '0.8125rem', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, background: '#0F1C30', borderLeft: '1px solid #253550', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Einstellungen</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={16} /></button>
        </div>

        {/* Empfänger */}
        <div>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>Email-Empfänger</div>
          {config.recipients.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#162230', borderRadius: 6, marginBottom: '0.375rem' }}>
              <User size={12} color={r.email ? '#52b7c1' : '#CC0000'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: '0.6875rem', color: r.email ? '#64748B' : '#CC0000' }}>{r.email || '⚠ Keine Email'}</div>
              </div>
              <button onClick={() => onUpdate({ recipients: config.recipients.filter(x => x.id !== r.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={12} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input value={newEmail.name} onChange={e => setNewEmail(p => ({ ...p, name: e.target.value }))} placeholder="Name" style={{ ...inp, flex: '0 0 140px' }} />
            <input value={newEmail.email} onChange={e => setNewEmail(p => ({ ...p, email: e.target.value }))} placeholder="email@..." style={{ ...inp, flex: 1 }} />
            <button onClick={() => { if (newEmail.name && newEmail.email) { onUpdate({ recipients: [...config.recipients, { id: Date.now().toString(), ...newEmail }] }); setNewEmail({ name: '', email: '' }) } }} style={{ background: '#253550', border: 'none', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#52b7c1', cursor: 'pointer' }}>
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Politiker */}
        <div>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>Politiker-Tracking</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
            {config.politicians.map(p => (
              <div key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#162230', border: '1px solid #253550', borderRadius: 20, padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: '#CBD5E1' }}>
                {p} <button onClick={() => onUpdate({ politicians: config.politicians.filter(x => x !== p) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex' }}><X size={10} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={newPol} onChange={e => setNewPol(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newPol.trim()) { onUpdate({ politicians: [...config.politicians, newPol.trim()] }); setNewPol('') } }} placeholder="Name eingeben + Enter" style={{ ...inp, flex: 1 }} />
          </div>
        </div>

        {/* Feeds */}
        <div>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>News-Feeds</div>
          {config.feeds.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#162230', borderRadius: 6, marginBottom: '0.375rem' }}>
              <Rss size={12} color="#64748B" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: '0.625rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.url}</div>
              </div>
              <button onClick={() => onUpdate({ feeds: config.feeds.filter(x => x.id !== f.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={12} /></button>
            </div>
          ))}
          {showFeedForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <input value={newFeed.label} onChange={e => setNewFeed(p => ({ ...p, label: e.target.value }))} placeholder="Label (z.B. AfD Meldungen)" style={inp} />
              <input value={newFeed.url} onChange={e => setNewFeed(p => ({ ...p, url: e.target.value }))} placeholder="Google News RSS URL" style={inp} />
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={() => { if (newFeed.label && newFeed.url) { onUpdate({ feeds: [...config.feeds, { id: Date.now().toString(), ...newFeed }] }); setNewFeed({ label: '', url: '' }); setShowFeedForm(false) } }} style={{ flex: 1, background: '#52b7c1', border: 'none', borderRadius: 6, padding: '0.5rem', color: '#0F1C30', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Hinzufügen</button>
                <button onClick={() => setShowFeedForm(false)} style={{ background: '#253550', border: 'none', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#94A3B8', cursor: 'pointer', fontSize: '0.75rem' }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowFeedForm(true)} style={{ width: '100%', background: '#162230', border: '1px dashed #253550', borderRadius: 6, padding: '0.5rem', color: '#64748B', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              <Plus size={12} /> Feed hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Hauptkomponente ----

export default function Morgenbriefing() {
  const { aktiveKampagne } = useKampagne()
  const [config, setConfig] = useState(loadConfig)
  const [briefing, setBriefing] = useState(loadBriefing)
  const [articles, setArticles] = useState([])
  const [polMentions, setPolMentions] = useState({})
  const [fetchingArticles, setFetchingArticles] = useState(false)
  const [generatingKI, setGeneratingKI] = useState(false)
  const [sending, setSending] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [status, setStatus] = useState(null)

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  function updateConfig(update) {
    setConfig(prev => {
      const next = { ...prev, ...update }
      saveConfig(next)
      return next
    })
  }

  // Artikel sofort beim Laden holen
  async function loadArticles() {
    setFetchingArticles(true)
    const all = []
    await Promise.all(config.feeds.map(async feed => {
      const items = await fetchFeed(feed.url)
      items.forEach(a => all.push({ ...a, feedLabel: feed.label }))
    }))
    // Dedup + sortieren nach Datum
    const seen = new Set()
    const deduped = all.filter(a => {
      if (seen.has(a.title)) return false
      seen.add(a.title)
      return true
    }).sort((a, b) => {
      try { return new Date(b.pub) - new Date(a.pub) } catch { return 0 }
    })
    setArticles(deduped.slice(0, 15))

    // Politiker parallel tracken
    const mentions = {}
    await Promise.all(config.politicians.map(async pol => {
      const url = `https://news.google.com/rss/search?q="${encodeURIComponent(pol)}"&hl=de&gl=DE&ceid=DE:de`
      const items = await fetchFeed(url)
      mentions[pol] = items.length
    }))
    setPolMentions(mentions)
    setFetchingArticles(false)
    return { deduped, mentions }
  }

  useEffect(() => { loadArticles() }, [])

  async function generateKI() {
    setGeneratingKI(true)
    setStatus(null)
    try {
      const articleText = articles.slice(0, 12).map((a, i) => `${i + 1}. "${a.title}" (${a.source || a.feedLabel}, ${a.pub ? new Date(a.pub).toLocaleDateString('de-DE') : 'heute'})`).join('\n')
      const polText = Object.entries(polMentions).map(([n, c]) => `${n}: ${c} Meldungen`).join(', ')
      const hour = new Date().getHours()
      const tageszeit = hour < 5 ? 'nachts' : hour < 11 ? 'morgens' : hour < 14 ? 'mittags' : hour < 18 ? 'nachmittags' : 'abends'
      const wochentag = new Date().toLocaleDateString('de-DE', { weekday: 'long' })

      const kampagneInfo = aktiveKampagne ? `Aktive Kampagne: ${aktiveKampagne.kandidat}, ${aktiveKampagne.wahltyp} ${aktiveKampagne.ort} (${aktiveKampagne.partei}).` : ''
      const narrativeKontext = aktiveKampagne ? buildNarrativeContext(aktiveKampagne.id) : ''
      const narrativeBlock = narrativeKontext ? `\n\nNARRATIV-STRATEGIE DER KAMPAGNE:\n${narrativeKontext}\n\nWichtig: Bewerte die Pressemeldungen durch die Narrativ-Brille — welche Meldung stützt das Dach-Narrativ, welche greift es an, welche aktiviert ein Themen-Narrativ? Lass das in brennpunkte und empfehlung einfließen.` : ''
      const prompt = `Du schreibst das POLARIS Morgenbriefing für bildbrauerei, eine politische Kampagnenagentur. Stil: POLITICO Playbook Berlin kreuz Axios AM — trocken, pointiert, insiderisch. Kein Consulting-Sprech. Keine KI-Phrasen. Keine Einleitung, sofort zum Punkt. ${kampagneInfo}${narrativeBlock}

HEUTE: ${wochentag}, ${today}. Aktuell ist es ${time} Uhr (${tageszeit}).

AKTUELLE PRESSEMELDUNGEN:
${articleText || '(keine Artikel geladen)'}

POLITIKER-ERWÄHNUNGEN HEUTE: ${polText || '(keine Daten)'}

Erstelle ein tagesfrisches Lagebild. Antworte NUR mit gültigem JSON exakt in diesem Format (nichts davor, nichts danach, kein Markdown-Code-Fence):

{
  "gruss": "2-3 Sätze persönliche Begrüßung an Jan. Verweist auf Wochentag, Tageszeit, Wetter-/Stimmungs-Metapher, oder ein konkretes Detail aus den Pressemeldungen. Muss sich JEDEN Tag anders anfühlen. Tonfall: leicht ironisch, politisch wach. Beispiel: 'Guten Morgen, Jan. Ein Dienstag, an dem Merz wieder erklären muss, warum er Scholz nicht ist — und die SPD feiert sich dafür. Kaffee stark, die Umfragen sind es weniger.' Keine Floskeln.",
  "schlagzeile": "EIN pointierter Satz — was treibt heute den politischen Raum für die CDU",
  "lage_prosa": "2-3 Sätze prosaisch, die Kontext zur Schlagzeile geben. Wie ein Politico-Playbook-Leader-Absatz.",
  "stimmung_score": 55,
  "bedrohung_score": 40,
  "handlungs_score": 60,
  "brennpunkte": [
    {"titel": "Prägnanter Topic-Titel 1 (3-5 Wörter)", "text": "1-2 Sätze was heute da passiert und warum es für die CDU relevant ist"},
    {"titel": "Topic 2", "text": "..."},
    {"titel": "Topic 3", "text": "..."}
  ],
  "gegner_check": [
    "Was macht SPD/Scholz-Lager heute konkret — inkl. Sprecher/Aktion wenn ersichtlich",
    "Was kommt von den Grünen",
    "Was treibt AfD/BSW"
  ],
  "zahl_des_tages": {
    "wert": "z.B. '30%' oder '48h' oder '1.247' — eine einprägsame Zahl aus den Pressemeldungen oder Politiker-Metriken",
    "kontext": "Ein Satz, was diese Zahl bedeutet"
  },
  "ausblick": "2-3 Sätze: Was kommt heute und morgen auf den politischen Tisch? Konkrete Termine, Abstimmungen, TV-Auftritte, Veröffentlichungen — wenn aus Meldungen ableitbar. Sonst: strategischer Ausblick für die Kampagnen-Woche.",
  "empfehlung": [
    "Konkrete Handlung 1 für heute — umsetzbar, nicht abstrakt (kein 'Kommunikation verbessern')",
    "Handlung 2",
    "Handlung 3"
  ]
}

REGELN:
- scores 0-100, realistisch kalibriert gegen die Meldungen
- gruss: verschieden jeden Tag, variiert nach Wochentag + Nachrichtenlage
- empfehlung: immer konkret — "Pressemitteilung zu X bis 14 Uhr", "Tweet mit Framing Y" usw.
- Wenn Artikel dünn sind, nicht erfinden — ehrlich im gruss erwähnen ("Meldungslage heute: ruhig")
- brennpunkte müssen unterschiedlich sein, keine Wiederholung`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1800,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      let raw = data.content[0].text.trim()
      // JSON aus Antwort extrahieren falls nötig
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) raw = match[0]
      const parsed = JSON.parse(raw)

      const b = { ...parsed, articles: articles.slice(0, 5), polMentions, generatedAt: Date.now(), today }
      saveBriefing(b)
      setBriefing(b)
      setStatus({ type: 'success', msg: 'Lagebild generiert.' })
    } catch (e) {
      setStatus({ type: 'error', msg: `Fehler: ${e.message}` })
    }
    setGeneratingKI(false)
  }

  async function sendEmail() {
    const validRecipients = config.recipients.filter(r => r.email?.includes('@'))
    if (!validRecipients.length) { setStatus({ type: 'error', msg: 'Keine gültigen Email-Adressen konfiguriert.' }); return }
    setSending(true)
    setStatus(null)
    try {
      const htmlBody = buildEmailHtml(briefing, articles.slice(0, 5), polMentions, today)
      const res = await fetch('/api/send-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: validRecipients.map(r => r.email), subject: `POLARIS · ${today} · ${time}`, htmlBody }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setStatus({ type: 'success', msg: `Gesendet an ${validRecipients.map(r => r.name).join(', ')}.` })
    } catch (e) {
      setStatus({ type: 'error', msg: `Sendefehler: ${e.message}` })
    }
    setSending(false)
  }

  const btnStyle = (active, color = '#CC0000') => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.5rem 0.875rem', border: 'none', borderRadius: 7,
    color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: active ? 'pointer' : 'wait',
    letterSpacing: '0.03em', background: active ? color : '#253550',
    transition: 'background 0.15s',
  })

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Morgenbriefing"
        description={`POLARIS Intelligence · ${today} · ${time} Uhr`}
        icon={Sun}
        color="#F97316"
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => { loadArticles() }} disabled={fetchingArticles} style={btnStyle(!fetchingArticles, '#253550')}>
            <RefreshCw size={12} style={{ animation: fetchingArticles ? 'spin 0.8s linear infinite' : 'none' }} />
            {fetchingArticles ? 'Lädt…' : 'Artikel aktualisieren'}
          </button>
          <button onClick={generateKI} disabled={generatingKI} style={btnStyle(!generatingKI, '#F97316')}>
            <Zap size={12} style={{ animation: generatingKI ? 'pulse 1s infinite' : 'none' }} />
            {generatingKI ? 'KI analysiert…' : 'KI-Lagebild'}
          </button>
          <button onClick={sendEmail} disabled={sending || (!briefing && articles.length === 0)} style={btnStyle(!sending && (!!briefing || articles.length > 0), '#CC0000')}>
            <Send size={12} />
            {sending ? 'Sendet…' : 'Email senden'}
          </button>
          <button onClick={() => setShowConfig(true)} style={{ ...btnStyle(true, 'transparent'), border: '1px solid #253550', color: '#94A3B8' }}>
            <Settings size={12} /> Einstellungen
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      </PageHeader>

      {/* Status */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: status.type === 'success' ? 'rgba(34,197,94,0.07)' : 'rgba(204,0,0,0.07)', border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(204,0,0,0.25)'}`, borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1rem', color: status.type === 'success' ? '#86EFAC' : '#FCA5A5', fontSize: '0.8125rem' }}>
            {status.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
            {status.msg}
            <button onClick={() => setStatus(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6 }}><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header-Zeile: Datum + Stand */}
      <div style={{ background: '#0F1C30', border: '1px solid #162230', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: fetchingArticles ? '#ffa600' : '#22C55E', boxShadow: `0 0 6px ${fetchingArticles ? '#ffa600' : '#22C55E'}` }} />
          <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
            {fetchingArticles ? 'Feeds werden geladen…' : `${articles.length} Artikel · ${Object.keys(polMentions).length} Politiker`}
          </span>
        </div>
        {briefing && (
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
            KI-Analyse: {new Date(briefing.generatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>POLARIS INTEL</span>
      </div>

      {/* Hauptlayout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', alignItems: 'start' }}>

        {/* Links: Live Meldungen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 12, padding: '1.25rem', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#52b7c1', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#52b7c1', animation: 'pulse 2s infinite' }} />
              Live Pressemeldungen
            </div>
            {fetchingArticles ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#52b7c1', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.75rem' }}>Feeds werden geladen…</p>
              </div>
            ) : articles.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748B', textAlign: 'center', padding: '2rem' }}>Keine Artikel. Feeds prüfen.</p>
            ) : (
              <div>
                {articles.slice(0, 8).map((a, i) => <ArticleRow key={i} a={a} rank={i + 1} />)}
                {articles.length > 8 && (
                  <p style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.75rem', textAlign: 'center' }}>+ {articles.length - 8} weitere Artikel</p>
                )}
              </div>
            )}
          </div>

          {/* Politiker-Radar */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#A855F7', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={10} /> Politiker-Radar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {config.politicians.map(pol => (
                <PolitikerCard key={pol} name={pol} mentions={polMentions[pol] || 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Rechts: KI-Lagebild */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#F97316', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={10} /> KI-Lagebild
            {briefing && <span style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: '#475569', fontWeight: 400, textTransform: 'none' }}>heute {new Date(briefing.generatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>}
          </div>

          {generatingKI ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: '1rem' }}>
                {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: `pulse 1.2s ease ${i * 0.15}s infinite` }} />)}
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>POLARIS analysiert aktuelle Lage…</p>
            </div>
          ) : briefing ? (
            <KILagebild data={briefing} />
          ) : (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <Zap size={40} color="#253550" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Kein Lagebild für heute</p>
              <p style={{ fontSize: '0.8125rem', color: '#334155', marginBottom: '1.5rem', lineHeight: 1.5 }}>Artikel laden lassen und dann KI-Lagebild generieren.</p>
              <button onClick={generateKI} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
                <Zap size={14} /> Jetzt analysieren
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConfigPanel config={config} onUpdate={updateConfig} onClose={() => setShowConfig(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Email HTML Builder ----
function buildEmailHtml(briefing, articles, polMentions, today) {
  const articleHtml = articles.map((a, i) =>
    `<tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:12px 0;width:24px;font-size:11px;font-weight:900;color:#cc0000;vertical-align:top">${i + 1}</td>
      <td style="padding:12px 0 12px 12px">
        <a href="${a.link || '#'}" style="color:#1a2942;font-weight:700;text-decoration:none;font-size:14px;line-height:1.4">${a.title}</a>
        <div style="color:#64748b;font-size:11px;margin-top:4px">${a.source || a.feedLabel || ''}</div>
      </td>
    </tr>`
  ).join('')

  const scoreBar = (val, color) => `<div style="height:6px;background:#e2e8f0;border-radius:3px;margin-top:4px"><div style="width:${Math.min(100, val)}%;height:100%;background:${color};border-radius:3px"></div></div>`

  const esc = s => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  const brennpunkteHtml = (briefing?.brennpunkte || []).map((b, i) => `
    <div style="padding:10px 0;border-bottom:${i < (briefing.brennpunkte.length - 1) ? '1px solid #e2e8f0' : 'none'}">
      <div style="font-size:11px;font-weight:900;color:#52b7c1;letter-spacing:0.06em;margin-bottom:4px">0${i + 1} · ${esc(b.titel || b)}</div>
      ${b.text ? `<p style="font-size:13px;color:#334155;line-height:1.55;margin:0">${esc(b.text)}</p>` : ''}
    </div>`).join('')
  const gegnerHtml = (briefing?.gegner_check || []).map(g => `<p style="font-size:13px;color:#334155;margin:0 0 6px;line-height:1.55">• ${esc(g)}</p>`).join('')

  const kiHtml = briefing ? `
    <div style="margin-bottom:16px">
      ${briefing.gruss ? `<div style="border-left:3px solid #f97316;padding:6px 0 6px 14px;margin-bottom:16px"><p style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:#1a2942;line-height:1.65;margin:0">${esc(briefing.gruss)}</p></div>` : ''}
      ${briefing.schlagzeile ? `<div style="background:#fff5f5;border-left:3px solid #cc0000;border-radius:4px;padding:12px 16px;margin-bottom:16px"><div style="font-size:10px;font-weight:800;color:#cc0000;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">LAGE DES TAGES</div><p style="font-size:15px;font-weight:700;color:#1a2942;line-height:1.5;margin:0 0 6px">${esc(briefing.schlagzeile)}</p>${briefing.lage_prosa ? `<p style="font-size:13px;color:#475569;line-height:1.6;margin:0">${esc(briefing.lage_prosa)}</p>` : ''}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
        <div style="background:#f8fafc;border-radius:6px;padding:10px 12px"><div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">CDU-Stimmung</div><div style="font-size:16px;font-weight:900;color:#1a2942">${briefing.stimmung_score || '—'}<span style="font-size:11px;color:#64748b">/100</span></div>${scoreBar(briefing.stimmung_score, '#22c55e')}</div>
        <div style="background:#f8fafc;border-radius:6px;padding:10px 12px"><div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Bedrohung</div><div style="font-size:16px;font-weight:900;color:#1a2942">${briefing.bedrohung_score || '—'}<span style="font-size:11px;color:#64748b">/100</span></div>${scoreBar(briefing.bedrohung_score, '#cc0000')}</div>
        <div style="background:#f8fafc;border-radius:6px;padding:10px 12px"><div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Handlungsdruck</div><div style="font-size:16px;font-weight:900;color:#1a2942">${briefing.handlungs_score || '—'}<span style="font-size:11px;color:#64748b">/100</span></div>${scoreBar(briefing.handlungs_score, '#f97316')}</div>
      </div>
      ${brennpunkteHtml ? `<div style="background:#f8fafc;border-radius:6px;padding:14px 18px;margin-bottom:16px"><div style="font-size:10px;font-weight:800;color:#52b7c1;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">DREI BRENNPUNKTE</div>${brennpunkteHtml}</div>` : ''}
      ${gegnerHtml ? `<div style="background:#fff7ed;border-radius:6px;padding:12px 16px;margin-bottom:16px"><div style="font-size:10px;font-weight:800;color:#ffa600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">GEGNER IM BLICK</div>${gegnerHtml}</div>` : ''}
      ${briefing.zahl_des_tages || briefing.ausblick ? `<div style="display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin-bottom:16px">
        ${briefing.zahl_des_tages ? `<div style="background:linear-gradient(135deg,#fff5f5,#ffffff);border:1px solid #fecaca;border-radius:6px;padding:12px 14px"><div style="font-size:9px;font-weight:800;color:#cc0000;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">ZAHL DES TAGES</div><div style="font-size:28px;font-weight:900;color:#1a2942;line-height:1;margin-bottom:4px">${esc(briefing.zahl_des_tages.wert)}</div><p style="font-size:11px;color:#475569;margin:0;line-height:1.4">${esc(briefing.zahl_des_tages.kontext)}</p></div>` : '<div></div>'}
        ${briefing.ausblick ? `<div style="background:#f0fdfa;border:1px solid #a7f3d0;border-radius:6px;padding:12px 14px"><div style="font-size:9px;font-weight:800;color:#52b7c1;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">WAS HEUTE NOCH KOMMT</div><p style="font-size:12px;color:#1a2942;margin:0;line-height:1.55">${esc(briefing.ausblick)}</p></div>` : '<div></div>'}
      </div>` : ''}
      ${briefing.empfehlung?.length ? `<div style="background:#fff7ed;border-radius:6px;padding:14px 18px;margin-bottom:16px"><div style="font-size:10px;font-weight:800;color:#f97316;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">EMPFEHLUNG DES TAGES</div>${briefing.empfehlung.map((e, i) => `<p style="font-size:13px;color:#1a2942;margin:0 0 8px;line-height:1.5"><strong style="color:#cc0000">${i + 1}.</strong> ${esc(e)}</p>`).join('')}</div>` : ''}
    </div>` : '<p style="color:#64748b;font-size:13px">Kein KI-Lagebild generiert.</p>'

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:620px;margin:0 auto;padding:20px 16px">
  <div style="background:linear-gradient(135deg,#0f1c30 0%,#1a2942 100%);border-radius:12px;padding:24px 28px;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:42px;height:42px;background:#cc0000;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">☀️</div>
      <div>
        <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:-0.02em">POLARIS Morgenbriefing</div>
        <div style="color:#475569;font-size:12px;margin-top:2px">${today} · bildbrauerei Heidelberg</div>
      </div>
    </div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px 28px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <div style="font-size:10px;font-weight:800;color:#cc0000;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px">KI-LAGEBILD</div>
    ${kiHtml}
  </div>
  ${articles.length > 0 ? `<div style="background:#fff;border-radius:12px;padding:24px 28px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <div style="font-size:10px;font-weight:800;color:#cc0000;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px">TOP PRESSEMELDUNGEN</div>
    <table style="width:100%;border-collapse:collapse">${articleHtml}</table>
  </div>` : ''}
  ${Object.keys(polMentions).some(k => polMentions[k] > 0) ? `<div style="background:#fff;border-radius:12px;padding:24px 28px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <div style="font-size:10px;font-weight:800;color:#cc0000;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px">POLITIKER-RADAR</div>
    ${Object.entries(polMentions).map(([n, c]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9"><span style="font-size:13px;color:#1a2942;font-weight:600">${n}</span><span style="font-size:13px;font-weight:900;color:${c > 5 ? '#cc0000' : '#64748b'}">${c} Meldungen</span></div>`).join('')}
  </div>` : ''}
  <div style="text-align:center;color:#94a3b8;font-size:11px;padding:12px 0">POLARIS Intelligence · bildbrauerei GmbH · ${today}</div>
</div>
</body></html>`
}
