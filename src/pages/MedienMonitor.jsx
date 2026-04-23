import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import { supabase } from '../lib/supabase'
import {
  Newspaper, RefreshCw, ExternalLink, AlertTriangle, Clock,
  User, Plus, X, ChevronDown, ChevronUp, Star
} from 'lucide-react'

function sentimentStyle(s) {
  if (s === 'positiv') return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }
  if (s === 'negativ') return { color: '#ff9999', bg: 'rgba(191,17,27,0.1)', border: 'rgba(191,17,27,0.25)' }
  return { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' }
}

function cduWirkungStyle(w) {
  if (w === 'positiv') return { color: '#52b7c1', bg: 'rgba(82,183,193,0.1)', border: 'rgba(82,183,193,0.3)', label: 'CDU ↑' }
  if (w === 'negativ') return { color: '#ff6b6b', bg: 'rgba(191,17,27,0.12)', border: 'rgba(191,17,27,0.3)', label: 'CDU ↓' }
  return { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: 'CDU →' }
}

function formatDate(d) {
  if (!d) return '—'
  try {
    const m = (Date.now() - new Date(d)) / 60000
    if (m < 60) return `${Math.round(m)}m`
    if (m < 1440) return `${Math.round(m / 60)}h`
    return `${Math.round(m / 1440)}T`
  } catch { return '—' }
}

function ArticleCard({ a, i }) {
  const ss = sentimentStyle(a.sentiment)
  const cw = cduWirkungStyle(a.cdu_wirkung)
  const isUrgent = a.handlungsbedarf && a.sentiment === 'negativ'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.015, 0.25) }}
      onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
      style={{
        background: isUrgent ? 'rgba(191,17,27,0.05)' : '#162230',
        border: `1px solid ${isUrgent ? 'rgba(191,17,27,0.25)' : 'rgba(82,183,193,0.08)'}`,
        borderLeft: `3px solid ${isUrgent ? '#bf111b' : a.cdu_wirkung === 'positiv' ? '#52b7c1' : a.cdu_wirkung === 'negativ' ? '#bf111b' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '0.875rem 1rem',
        cursor: a.url ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      whileHover={{ background: isUrgent ? 'rgba(191,17,27,0.08)' : 'rgba(82,183,193,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            {isUrgent && (
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
            {a.handlungsbedarf && !isUrgent && (
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)' }}>
              <Clock size={9} />{formatDate(a.datum)}
            </span>
            {a.suchbegriff && (
              <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>{a.suchbegriff}</span>
            )}
          </div>
        </div>
        {a.url && (
          <a href={a.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: 'rgba(255,255,255,0.12)', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// VIP Sidebar
function VipSidebar({ selectedVip, onSelectVip }) {
  const [vips, setVips] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('vip_liste').select('*').order('name').then(({ data }) => {
      setVips(data || [])
      setLoading(false)
    })
  }, [])

  async function addVip() {
    const name = input.trim()
    if (!name || vips.find(v => v.name === name)) return
    const { data } = await supabase.from('vip_liste').insert({ name }).select().single()
    if (data) setVips(v => [...v, data].sort((a, b) => a.name.localeCompare(b.name)))
    setInput('')
  }

  async function removeVip(id, name) {
    await supabase.from('vip_liste').delete().eq('id', id)
    setVips(v => v.filter(x => x.id !== id))
    if (selectedVip === name) onSelectVip(null)
  }

  return (
    <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Star size={11} color="#ffa600" />
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase' }}>VIP-Liste</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)' }}>{vips.length}</span>
      </div>

      {/* Add input */}
      <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.375rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addVip()}
          placeholder="Name + Enter"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '0.375rem 0.5rem', color: '#fff', fontSize: '0.75rem',
            outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,166,0,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button onClick={addVip} disabled={!input.trim()} style={{
          width: 28, height: 28, background: input.trim() ? '#ffa600' : 'rgba(255,255,255,0.05)',
          border: 'none', borderRadius: 6, cursor: input.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.15s',
        }}>
          <Plus size={12} color="#fff" />
        </button>
      </div>

      {/* VIP list */}
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Laden…</div>
        ) : vips.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Noch keine VIPs</div>
        ) : vips.map(v => (
          <div key={v.id}
            onClick={() => onSelectVip(selectedVip === v.name ? null : v.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: selectedVip === v.name ? 'rgba(255,166,0,0.08)' : 'transparent',
              borderLeft: `2px solid ${selectedVip === v.name ? '#ffa600' : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (selectedVip !== v.name) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { if (selectedVip !== v.name) e.currentTarget.style.background = 'transparent' }}
          >
            <User size={10} color={selectedVip === v.name ? '#ffa600' : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.8125rem', color: selectedVip === v.name ? '#fff' : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeVip(v.id, v.name) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.12)', display: 'flex', transition: 'color 0.1s', padding: 2 }}
              onMouseEnter={e => e.currentTarget.style.color = '#bf111b'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}
            >
              <X size={10} />
            </button>
          </div>
        ))}
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
        <span style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', marginRight: '0.25rem' }}>{listen.length}</span>
        {open ? <ChevronUp size={11} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={11} color="rgba(255,255,255,0.3)" />}
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
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Laden…</div>
            ) : listen.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Noch keine Listen</div>
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
                  <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.beschreibung}</p>
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

