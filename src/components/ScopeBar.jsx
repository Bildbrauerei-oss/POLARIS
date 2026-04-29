// Persistenter Scope-Filter — sitzt am Seitenkopf jedes regionalisierbaren Moduls.
// Optionen: Bundesweit / Bundesland / Region / Aktiver Ort
import { Globe, MapPin, Landmark, Compass } from 'lucide-react'
import { SCOPE_OPTIONS, useScope, getScopeLabel } from '../lib/scopeContext'
import { useKampagne } from '../lib/kampagneContext'

const ICON = {
  bundesweit: Globe,
  bundesland: Landmark,
  region: Compass,
  ort: MapPin,
}

export default function ScopeBar({ compact = false }) {
  const { scope, setScope } = useScope()
  const { aktiveKampagne } = useKampagne()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap',
      padding: compact ? '0.5rem 0.75rem' : '0.625rem 1rem',
      background: '#162230',
      border: '1px solid rgba(82,183,193,0.18)',
      borderRadius: 12,
      marginBottom: '1rem',
    }}>
      <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase', marginRight: '0.25rem' }}>
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
          <button
            key={opt.id}
            onClick={() => setScope(opt.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: compact ? '0.25rem 0.625rem' : '0.375rem 0.75rem',
              borderRadius: 8,
              border: `1px solid ${active ? 'rgba(255,166,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: active ? 'rgba(255,166,0,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#ffa600' : 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem', fontWeight: active ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
            }}
          >
            <Icon size={11} />
            {label}
          </button>
        )
      })}
      <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', fontStyle: 'italic' }}>
        Zeigt: {getScopeLabel(scope, aktiveKampagne)}
      </span>
    </div>
  )
}
