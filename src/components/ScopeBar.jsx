// Persistenter Scope-Filter — sitzt am Seitenkopf jedes regionalisierbaren Moduls.
// Optionen: Bundesweit / Bundesland / Region (Freitext-Suche) / Aktiver Ort
import { useState, useRef, useEffect } from 'react'
import { Globe, MapPin, Landmark, Search, X } from 'lucide-react'
import { SCOPE_OPTIONS, useScope, getScopeLabel } from '../lib/scopeContext'
import { useKampagne } from '../lib/kampagneContext'

const ICON = {
  bundesweit: Globe,
  bundesland: Landmark,
  region: Search,
  ort: MapPin,
}

export default function ScopeBar({ compact = false }) {
  const { scope, setScope, customRegion, setCustomRegion } = useScope()
  const { aktiveKampagne } = useKampagne()
  const [regionInput, setRegionInput] = useState(customRegion)
  const [regionOpen, setRegionOpen] = useState(scope === 'region')
  const inputRef = useRef(null)

  useEffect(() => { setRegionInput(customRegion) }, [customRegion])

  useEffect(() => {
    if (scope === 'region') {
      setRegionOpen(true)
      setTimeout(() => inputRef.current?.focus(), 80)
    } else {
      setRegionOpen(false)
    }
  }, [scope])

  function handleRegionInput(val) {
    setRegionInput(val)
    setCustomRegion(val)
  }

  function clearRegion() {
    setRegionInput('')
    setCustomRegion('')
    inputRef.current?.focus()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
      padding: compact ? '0.5rem 0.75rem' : '0.625rem 1rem',
      background: '#162230', border: '1px solid rgba(82,183,193,0.18)',
      borderRadius: 12, marginBottom: '1rem',
    }}>
      <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase', marginRight: '0.25rem', flexShrink: 0 }}>
        Scope
      </span>

      {SCOPE_OPTIONS.map(opt => {
        const Icon = ICON[opt.id]
        const active = scope === opt.id
        const label = opt.id === 'ort' && aktiveKampagne?.ort
          ? aktiveKampagne.ort
          : opt.id === 'bundesland' && aktiveKampagne?.bundesland
          ? aktiveKampagne.bundesland
          : opt.label
        return (
          <button key={opt.id} onClick={() => setScope(opt.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: compact ? '0.25rem 0.625rem' : '0.375rem 0.75rem', borderRadius: 8,
            border: `1px solid ${active ? 'rgba(255,166,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: active ? 'rgba(255,166,0,0.12)' : 'rgba(255,255,255,0.03)',
            color: active ? '#ffa600' : 'rgba(255,255,255,0.7)',
            fontSize: '0.75rem', fontWeight: active ? 700 : 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', flexShrink: 0,
          }}>
            <Icon size={11} />
            {label}
          </button>
        )
      })}

      {/* Freitext-Suchfeld erscheint wenn scope=region aktiv */}
      {regionOpen && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          flex: 1, minWidth: 160, maxWidth: 300,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,166,0,0.35)', borderRadius: 8,
          padding: '0.25rem 0.5rem',
        }}>
          <Search size={11} color="#ffa600" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={regionInput}
            onChange={e => handleRegionInput(e.target.value)}
            placeholder="Stadt, Gemeinde, Bundesland…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.75rem', fontFamily: 'inherit',
            }}
          />
          {regionInput && (
            <button onClick={clearRegion} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: 2 }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
              <X size={10} />
            </button>
          )}
        </div>
      )}

      <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', fontStyle: 'italic', flexShrink: 0 }}>
        Zeigt: {getScopeLabel(scope, aktiveKampagne, customRegion)}
      </span>
    </div>
  )
}
