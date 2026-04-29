import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import { supabase } from '../lib/supabase'
import { isUrgent } from '../lib/utils'
import { useKampagne } from '../lib/kampagneContext'
import { useScope, filterArticlesByScope, getScopeLabel } from '../lib/scopeContext'
import { setHandoff } from '../lib/handoff'
import ScopeBar from '../components/ScopeBar'
import {
  Newspaper, RefreshCw, ExternalLink, AlertTriangle, Clock,
  User, Plus, X, ChevronDown, ChevronUp, Star, Search, Send
} from 'lucide-react'

const VIP_STORAGE_KEY = 'polaris_vip_liste'
const DEFAULT_VIPS = [
  'Friedrich Merz','Thorsten Frei','Nina Warken','Gunther Krichbaum',
  'Roderich Kiesewetter','Andreas Jung','Annegret Kramp-Karrenbauer',
  'Hendrik Wüst','Daniel Günther','Peter Hauk','Paul Ziemiak',
  'Serap Güler','Christina Stumpp','Ronja Kemmer','Wiebke Winter',
  'Yvonne Magwas','Karl-Josef Laumann','Volker Bouffier','Silvia Breher',
  'Hermann Färber','Manuel Hagel','Tobias Vogt','Thomas Strobl',
  'Nicole Razavi','Marion Gentges','Nicole Hoffmeister-Kraut','Winfried Mack',
  'Bastian Schneider','Alexander Becker','Michael Preusch','Michael Möslang',
  'Clemens Baumgärtner','Jürgen Roth','Alexander Föhr','Karl Rombach',
  'Tobias Wald','Claudia Martin','Claus Paal',
]

function loadVips() {
  try {
    const stored = localStorage.getItem(VIP_STORAGE_KEY)
    const saved = stored ? JSON.parse(stored) : []
    // Immer mit DEFAULT_VIPS mergen — neue Namen kommen automatisch dazu
    const merged = [...new Set([...DEFAULT_VIPS, ...saved])]
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(DEFAULT_VIPS))
    return DEFAULT_VIPS
  }
}

function saveVips(vips) {
  localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(vips))
}

function sentimentStyle(s) {
  if (s === 'positiv') return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }
  if (s === 'negativ') return { color: '#ff9999', bg: 'rgba(191,17,27,0.1)', border: 'rgba(191,17,27,0.25)' }
  return { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.5)' }
}

function cduWirkungStyle(w) {
  if (w === 'positiv') return { color: '#52b7c1', bg: 'rgba(82,183,193,0.1)', border: 'rgba(82,183,193,0.3)', label: 'CDU ↑' }
  if (w === 'negativ') return { color: '#ff6b6b', bg: 'rgba(191,17,27,0.12)', border: 'rgba(191,17,27,0.3)', label: 'CDU ↓' }
  return { color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: 'CDU →' }
}

