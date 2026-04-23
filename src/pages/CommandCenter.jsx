import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useArticles } from '../hooks/useArticles'
import { runFeedSync, getLastRun } from '../lib/feedCron'
import { supabase } from '../lib/supabase'
import { NAV_GROUPS } from '../nav'
import {
  RefreshCw, Plus, X, ExternalLink, ChevronRight,
  Newspaper, BarChart2, Shield, Target, Folder, Megaphone,
  TrendingUp, TrendingDown, Minus, Zap, User, Search,
  MessageSquare, Send, Calendar, Star, ArrowUpRight, AlertTriangle
} from 'lucide-react'

const GROUP_COLORS = {
  hauptbereich: '#52b7c1', intelligence: '#A855F7', kampagne: '#ffa600',
  content: '#3B82F6', team: '#22C55E', wissen: '#F97316', admin: '#8BAFC9',
}
const QUICKLINKS = [
  { path: '/umfrage-radar',       label: 'Umfrage-Radar',       icon: BarChart2,  color: '#52b7c1' },
  { path: '/medien-monitor',      label: 'Medien-Monitor',      icon: Newspaper,  color: '#3B82F6' },
  { path: '/gegner-analyse',      label: 'Gegner-Analyse',      icon: Shield,     color: '#A855F7' },
  { path: '/themen-cockpit',      label: 'Themen-Cockpit',      icon: Target,     color: '#ffa600' },
  { path: '/projekte',            label: 'Projekte',            icon: Folder,     color: '#22C55E' },
  { path: '/social-media-fabrik', label: 'Social Media Fabrik', icon: Megaphone,  color: '#F97316' },
]
const CHAT_SUGGESTIONS = [
  'Aktuelle Alerts anzeigen',
  'Nächste OB-Wahlen in BW',
  'Landtagswahlen 2026',
  'Sentiment zu Jürgen Roth',
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
  const urgent = a.handlungsbedarf && a.sentiment === 'negativ'
  const ago = a.datum ? (() => {
    const m = (Date.now() - new Date(a.datum)) / 60000
    return m < 60 ? `${Math.round(m)}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}T`
  })() : ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        display: 'flex', gap: '0.75rem', padding: '0.875rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: urgent ? 'rgba(191,17,27,0.05)' : 'transparent',
        transition: 'background 0.15s', cursor: 'default',
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

// Simple chat component
function PolarisChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Guten Tag, Jan. Womit kann ich dir heute helfen?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const q = text || input.trim()
    if (!q) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

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
          system: `Du bist POLARIS, der politische KI-Assistent von Bildbrauerei Heidelberg für Jan Schlegel. Antworte kurz, präzise und professionell auf Deutsch. Aktuelles Projekt: Jürgen Roth, OB-Wahl Villingen-Schwenningen, September 2026, parteilos mit CDU-Unterstützung. Du kennst die deutschen OB-Wahl-Rhythmen (Baden-Württemberg: 8 Jahre). Sei direkt und nützlich.`,
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
  const { articles, loading, refetch } = useArticles({ limit: 30 })
  const urgent = articles.filter(a => a.handlungsbedarf && a.sentiment === 'negativ')
  const todayCount = articles.filter(a => a.datum && new Date(a.datum).toDateString() === new Date().toDateString()).length

  const [targets, setTargets] = useState(() => { try { return JSON.parse(localStorage.getItem('polaris_targets')) || [] } catch { return [] } })
  const [search, setSearch] = useState('')

  function addTarget() {
    const name = search.trim()
    if (!name || targets.find(t => t.name === name)) return
    const next = [...targets, { name, addedAt: new Date().toISOString() }]
    setTargets(next); localStorage.setItem('polaris_targets', JSON.stringify(next)); setSearch('')
  }
  function removeTarget(name) {
    const next = targets.filter(t => t.name !== name)
    setTargets(next); localStorage.setItem('polaris_targets', JSON.stringify(next))
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    const r = await runFeedSync(true)
    setSyncMsg(r.success ? `✓ Sync abgeschlossen` : '✗ Sync fehlgeschlagen')
    setSyncing(false); refetch()
    setTimeout(() => setSyncMsg(null), 4000)
  }

  const sortedFeed = [...urgent, ...articles.filter(a => !(a.handlungsbedarf && a.sentiment === 'negativ'))].slice(0, 20)

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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <MetricCard label="Artikel heute" value={todayCount} color="#52b7c1" loading={loading} />
            <MetricCard label="Offene Alerts" value={urgent.length} color="#bf111b" loading={loading} />
            <MetricCard label="Tracked Politiker" value={targets.length} color="#ffa600" />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
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

      {/* 3-COLUMN MAIN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 300px', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* COL 1: LIVE FEED */}
        <Section title="Morning Briefing · Live Feed" color="#52b7c1" right={
          <NavLink to="/medien-monitor" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            Alle <ChevronRight size={11} />
          </NavLink>
        }>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
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

        {/* COL 2: KALENDER + POLITIKER RADAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Aktuelles Projekt */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #bf111b, #52b7c1)' }} />
            <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Aktuelles Projekt</p>
            <div style={{ borderLeft: '3px solid #bf111b', paddingLeft: '0.875rem' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.125rem', color: '#fff', marginBottom: '0.25rem' }}>Jürgen Roth</p>
              <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>OB-Wahl · Villingen-Schwenningen</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.125rem' }}>Parteilos · CDU-Unterstützung</p>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.5rem', fontWeight: 700, background: 'rgba(255,166,0,0.1)', color: '#ffa600', border: '1px solid rgba(255,166,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, letterSpacing: '0.08em' }}>SEPT 2026</span>
                <span style={{ fontSize: '0.5rem', fontWeight: 700, background: 'rgba(82,183,193,0.1)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, letterSpacing: '0.08em' }}>VORBEREITUNG</span>
              </div>
            </div>
          </div>

          {/* Politiker Radar */}
          <Section title="Politiker Radar" color="#A855F7" right={
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{targets.length} Targets</span>
          }>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={11} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTarget()}
                    placeholder="Name + Enter"
                    style={{ width: '100%', padding: '0.5rem 0.625rem 0.5rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#fff', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <button onClick={addTarget} disabled={!search.trim()} style={{ width: 33, height: 33, background: search.trim() ? '#A855F7' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 7, cursor: search.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <Plus size={14} color="#fff" />
                </button>
              </div>

              {targets.length === 0 && (
                <div style={{ marginBottom: '0.625rem' }}>
                  <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.375rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Vorschläge</p>
                  {['Jürgen Roth', 'Friedrich Merz', 'Olaf Scholz', 'Markus Söder'].map(n => (
                    <button key={n} onClick={() => { const next = [...targets, { name: n, addedAt: new Date().toISOString() }]; setTargets(next); localStorage.setItem('polaris_targets', JSON.stringify(next)) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.35rem 0.5rem', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                      <Plus size={9} color="rgba(255,255,255,0.2)" /> {n}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 200, overflowY: 'auto' }}>
                {targets.map(t => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    <User size={11} color="#A855F7" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <button onClick={() => removeTarget(t.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', display: 'flex', transition: 'color 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#bf111b'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* COL 3: POLARIS CHAT */}
        <Section title="POLARIS Chat" color="#ffa600" right={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Claude Sonnet 4</span>
          </div>
        }>
          <div style={{ height: 480 }}>
            <PolarisChat />
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