export default function MedienMonitor() {
  const [sentiment, setSentiment] = useState('')
  const [cduWirkung, setCduWirkung] = useState('')
  const [nurHandlung, setNurHandlung] = useState(false)
  const [selectedVip, setSelectedVip] = useState(null)
  const [selectedListe, setSelectedListe] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncLog, setSyncLog] = useState(null)
  const lastRun = getLastRun()

  const { articles, loading, count, refetch } = useArticles({
    sentiment: sentiment || undefined,
    cduWirkung: cduWirkung || undefined,
    handlungsbedarf: nurHandlung || undefined,
    suchbegriff: selectedVip || undefined,
    monitoringListe: selectedListe || undefined,
    limit: 200,
  })

  async function handleSync() {
    setSyncing(true); setSyncLog(null)
    const result = await runFeedSync(true)
    setSyncLog(result); setSyncing(false); refetch()
  }

  const urgent = articles.filter(a => a.handlungsbedarf && a.sentiment === 'negativ')
  const todayCount = articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString()).length

  const activeFilter = selectedVip
    ? `VIP: ${selectedVip}`
    : selectedListe
      ? `Liste: ${selectedListe}`
      : 'Alle Artikel'

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Medien-Monitor
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)' }}>
            {activeFilter} · {count} Artikel
            {lastRun && <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Sync: {lastRun.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.125rem',
          background: syncing ? 'rgba(255,255,255,0.05)' : '#bf111b',
          border: `1px solid ${syncing ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Artikel gesamt', value: count, color: '#52b7c1' },
          { label: 'Dringend', value: urgent.length, color: '#bf111b' },
          { label: 'Heute', value: todayCount, color: '#ffa600' },
          { label: 'CDU negativ', value: articles.filter(a => a.cdu_wirkung === 'negativ').length, color: '#A855F7' },
        ].map(s => (
          <div key={s.label} style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.03em' }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
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
          <VipSidebar selectedVip={selectedVip} onSelectVip={v => { setSelectedVip(v); setSelectedListe(null) }} />
          <MonitoringListenSidebar selectedListe={selectedListe} onSelectListe={l => { setSelectedListe(l); setSelectedVip(null) }} />
        </div>

        {/* RIGHT: Articles */}
        <div>
          {/* Filter bar */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 10, padding: '0.625rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              {
                val: sentiment, set: v => setSentiment(v), opts: [
                  { value: '', label: 'Alle Sentiments' },
                  { value: 'positiv', label: '↑ Positiv' },
                  { value: 'neutral', label: '→ Neutral' },
                  { value: 'negativ', label: '↓ Negativ' },
                ]
              },
              {
                val: cduWirkung, set: v => setCduWirkung(v), opts: [
                  { value: '', label: 'CDU-Wirkung: Alle' },
                  { value: 'positiv', label: 'CDU ↑ Positiv' },
                  { value: 'neutral', label: 'CDU → Neutral' },
                  { value: 'negativ', label: 'CDU ↓ Negativ' },
                ]
              },
            ].map((f, i) => (
              <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{
                background: '#0a0f1a', border: '1px solid rgba(82,183,193,0.18)', color: '#fff',
                padding: '0.3rem 0.625rem', borderRadius: 7, fontSize: '0.75rem',
                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}>
                {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              <input type="checkbox" checked={nurHandlung} onChange={e => setNurHandlung(e.target.checked)} style={{ accentColor: '#52b7c1' }} />
              Nur Handlungsbedarf
            </label>
            {(selectedVip || selectedListe || sentiment || cduWirkung || nurHandlung) && (
              <button onClick={() => { setSelectedVip(null); setSelectedListe(null); setSentiment(''); setCduWirkung(''); setNurHandlung(false) }}
                style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.35)', fontSize: '0.6875rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Urgent banner */}
          {urgent.length > 0 && !nurHandlung && (
            <div style={{ background: 'rgba(191,17,27,0.06)', border: '1px solid rgba(191,17,27,0.25)', borderRadius: 8, padding: '0.625rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <AlertTriangle size={14} color="#bf111b" />
              <span style={{ fontSize: '0.8125rem', color: '#ff9999', fontWeight: 600 }}>
                {urgent.length} Artikel mit Handlungsbedarf
              </span>
            </div>
          )}

          {/* Articles */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>Wird geladen…</div>
          ) : articles.length === 0 ? (
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.1)', borderRadius: 10, padding: '4rem', textAlign: 'center' }}>
              <Newspaper size={36} color="rgba(82,183,193,0.12)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>
                {selectedVip ? `Keine Artikel für ${selectedVip}` : selectedListe ? `Keine Artikel für Liste "${selectedListe}"` : 'Keine Artikel. Starte den Feed-Sync.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {articles.map((a, i) => <ArticleCard key={a.id} a={a} i={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
