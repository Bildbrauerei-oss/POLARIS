import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Search, LogOut, X, Menu, ChevronRight, ChevronDown, Plus, Check, Calendar, Sparkles } from 'lucide-react'
import { ALL_MODULES, NAV_GROUPS } from '../nav'
import { useKampagne } from '../lib/kampagneContext'
import { tageUntilWahl, formatWahldatum } from '../lib/kampagneContext'
import KampagnenOnboarding from '../pages/KampagnenOnboarding'

function KampagneSwitcher({ onOpenOnboarding }) {
  const { kampagnen, aktiveKampagne, aktiveId, switchKampagne, deleteKampagne } = useKampagne()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tage = tageUntilWahl(aktiveKampagne?.wahldatum)

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => { setOpen(o => !o); setShowForm(false) }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.625rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, cursor: 'pointer', color: '#fff', fontFamily: 'inherit', transition: 'background 0.15s', maxWidth: 220 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{aktiveKampagne?.kandidat}</div>
          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{aktiveKampagne?.ort} · {aktiveKampagne?.wahltyp}</div>
        </div>
        {tage !== null && tage > 0 && (
          <span style={{ flexShrink: 0, fontSize: '0.5rem', fontWeight: 800, background: tage <= 30 ? '#ef4444' : tage <= 90 ? '#ffa600' : 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 5, padding: '0.1rem 0.35rem', whiteSpace: 'nowrap' }}>
            {tage}T
          </span>
        )}
        <ChevronDown size={11} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 300, background: '#0f1923', border: '1px solid rgba(82,183,193,0.25)', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 500, overflow: 'hidden' }}>
          {/* Kampagnen Liste */}
          <div style={{ padding: '0.5rem 0' }}>
            {kampagnen.map(k => {
              const t = tageUntilWahl(k.wahldatum)
              const isActive = k.id === aktiveId
              return (
                <div key={k.id} onClick={() => { switchKampagne(k.id); setOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', cursor: 'pointer', background: isActive ? 'rgba(82,183,193,0.1)' : 'transparent', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.kandidat}</span>
                      {isActive && <Check size={11} color="#52b7c1" style={{ flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.1rem' }}>
                      {k.ort} · {k.wahltyp} {k.wahldatum ? `· ${formatWahldatum(k.wahldatum)}` : ''}
                    </div>
                  </div>
                  {t !== null && t > 0 && (
                    <span style={{ flexShrink: 0, fontSize: '0.5rem', fontWeight: 800, background: t <= 30 ? 'rgba(239,68,68,0.2)' : t <= 90 ? 'rgba(255,166,0,0.2)' : 'rgba(82,183,193,0.15)', color: t <= 30 ? '#ef4444' : t <= 90 ? '#ffa600' : '#52b7c1', border: `1px solid ${t <= 30 ? 'rgba(239,68,68,0.3)' : t <= 90 ? 'rgba(255,166,0,0.3)' : 'rgba(82,183,193,0.25)'}`, borderRadius: 5, padding: '0.15rem 0.4rem' }}>
                      {t} Tage
                    </span>
                  )}
                  {kampagnen.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); deleteKampagne(k.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2, flexShrink: 0, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Neue Kampagne — öffnet Onboarding-Wizard */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { setOpen(false); onOpenOnboarding?.() }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#52b7c1', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,183,193,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Sparkles size={13} /> Neue Kampagne mit Datenrecherche
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected].path); onClose() }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,15,26,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', padding: '15vh 1rem 0' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 560, background: '#1e2d3a', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={15} color="#52b7c1" />
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSelected(0) }} onKeyDown={handleKey} placeholder="Suchen…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', fontFamily: 'inherit' }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><X size={14} /></button>
        </div>
        {q.length > 1 && (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Keine Ergebnisse</div>
            ) : results.map((m, i) => (
              <div key={m.path} onClick={() => { navigate(m.path); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.25rem', cursor: 'pointer', background: i === selected ? 'rgba(82,183,193,0.1)' : 'transparent', transition: 'background 0.1s' }} onMouseEnter={() => setSelected(i)}>
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
      </div>
    </div>
  )
}

// Mobile drawer
function MobileDrawer({ onClose, onLogout }) {
  const navigate = useNavigate()
  const GROUP_COLORS = { hauptbereich: '#52b7c1', intelligence: '#A855F7', kampagne: '#ffa600', content: '#3B82F6', team: '#22C55E', wissen: '#F97316', admin: '#8BAFC9' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,16,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, background: '#0c1829', borderRight: '1px solid rgba(82,183,193,0.15)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(82,183,193,0.1)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '0.04em' }}>POLARIS</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        {/* Nav groups */}
        <div style={{ flex: 1, padding: '0.75rem 0' }}>
          {NAV_GROUPS.map(group => {
            const color = GROUP_COLORS[group.id] || '#52b7c1'
            return (
              <div key={group.id} style={{ marginBottom: '0.25rem' }}>
                <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', padding: '0.5rem 1.25rem 0.25rem' }}>{group.label}</p>
                {group.items.map(item => (
                  <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 1.25rem', textDecoration: 'none',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      background: isActive ? `${color}12` : 'transparent',
                      borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                      fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s',
                    })}>
                    <item.icon size={14} color={color} style={{ opacity: 0.8 }} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </div>
        {/* Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(82,183,193,0.1)' }}>
          <button onClick={() => { onClose(); onLogout() }} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
            <LogOut size={14} /> Abmelden
          </button>
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
  { label: 'Admin', path: '/admin' },
]

export default function Topbar({ onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {menuOpen && <MobileDrawer onClose={() => setMenuOpen(false)} onLogout={onLogout} />}
      <KampagnenOnboarding open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 100,
        background: 'rgba(82,183,193,0.97)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem',
      }}>
        {/* Hamburger — mobile only */}
        <button onClick={() => setMenuOpen(true)} style={{ display: 'none', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff', width: 34, height: 34, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          className="mobile-menu-btn">
          <Menu size={16} />
        </button>

        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white"/>
              <path d="M7 1L7 4M7 10L7 13M1 7L4 7M10 7L13 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '0.04em' }}>POLARIS</span>
        </NavLink>

        {/* Kampagnen-Switcher */}
        <div className="kampagne-switcher">
          <KampagneSwitcher onOpenOnboarding={() => setOnboardingOpen(true)} />
        </div>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              style={({ isActive }) => ({
                padding: '0.375rem 0.625rem', fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                borderRadius: 6, textDecoration: 'none',
                borderBottom: isActive ? '2px solid #ffa600' : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              })}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={() => setSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.625rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
            <Search size={12} />
            <span className="search-label">Suchen</span>
            <kbd className="search-kbd" style={{ padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.15)', borderRadius: 4, fontSize: '0.5625rem', fontFamily: 'inherit' }}>⌘K</kbd>
          </button>
          <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5625rem', fontWeight: 800, color: '#fff' }}>JS</div>
          <button onClick={onLogout} title="Abmelden" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.4rem', display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .search-label { display: none; }
          .search-kbd { display: none; }
          .kampagne-switcher { display: none; }
        }
      `}</style>
    </>
  )
}
