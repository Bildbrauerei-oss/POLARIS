import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import { supabase } from '../lib/supabase'
import { NAV_GROUPS } from '../nav'
import { GROUP_COLORS, isUrgent } from '../lib/utils'
import {
  RefreshCw, ExternalLink, ChevronRight,
  Newspaper, BarChart2, Shield, Target, Folder, Megaphone,
  TrendingUp, TrendingDown, Send,
  ArrowUpRight, AlertTriangle
} from 'lucide-react'
const QUICKLINKS = [
  { path: '/umfrage-radar',       label: 'Umfrage-Radar',       icon: BarChart2,  color: '#52b7c1' },
  { path: '/medien-monitor',      label: 'Medien-Monitor',      icon: Newspaper,  color: '#3B82F6' },
  { path: '/gegner-analyse',      label: 'Gegner-Analyse',      icon: Shield,     color: '#A855F7' },
  { path: '/themen-cockpit',      label: 'Themen-Cockpit',      icon: Target,     color: '#ffa600' },
  { path: '/projekte',            label: 'Projekte',            icon: Folder,     color: '#22C55E' },
  { path: '/social-media-fabrik', label: 'Social Media Fabrik', icon: Megaphone,  color: '#F97316' },
]
const CHAT_SUGGESTIONS = [
  'Heutige Lage in 3 Sätzen',
  'Merz-Narrativ diese Woche',
  'Wer greift die CDU gerade an?',
  'Strategische Empfehlung für morgen',
]

// Count-up hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return value
}

function MetricCard({ label, value, color = '#52b7c1', trend, loading }) {
  const animated = useCountUp(loading ? 0 : value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#2d3c4b',
        border: `1px solid rgba(82,183,193,0.2)`,
        borderTop: `3px solid ${color}`,
        borderRadius: 14, padding: '1.25rem',
        flex: 1, minWidth: 0,
      }}
      whileHover={{ translateY: -3, boxShadow: `0 8px 32px rgba(0,0,0,0.3)` }}
    >
      <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '2.5rem', color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>
        {loading ? '—' : animated}
      </p>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
          {trend >= 0
            ? <TrendingUp size={11} color="#52b7c1" />
            : <TrendingDown size={11} color="#bf111b" />}
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: trend >= 0 ? '#52b7c1' : '#bf111b' }}>
            {trend >= 0 ? '+' : ''}{trend} heute
          </span>
        </div>
      )}
    </motion.div>
  )
}

function SentimentDot({ s }) {
  const c = s === 'positiv' ? '#22c55e' : s === 'negativ' ? '#bf111b' : 'rgba(255,255,255,0.3)'
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />
}

