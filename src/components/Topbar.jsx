import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Search, LogOut, X, Command } from 'lucide-react'
import { ALL_MODULES } from '../nav'

function GlobalSearch({ onClose }) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const results = q.length > 1
    ? ALL_MODULES.filter(m =>
        m.label.toLowerCase().includes(q.toLowerCase()) ||
        (m.desc && m.desc.toLowerCase().includes(q.toLowerCase()))
      ).slice(0, 8)
    : []

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleKey(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { setSelected(s => Math.min(s + 1, results.length - 1)); e.preventDefault() }
    if (e.key === 'ArrowUp')   { setSelected(s => Math.max(s - 1, 0)); e.preventDefault() }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].path)
      onClose()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(10,15,26,0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#1e2d3a',
        border: '1px solid rgba(82,183,193,0.3)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={15} color="#52b7c1" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setSelected(0) }}
            onKeyDown={handleKey}
            placeholder="Module, Artikel, Politiker suchen…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '1rem', fontFamily: 'inherit',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>

        {q.length > 1 && (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                Keine Ergebnisse für „{q}"
              </div>
            ) : results.map((m, i) => (
              <div key={m.path}
                onClick={() => { navigate(m.path); onClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1.25rem', cursor: 'pointer',
                  background: i === selected ? 'rgba(82,183,193,0.1)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <div style={{ width: 32, height: 32, background: 'rgba(82,183,193,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icon size={14} color="#52b7c1" />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{m.label}</p>
                  {m.desc && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{m.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {q.length === 0 && (
          <div style={{ padding: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Medien-Monitor', 'Umfrage-Radar', 'Social Media Fabrik', 'Gegner-Analyse'].map(label => {
              const m = ALL_MODULES.find(x => x.label === label)
              if (!m) return null
              return (
                <button key={label} onClick={() => { navigate(m.path); onClose() }} style={{
                  padding: '0.375rem 0.75rem', background: 'rgba(82,183,193,0.08)',
                  border: '1px solid rgba(82,183,193,0.2)', borderRadius: 6,
                  color: '#52b7c1', fontSize: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,183,193,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(82,183,193,0.08)'}>
                  {label}
                </button>
              )
            })}
          </div>
        )}

        <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1rem' }}>
          {[['↵', 'Öffnen'], ['↑↓', 'Navigieren'], ['Esc', 'Schließen']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <kbd style={{ padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>{key}</kbd>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Intelligence', path: '/narrativ-detektor' },
  { label: 'Kampagne', path: '/wahlkampf-planer' },
  { label: 'Medien', path: '/medien-monitor' },
  { label: 'Content', path: '/social-media-fabrik' },
  { label: 'Team', path: '/projekte' },
  { label: 'Admin', path: '/admin-dashboard' },
]

export default function Topbar({ onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 100,
        background: 'rgba(82,183,193,0.97)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '2rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white"/>
              <path d="M7 1L7 4M7 10L7 13M1 7L4 7M10 7L13 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.0625rem', color: '#fff', letterSpacing: '0.04em' }}>
            POLARIS
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              style={({ isActive }) => ({
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                borderRadius: 6, textDecoration: 'none',
                borderBottom: isActive ? '2px solid #ffa600' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.borderBottomColor.includes('ffa600')) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!e.currentTarget.style.borderBottomColor.includes('ffa600')) e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Search button */}
          <button onClick={() => setSearchOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
            fontSize: '0.75rem', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
            <Search size={12} />
            <span>Suchen</span>
            <kbd style={{ padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.15)', borderRadius: 4, fontSize: '0.5625rem', fontFamily: 'inherit' }}>⌘K</kbd>
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5625rem', fontWeight: 800, color: '#fff' }}>
              JS
            </div>
          </div>

          {/* Logout */}
          <button onClick={onLogout} title="Abmelden"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.4rem', display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </>
  )
}
