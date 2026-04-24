import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { NAV_GROUPS } from '../nav'
import { GROUP_COLORS } from '../lib/utils'

const INIT = Object.fromEntries(NAV_GROUPS.map(g => [g.id, true]))

export default function Sidebar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_open')) || INIT } catch { return INIT }
  })

  function toggle(id) {
    const next = { ...open, [id]: !open[id] }
    setOpen(next)
    localStorage.setItem('sb_open', JSON.stringify(next))
  }

  return (
    <div style={{
      position: 'fixed', top: 56, left: 0, bottom: 0, width: 220, zIndex: 90,
      background: '#0C1829',
      borderRight: '1px solid #1A2D4A',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '1rem 0 2rem' }}>
        {NAV_GROUPS.map(group => {
          const color = GROUP_COLORS[group.id] || '#CC0000'
          const isOpen = open[group.id]
          return (
            <div key={group.id} style={{ marginBottom: '0.25rem' }}>
              <button onClick={() => toggle(group.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 1rem 0.3rem',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.16em', color: '#3D5C7A', textTransform: 'uppercase' }}>
                  {group.label}
                </span>
                <ChevronDown size={9} color="#253F62" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)' }} />
              </button>

              {isOpen && group.items.map(item => {
                const isActive = pathname === item.path
                return (
                  <NavLink key={item.path} to={item.path} end={item.path === '/'} style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.45rem 1rem 0.45rem 1rem',
                    textDecoration: 'none', fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : '#8BAFC9',
                    background: isActive ? `${color}12` : 'transparent',
                    borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(59,130,246,0.06)' } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#8BAFC9'; e.currentTarget.style.background = 'transparent' } }}
                  >
                    <item.icon size={13} color={isActive ? color : '#3D5C7A'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
