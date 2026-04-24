import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Star, Calendar, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useArticles } from '../hooks/useArticles'
import { isUrgent } from '../lib/utils'

function SentimentBadge({ s }) {
  const map = {
    positiv: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: TrendingUp, label: 'Positiv' },
    negativ: { color: '#bf111b', bg: 'rgba(191,17,27,0.12)', icon: TrendingDown, label: 'Negativ' },
    neutral: { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.07)', icon: Minus, label: 'Neutral' },
  }
  const cfg = map[s] || map.neutral
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em',
      padding: '0.15rem 0.45rem', borderRadius: 4,
      background: cfg.bg, color: cfg.color,
      textTransform: 'uppercase',
    }}>
      <Icon size={8} /> {cfg.label}
    </span>
  )
}

function formatDateLong(d) {
  return new Date(d).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatTimeAgo(d) {
  if (!d) return ''
  const m = (Date.now() - new Date(d)) / 60000
  if (m < 60) return `vor ${Math.round(m)} Min.`
  if (m < 1440) return `vor ${Math.round(m / 60)} Std.`
  return `vor ${Math.round(m / 1440)} Tagen`
}

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

export default function MorningBriefingModal({ onClose }) {
  const today = new Date()
  const todayStr = today.toDateString()
  const lastShown = localStorage.getItem('polaris_briefing_date')
  const shouldShow = lastShown !== todayStr

  const { articles, loading } = useArticles({ limit: 5 })
  const urgent = articles.filter(a => isUrgent(a))
  const top5 = articles.slice(0, 5)

  useEffect(() => {
    if (shouldShow) {
      localStorage.setItem('polaris_briefing_date', todayStr)
    }
  }, [])

  if (!shouldShow && !window.__force_briefing__) return null

  return (
    <AnimatePresence>
      <motion.div
        key="briefing-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10,15,26,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          key="briefing-panel"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#1e2d3a',
            border: '1px solid rgba(82,183,193,0.2)',
            borderRadius: 20,
            width: '100%', maxWidth: 640,
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(82,183,193,0.1)',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #52b7c1 0%, #2d9aa5 100%)',
            padding: '1.75rem 1.75rem 1.5rem',
            position: 'relative', overflow: 'hidden',
            flexShrink: 0,
          }}>
            {/* CDU arch decoration */}
            <div className="cdu-arch" />
            <div className="cdu-arch-2" />

            <button onClick={onClose} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, cursor: 'pointer', color: '#fff',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              <X size={14} />
            </button>

            <p style={{
              fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.5rem',
            }}>
              Morning Briefing
            </p>
            <h2 style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: '#fff', lineHeight: 1.2, marginBottom: '0.375rem',
            }}>
              {greeting}, Jan.
            </h2>
            <p style={{
              fontFamily: '"IBM Plex Serif", Georgia, serif',
              fontSize: '0.9375rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic',
            }}>
              {formatDateLong(today)} — hier ist dein POLARIS-Update.
            </p>

            {urgent.length > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                marginTop: '1rem',
                background: 'rgba(191,17,27,0.2)', border: '1px solid rgba(191,17,27,0.4)',
                borderRadius: 8, padding: '0.5rem 0.875rem',
              }}>
                <AlertTriangle size={12} color="#ff6b6b" />
                <span style={{ fontSize: '0.75rem', color: '#ff9999', fontWeight: 600 }}>
                  {urgent.length} dringende Meldung{urgent.length > 1 ? 'en' : ''} mit Handlungsbedarf
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

            {/* Top Artikel */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.15em',
                color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.875rem',
              }}>
                Top Meldungen heute
              </p>

              {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Wird geladen…</div>
              ) : top5.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                  Noch keine Artikel — starte einen Feed-Sync.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {top5.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      style={{
                        display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                        padding: '0.875rem',
                        background: a.handlungsbedarf && a.sentiment === 'negativ'
                          ? 'rgba(191,17,27,0.06)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${a.handlungsbedarf && a.sentiment === 'negativ' ? 'rgba(191,17,27,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 10,
                        borderLeft: `3px solid ${a.sentiment === 'positiv' ? '#22c55e' : a.sentiment === 'negativ' ? '#bf111b' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                          <SentimentBadge s={a.sentiment} />
                          {a.handlungsbedarf && (
                            <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#ffa600', letterSpacing: '0.08em' }}>⚡ DRINGEND</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                          {a.titel}
                        </p>
                        {a.zusammenfassung && (
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                            {a.zusammenfassung}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
                          <span style={{ fontSize: '0.625rem', color: '#52b7c1', fontWeight: 600 }}>{a.quelle}</span>
                          <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)' }}>{formatTimeAgo(a.datum)}</span>
                        </div>
                      </div>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, padding: '0.25rem', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#52b7c1'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
                          <ChevronRight size={14} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Heute: Geburtstage Placeholder */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.15em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Heute
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'rgba(255,166,0,0.08)', border: '1px solid rgba(255,166,0,0.2)', borderRadius: 8 }}>
                  <Star size={11} color="#ffa600" />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Keine Politiker-Geburtstage heute</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'rgba(82,183,193,0.08)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 8 }}>
                  <Calendar size={11} color="#52b7c1" />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Keine Termine heute</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer CTA */}
          <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '0.875rem',
                background: 'linear-gradient(135deg, #ffa600, #e69500)',
                border: 'none', borderRadius: 10,
                color: '#0a0f1a', fontWeight: 800, fontSize: '0.875rem',
                letterSpacing: '0.04em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 20px rgba(255,166,0,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,166,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,166,0,0.3)' }}
            >
              Zum vollen Briefing <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