function formatDate(d, full = false) {
  if (!d) return '—'
  try {
    if (full) {
      return new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    const m = (Date.now() - new Date(d)) / 60000
    if (m < 60) return `${Math.round(m)}m`
    if (m < 1440) return `${Math.round(m / 60)}h`
    return `${Math.round(m / 1440)}T`
  } catch { return '—' }
}

function ArticleCard({ a, i, showFullDate = false, onReact }) {
  const ss = sentimentStyle(a.sentiment)
  const cw = cduWirkungStyle(a.cdu_wirkung)
  const urgent = isUrgent(a)
  const [hover, setHover] = useState(false)

  const baseBg = urgent ? 'rgba(191,17,27,0.05)' : '#162230'
  const hoverBg = urgent ? 'rgba(191,17,27,0.10)' : 'rgba(82,183,193,0.05)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.015, 0.25), duration: 0.25 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
      style={{
        background: hover ? hoverBg : baseBg,
        border: `1px solid ${urgent ? 'rgba(191,17,27,0.25)' : 'rgba(82,183,193,0.08)'}`,
        borderLeft: `3px solid ${urgent ? '#bf111b' : a.cdu_wirkung === 'positiv' ? '#52b7c1' : a.cdu_wirkung === 'negativ' ? '#bf111b' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '0.875rem 1rem',
        cursor: a.url ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            {urgent && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.5rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(191,17,27,0.15)', color: '#ff6b6b', border: '1px solid rgba(191,17,27,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <AlertTriangle size={8} /> Dringend
              </span>
            )}
            {a.sentiment && (
              <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {a.sentiment}
              </span>
            )}
            {a.cdu_wirkung && (
              <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, background: cw.bg, color: cw.color, border: `1px solid ${cw.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {cw.label}
              </span>
            )}
            {a.handlungsbedarf && !urgent && (
              <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(255,166,0,0.08)', color: '#ffa600', border: '1px solid rgba(255,166,0,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚡ Handlungsbedarf
              </span>
            )}
          </div>
          {/* Title */}
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: '0.25rem' }}>{a.titel}</p>
          {/* Summary */}
          {a.zusammenfassung && (
            <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '0.25rem' }}>
              {a.zusammenfassung}
            </p>
          )}
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.625rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.625rem', color: showFullDate ? '#ffa600' : 'rgba(255,255,255,0.4)' }}>
              <Clock size={9} />{formatDate(a.datum, showFullDate)}
            </span>
            {a.suchbegriff && (
              <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>{a.suchbegriff}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: 'rgba(255,255,255,0.12)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}>
              <ExternalLink size={13} />
            </a>
          )}
          {onReact && (
            <button onClick={e => { e.stopPropagation(); onReact(a) }}
              title="In Social Media Fabrik reagieren"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.625rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Send size={9} /> Reagieren
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// VIP Sidebar — localStorage + Mehrfachauswahl
function VipSidebar({ selectedVips, onToggleVip, onClearVips }) {
  const [vips, setVips] = useState(() => loadVips().sort((a, b) => a.localeCompare(b)))
  const [input, setInput] = useState('')

  function addVip() {
    const name = input.trim()
    if (!name || vips.includes(name)) return
    const next = [...vips, name].sort((a, b) => a.localeCompare(b))
    setVips(next); saveVips(next); setInput('')
    // Neu hinzugefügte Person automatisch aktivieren
    onToggleVip(name)
  }

  function removeVip(name) {
    const next = vips.filter(v => v !== name)
    setVips(next); saveVips(next)
    if (selectedVips.includes(name)) onToggleVip(name)
  }

  return (
    <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Star size={11} color="#ffa600" />
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase' }}>VIP-Liste</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.6)' }}>{vips.length}</span>
      </div>

      <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.375rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addVip()}
          placeholder="Name + Enter"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.375rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,166,0,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button onClick={addVip} disabled={!input.trim()} style={{ width: 28, height: 28, background: input.trim() ? '#ffa600' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
          <Plus size={12} color="#fff" />
        </button>
      </div>

      {selectedVips.length > 0 && (
        <div style={{ padding: '0.375rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,166,0,0.04)' }}>
          <span style={{ fontSize: '0.625rem', color: '#ffa600', fontWeight: 700 }}>{selectedVips.length} ausgewählt</span>
          <button onClick={onClearVips} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.625rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
            leeren
          </button>
        </div>
      )}

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {vips.map(name => {
          const active = selectedVips.includes(name)
          return (
            <div key={name}
              onClick={() => onToggleVip(name)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', background: active ? 'rgba(255,166,0,0.08)' : 'transparent', borderLeft: `2px solid ${active ? '#ffa600' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <input type="checkbox" checked={active} readOnly
                style={{ accentColor: '#ffa600', cursor: 'pointer', flexShrink: 0, width: 12, height: 12 }} />
              <User size={10} color={active ? '#ffa600' : 'rgba(255,255,255,0.7)'} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.8125rem', color: active ? '#fff' : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <button onClick={e => { e.stopPropagation(); removeVip(name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.12)', display: 'flex', transition: 'color 0.1s', padding: 2 }}
                onMouseEnter={e => e.currentTarget.style.color = '#bf111b'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}>
                <X size={10} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Monitoring Listen Sidebar
function MonitoringListenSidebar({ selectedListe, onSelectListe }) {
  const [listen, setListen] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [beschreibungInput, setBeschreibungInput] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('monitoring_listen').select('*').order('erstellt_am', { ascending: false }).then(({ data }) => {
      setListen(data || [])
      setLoading(false)
    })
  }, [])

  async function addListe() {
    const name = nameInput.trim()
    const beschreibung = beschreibungInput.trim()
    if (!name || !beschreibung) return
    const { data } = await supabase.from('monitoring_listen').insert({ name, beschreibung, aktiv: true }).select().single()
    if (data) setListen(l => [data, ...l])
    setNameInput(''); setBeschreibungInput(''); setOpen(false)
  }

  async function removeListe(id, name) {
    await supabase.from('monitoring_listen').delete().eq('id', id)
    setListen(l => l.filter(x => x.id !== id))
    if (selectedListe === name) onSelectListe(null)
  }

  return (
    <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '0.75rem 1rem', borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>Monitoring Listen</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.6)', marginRight: '0.25rem' }}>{listen.length}</span>
        {open ? <ChevronUp size={11} color="rgba(255,255,255,0.7)" /> : <ChevronDown size={11} color="rgba(255,255,255,0.7)" />}
      </div>

      {open && (
        <>
          {/* New list form */}
          <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Name (z.B. VS-Schwenningen)"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.375rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <input
              value={beschreibungInput}
              onChange={e => setBeschreibungInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addListe()}
              placeholder="Suche (z.B. Politik Villingen-Schwenningen)"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.375rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button onClick={addListe} disabled={!nameInput.trim() || !beschreibungInput.trim()} style={{
              padding: '0.375rem 0.5rem', background: nameInput.trim() && beschreibungInput.trim() ? '#A855F7' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
              cursor: nameInput.trim() && beschreibungInput.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}>
              + Liste erstellen
            </button>
          </div>

          {/* List items */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Laden…</div>
            ) : listen.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Noch keine Listen</div>
            ) : listen.map(l => (
              <div key={l.id}
                onClick={() => onSelectListe(selectedListe === l.name ? null : l.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: selectedListe === l.name ? 'rgba(168,85,247,0.08)' : 'transparent',
                  borderLeft: `2px solid ${selectedListe === l.name ? '#A855F7' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (selectedListe !== l.name) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (selectedListe !== l.name) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', color: selectedListe === l.name ? '#fff' : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</p>
                  <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.beschreibung}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeListe(l.id, l.name) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.12)', display: 'flex', transition: 'color 0.1s', padding: 2, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#bf111b'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Google News für eine Person (letzten 30 Tage)
async function fetchPersonNews(name) {
  try {
    const query = `"${name}" when:30d`
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`
    const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const xml = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = doc.querySelectorAll('item')
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const results = []
    items.forEach(item => {
      const titel = item.querySelector('title')?.textContent?.trim()
      const url = item.querySelector('link')?.textContent?.trim()
      const pubDate = item.querySelector('pubDate')?.textContent?.trim()
      const quelle = item.querySelector('source')?.textContent?.trim()
      if (!titel || !url) return
      const dateMs = pubDate ? new Date(pubDate).getTime() : Date.now()
      if (dateMs < monthAgo) return
      results.push({
        id: `${name}::${url}`, titel, quelle: quelle || 'Google News', url,
        datum: new Date(dateMs).toISOString(),
        suchbegriff: name,
        sentiment: null, cdu_wirkung: null, handlungsbedarf: false, zusammenfassung: null,
      })
    })
    return results
  } catch { return [] }
}

// Parallel für mehrere VIPs, dedupliziert nach URL, sortiert nach Datum
async function fetchVipNewsMulti(names) {
  if (!names?.length) return []
  const batches = await Promise.all(names.map(n => fetchPersonNews(n)))
  const all = batches.flat()
  const seen = new Set()
  const deduped = []
  for (const a of all) {
    const key = a.url
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(a)
  }
  return deduped.sort((a, b) => new Date(b.datum) - new Date(a.datum))
}

const PAGE_SIZE = 20

export default function MedienMonitor() {
  const navigate = useNavigate()
  const { aktiveKampagne } = useKampagne()
  const { scope } = useScope()
  const [searchText, setSearchText] = useState('')
  const [selectedVips, setSelectedVips] = useState([])
  const [selectedListe, setSelectedListe] = useState(null)
  const [vipNews, setVipNews] = useState([])
  const [vipLoading, setVipLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncLog, setSyncLog] = useState(null)
  const [page, setPage] = useState(1)
  const [quickFilter, setQuickFilter] = useState(null) // 'urgent' | 'heute' | 'cdu_neg' | 'cdu_pos' | null
  const lastRun = getLastRun()

  const vipMode = selectedVips.length > 0

  function toggleVip(name) {
    setSelectedListe(null)
    setSelectedVips(prev => prev.includes(name) ? prev.filter(v => v !== name) : [...prev, name])
  }
  function clearVips() { setSelectedVips([]) }

  useEffect(() => {
    if (!vipMode) { setVipNews([]); return }
    setVipLoading(true)
    fetchVipNewsMulti(selectedVips).then(results => { setVipNews(results); setVipLoading(false) })
  }, [selectedVips.join('|'), vipMode])

  const { articles, loading, count, refetch } = useArticles({
    monitoringListe: selectedListe || undefined,
    search: vipMode ? undefined : (searchText || undefined),
    limit: 500,
  })

  const filteredVipNews = searchText
    ? vipNews.filter(a => a.titel?.toLowerCase().includes(searchText.toLowerCase()))
    : vipNews

  // Quick filter anwenden
  function applyQuickFilter(list) {
    if (!quickFilter) return list
    const today = new Date().toDateString()
    if (quickFilter === 'urgent') return list.filter(a => isUrgent(a))
    if (quickFilter === 'heute') return list.filter(a => a.datum && new Date(a.datum).toDateString() === today)
    if (quickFilter === 'cdu_neg') return list.filter(a => a.cdu_wirkung === 'negativ')
    if (quickFilter === 'cdu_pos') return list.filter(a => a.cdu_wirkung === 'positiv')
    return list
  }

  const displayArticlesRaw = vipMode ? filteredVipNews : articles
  const displayScoped = useMemo(() => filterArticlesByScope(displayArticlesRaw, scope, aktiveKampagne), [displayArticlesRaw, scope, aktiveKampagne?.id])
  const displayArticles = applyQuickFilter(displayScoped)

  function reactToArticle(a) {
    setHandoff('social-media-fabrik', {
      thema: `Reaktion auf: ${a.titel || ''}`.trim(),
      kontext: `Artikel: "${a.titel || ''}"\nQuelle: ${a.quelle || ''}\n${a.zusammenfassung ? 'Inhalt: ' + a.zusammenfassung : ''}\n${a.url ? 'Link: ' + a.url : ''}`.trim(),
      sourceLabel: 'Medien-Monitor',
    })
    navigate('/social-media-fabrik')
  }
  const displayLoading = vipMode ? vipLoading : loading
  const displayCount = displayArticles.length

  const totalPages = Math.ceil(displayArticles.length / PAGE_SIZE)
  const pagedArticles = displayArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filter changes
  useEffect(() => { setPage(1) }, [selectedVips.join('|'), selectedListe, searchText, quickFilter])

  async function handleSync() {
    setSyncing(true); setSyncLog(null)
    const result = await runFeedSync(true)
    setSyncLog(result); setSyncing(false); refetch()
  }

  const urgentArticles = articles.filter(a => isUrgent(a))
  const todayCount = articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString()).length

  const activeFilter = vipMode
    ? `VIPs: ${selectedVips.join(', ')} · letzte 30 Tage`
    : selectedListe
      ? `Liste: ${selectedListe}`
      : 'Alle Artikel'

  return (
    <div style={{ width: '100%' }}>
      <ScopeBar />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Medien-Monitor
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>
            {activeFilter}
            {scope !== 'bundesweit' && <span style={{ marginLeft: '0.5rem', color: '#52b7c1', fontWeight: 700 }}>· Scope: {getScopeLabel(scope, aktiveKampagne)}</span>}
            {quickFilter && <span style={{ marginLeft: '0.5rem', color: quickFilter === 'urgent' ? '#ff6b6b' : quickFilter === 'heute' ? '#ffa600' : quickFilter === 'cdu_neg' ? '#A855F7' : '#52b7c1', fontWeight: 700 }}>· Filter aktiv</span>}
            {' · '}{displayCount} Artikel
            {lastRun && <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Sync: {lastRun.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.125rem',
          background: syncing ? 'rgba(255,255,255,0.05)' : '#bf111b',
          border: `1px solid ${syncing ? 'rgba(255,255,255,0.5)' : 'transparent'}`,
          borderRadius: 10, color: '#fff', fontSize: '0.8125rem',
          fontWeight: 700, cursor: syncing ? 'wait' : 'pointer',
          boxShadow: syncing ? 'none' : '0 4px 16px rgba(191,17,27,0.3)',
          transition: 'all 0.15s', flexShrink: 0,
        }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          {syncing ? 'Sync läuft…' : 'Feeds synchronisieren'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>

      {/* Stats — klickbar als Quick-Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Artikel gesamt', value: count, color: '#52b7c1', key: null },
          { label: 'Dringend', value: urgentArticles.length, color: '#bf111b', key: 'urgent' },
          { label: 'Heute', value: todayCount, color: '#ffa600', key: 'heute' },
          { label: 'CDU negativ', value: articles.filter(a => a.cdu_wirkung === 'negativ').length, color: '#A855F7', key: 'cdu_neg' },
        ].map(s => {
          const active = quickFilter === s.key
          return (
            <div key={s.label}
              onClick={() => setQuickFilter(active ? null : s.key)}
              style={{
                background: active ? `rgba(${s.color === '#52b7c1' ? '82,183,193' : s.color === '#bf111b' ? '191,17,27' : s.color === '#ffa600' ? '255,166,0' : '168,85,247'},0.12)` : '#162230',
                border: `1px solid ${active ? s.color : 'rgba(82,183,193,0.12)'}`,
                borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '0.875rem 1rem',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = s.color + '66' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(82,183,193,0.12)' }}
            >
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: active ? s.color : 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {s.label}
                {active && <span style={{ fontSize: '0.5rem', color: s.color, fontWeight: 900 }}>✕</span>}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: active ? s.color : '#fff', letterSpacing: '-0.03em' }}>{loading ? '—' : s.value}</div>
            </div>
          )
        })}
      </div>

      {/* Sync Log */}
      {syncLog && (
        <div style={{ background: '#162230', border: `1px solid ${syncLog.success ? 'rgba(34,197,94,0.3)' : 'rgba(191,17,27,0.3)'}`, borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: syncLog.success ? '#22C55E' : '#ff9999', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {syncLog.success ? '✓ Sync abgeschlossen' : '✗ Sync mit Fehlern'}
          </p>
          {syncLog.log?.map((l, i) => <p key={i} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{l}</p>)}
        </div>
      )}

      {/* Main: Sidebar + Articles */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'start' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <VipSidebar selectedVips={selectedVips} onToggleVip={toggleVip} onClearVips={clearVips} />
          <MonitoringListenSidebar selectedListe={selectedListe} onSelectListe={l => { setSelectedListe(l); setSelectedVips([]) }} />
        </div>

        {/* RIGHT: Articles */}
        <div>
          {/* Suchfeld */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 10, padding: '0.5rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Search size={13} color="rgba(255,255,255,0.65)" style={{ flexShrink: 0 }} />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Artikel durchsuchen…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 2, transition: 'color 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Urgent banner */}
          {urgentArticles.length > 0 && (
            <div style={{ background: 'rgba(191,17,27,0.06)', border: '1px solid rgba(191,17,27,0.25)', borderRadius: 8, padding: '0.625rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <AlertTriangle size={14} color="#bf111b" />
              <span style={{ fontSize: '0.8125rem', color: '#ff9999', fontWeight: 600 }}>
                {urgentArticles.length} Artikel mit Handlungsbedarf
              </span>
            </div>
          )}

          {/* Articles */}
          {displayLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              {vipMode ? `Suche Artikel zu ${selectedVips.length > 1 ? `${selectedVips.length} Personen` : selectedVips[0]}…` : 'Wird geladen…'}
            </div>
          ) : displayArticles.length === 0 ? (
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 10, padding: '4rem', textAlign: 'center' }}>
              <Newspaper size={36} color="rgba(82,183,193,0.12)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                {vipMode ? `Keine Artikel in den letzten 30 Tagen zu ${selectedVips.join(', ')}` : selectedListe ? `Keine Artikel für Liste "${selectedListe}"` : 'Keine Artikel. Starte den Feed-Sync.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {pagedArticles.map((a, i) => <ArticleCard key={a.id} a={a} i={i} showFullDate={vipMode} onReact={reactToArticle} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0.75rem 1rem', background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    Seite {page} von {totalPages} · {displayArticles.length} Artikel
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: '0.375rem 0.75rem', background: page === 1 ? 'rgba(255,255,255,0.04)' : 'rgba(82,183,193,0.1)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 7, color: page === 1 ? 'rgba(255,255,255,0.6)' : '#52b7c1', fontSize: '0.75rem', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ← Zurück
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                      return (
                        <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, background: page === p ? '#52b7c1' : 'rgba(255,255,255,0.04)', border: `1px solid ${page === p ? '#52b7c1' : 'rgba(255,255,255,0.5)'}`, borderRadius: 7, color: page === p ? '#0F1C30' : 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                          {p}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{ padding: '0.375rem 0.75rem', background: page === totalPages ? 'rgba(255,255,255,0.04)' : 'rgba(82,183,193,0.1)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 7, color: page === totalPages ? 'rgba(255,255,255,0.6)' : '#52b7c1', fontSize: '0.75rem', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Weiter →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