function FeedItem({ a, index }) {
  const urgent = isUrgent(a)
  const ago = a.datum ? (() => {
    const m = (Date.now() - new Date(a.datum)) / 60000
    return m < 60 ? `${Math.round(m)}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}T`
  })() : ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
      style={{
        display: 'flex', gap: '0.75rem', padding: '0.875rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: urgent ? 'rgba(191,17,27,0.05)' : 'transparent',
        transition: 'background 0.15s', cursor: a.url ? 'pointer' : 'default',
      }}
      whileHover={{ background: urgent ? 'rgba(191,17,27,0.08)' : 'rgba(82,183,193,0.04)' }}
    >
      <div style={{ width: 2, borderRadius: 2, background: urgent ? '#bf111b' : a.sentiment === 'positiv' ? '#22c55e' : 'rgba(255,255,255,0.08)', flexShrink: 0, alignSelf: 'stretch', minHeight: 36 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {urgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.3rem' }}>
            <AlertTriangle size={9} color="#bf111b" />
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#ff6b6b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dringend</span>
          </div>
        )}
        <p style={{ fontSize: '0.875rem', fontWeight: urgent ? 600 : 400, color: '#fff', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {a.titel}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
          <SentimentDot s={a.sentiment} />
          <span style={{ fontSize: '0.625rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
          <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)' }}>{ago}</span>
        </div>
      </div>
      {a.url && (
        <a href={a.url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}>
          <ArrowUpRight size={12} />
        </a>
      )}
    </motion.div>
  )
}

// POLARIS Chat — politisches Gehirn mit Live-Kontext
function PolarisChat({ articles = [] }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Moin Jan. Was brauchst du – Lage, Gegnerzug, oder einen Winkel für morgen?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Live-Kontext aus Medien-Monitor: aktuelle Artikel mit Analyse
  function buildContext() {
    if (!articles.length) return 'Keine aktuellen Artikel im Feed.'
    const top = articles.slice(0, 25).map((a, i) => {
      const bits = [
        a.titel,
        a.zusammenfassung ? `— ${a.zusammenfassung}` : '',
        a.cdu_wirkung ? `[CDU ${a.cdu_wirkung}]` : '',
        a.handlungsbedarf ? '[DRINGEND]' : '',
        a.quelle ? `(${a.quelle})` : '',
      ].filter(Boolean).join(' ')
      return `${i + 1}. ${bits}`
    }).join('\n')
    return `AKTUELLER MEDIEN-FEED (Top 25 von ${articles.length}):\n${top}`
  }

  async function send(text) {
    const q = text || input.trim()
    if (!q) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    const system = `Du bist POLARIS, das politische Gehirn von Bildbrauerei für Jan Schlegel (Head of Politik).

Deine Rolle:
- Du denkst wie ein erfahrener CDU-Wahlkampfmanager: strategisch, scharf, manchmal mit trockenem Humor.
- Du bist die analytische Instanz: Du liest den Feed, erkennst Muster, ziehst Schlüsse.
- Du gibst Einschätzungen, keine Zusammenfassungen. Beziehe Position, benenne Risiken, schlage Züge vor.
- Knapp, konkret, deutsch. Keine PR-Floskeln. Kein Disclaimer-Geschwurbel.
- Wenn dich Jan nach Lage fragt: Nenne 2–3 Top-Narrative mit Gegnerbezug und CDU-Wirkung.
- Wenn er nach Empfehlungen fragt: Klare These + nächster Schritt. Keine Aufzählung ohne Priorisierung.

Kontext (aktuelle Kampagne): Jürgen Roth, OB-Wahl Villingen-Schwenningen, September 2026, parteilos mit CDU-Unterstützung. OB-Wahl-Rhythmus BW: 8 Jahre.

${buildContext()}

Nutze diesen Feed aktiv für deine Antworten. Zitiere relevante Artikel mit Nummer, wenn sie deine Analyse stützen.`

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
          max_tokens: 900,
          system,
          messages: [{ role: 'user', content: q }],
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.content?.[0]?.text || 'Kein Ergebnis.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Verbindungsfehler. Bitte versuche es erneut.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '0.625rem 0.875rem',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #52b7c1, #2d9aa5)'
                : 'rgba(255,255,255,0.06)',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              fontSize: '0.8125rem', color: '#fff', lineHeight: 1.5,
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 2px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#52b7c1', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ padding: '0 1rem 0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {CHAT_SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} style={{
            padding: '0.25rem 0.625rem', background: 'rgba(82,183,193,0.08)',
            border: '1px solid rgba(82,183,193,0.2)', borderRadius: 6,
            color: '#52b7c1', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,183,193,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(82,183,193,0.08)'}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
          placeholder="Frage stellen…"
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '0.5rem 0.75rem',
            color: '#fff', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(82,183,193,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          width: 34, height: 34, background: input.trim() && !loading ? '#52b7c1' : 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 8, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s', flexShrink: 0,
        }}>
          <Send size={13} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.3)'} />
        </button>
      </div>
    </div>
  )
}

function Section({ title, color = '#52b7c1', right, children }) {
  return (
    <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: color, textTransform: 'uppercase' }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

export default function CommandCenter() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const { articles, loading, refetch } = useArticles({ limit: 60 })
  const urgent = articles.filter(a => isUrgent(a))
  const todayCount = articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString()).length

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    const r = await runFeedSync(true)
    setSyncMsg(r.success ? `✓ Sync abgeschlossen` : '✗ Sync fehlgeschlagen')
    setSyncing(false); refetch()
    setTimeout(() => setSyncMsg(null), 4000)
  }

  const sortedFeed = [
    ...articles.filter(a => isUrgent(a)),
    ...articles.filter(a => !isUrgent(a)),
  ].slice(0, 20)

  return (
    <div style={{ width: '100%' }}>

      {/* HERO */}
      <div style={{
        position: 'relative', marginBottom: '1.75rem', padding: '2.25rem 2.5rem',
        background: 'linear-gradient(135deg, #2d3c4b 0%, #1e2d3a 60%, #162230 100%)',
        border: '1px solid rgba(82,183,193,0.2)',
        borderRadius: 20, overflow: 'hidden',
      }}>
        {/* CDU arch decoration */}
        <div className="cdu-arch" />
        <div className="cdu-arch-2" />
        {/* Teal glow */}
        <div style={{ position: 'absolute', top: -60, left: -60, width: 250, height: 250, background: 'radial-gradient(circle, rgba(82,183,193,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.625rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', animation: 'pulse-dot 2s ease infinite' }} />
              System bereit
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            <span style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{today}</span>
          </div>

          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '2.25rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '0.5rem' }}>
            {greeting}, Jan.
          </h1>
          <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '1rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginBottom: '1.75rem' }}>
            Jürgen Roth · OB-Wahl VS-Schwenningen · September 2026
          </p>

          {/* Metric cards */}
          <div className="metric-cards" style={{ display: 'flex', gap: '1rem' }}>
            <MetricCard label="Artikel heute" value={todayCount} color="#52b7c1" loading={loading} />
            <MetricCard label="Offene Alerts" value={urgent.length} color="#bf111b" loading={loading} />
            <MetricCard label="Artikel gesamt" value={articles.length} color="#A855F7" loading={loading} />

            {/* Sync button as 5th card */}
            <motion.button
              onClick={handleSync}
              disabled={syncing}
              whileHover={{ translateY: -3 }}
              style={{
                flex: 1, minWidth: 0,
                background: syncing ? '#1e2d3a' : '#bf111b',
                border: `1px solid ${syncing ? 'rgba(82,183,193,0.2)' : 'transparent'}`,
                borderTop: `3px solid ${syncing ? 'rgba(255,255,255,0.1)' : '#ff4040'}`,
                borderRadius: 14, padding: '1.25rem',
                cursor: syncing ? 'wait' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                color: '#fff',
                boxShadow: syncing ? 'none' : '0 4px 20px rgba(191,17,27,0.3)',
                transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={18} style={{ animation: syncing ? 'spin 0.7s linear infinite' : 'none' }} />
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {syncing ? 'Läuft' : 'Sync'}
              </span>
            </motion.button>
          </div>

          {syncMsg && (
            <div style={{ marginTop: '1rem', padding: '0.625rem 1rem', background: syncMsg.startsWith('✓') ? 'rgba(34,197,94,0.08)' : 'rgba(191,17,27,0.08)', border: `1px solid ${syncMsg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(191,17,27,0.2)'}`, borderRadius: 8, fontSize: '0.8125rem', color: syncMsg.startsWith('✓') ? '#22c55e' : '#ff6b6b', fontWeight: 600 }}>
              {syncMsg}
            </div>
          )}
        </div>
      </div>

      {/* SCHNELLZUGRIFF */}
      <div className="quicklinks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {QUICKLINKS.map((item, i) => (
          <motion.div key={item.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ translateY: -3, boxShadow: `0 8px 24px rgba(0,0,0,0.3)` }}
          >
            <NavLink to={item.path} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem',
              padding: '1.125rem 0.5rem', background: '#162230',
              border: '1px solid rgba(82,183,193,0.12)',
              borderRadius: 14, textDecoration: 'none', textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = item.color + '60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(82,183,193,0.12)'}>
              <div style={{ width: 40, height: 40, background: `${item.color}15`, border: `1px solid ${item.color}25`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={17} color={item.color} />
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', lineHeight: 1.3 }}>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </div>

      {/* 2-COLUMN MAIN: Feed + breiter Chat */}
      <div className="main-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* COL 1: LIVE FEED */}
        <Section title="Morning Briefing · Live Feed" color="#52b7c1" right={
          <NavLink to="/medien-monitor" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            Alle <ChevronRight size={11} />
          </NavLink>
        }>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>Wird geladen…</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Newspaper size={32} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '0.375rem' }}>Noch keine Artikel</p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem' }}>Starte den Sync oben.</p>
              </div>
            ) : sortedFeed.map((a, i) => <FeedItem key={a.id} a={a} index={i} />)}
          </div>
        </Section>

        {/* COL 2: POLARIS CHAT (breit) */}
        <Section title="POLARIS Chat · Das politische Gehirn" color="#ffa600" right={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Claude Sonnet 4.5 · Live-Feed</span>
          </div>
        }>
          <div style={{ height: 560 }}>
            <PolarisChat articles={articles} />
          </div>
        </Section>
      </div>

      {/* MODULE GRID */}
      <Section title={`Alle ${NAV_GROUPS.flatMap(g => g.items).length} Module`} color="#52b7c1">
        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
          {NAV_GROUPS.map((group, gi) => {
            const color = GROUP_COLORS[group.id] || '#52b7c1'
            return (
              <motion.div key={group.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * gi }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}
              >
                <div style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 3, height: 10, background: color, borderRadius: 2 }} />
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', color, textTransform: 'uppercase' }}>{group.label}</span>
                </div>
                {group.items.map(item => (
                  <NavLink key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.875rem', textDecoration: 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${color}10`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <item.icon size={10} color={color} style={{ opacity: 0.7, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>{item.label}</span>
                  </NavLink>
                ))}
              </motion.div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
