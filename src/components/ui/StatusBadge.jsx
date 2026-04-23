export default function StatusBadge({ status = 'dev' }) {
  const map = {
    dev:     { label: 'In Entwicklung', dot: '#ffa600', bg: 'rgba(255,166,0,0.1)',   border: 'rgba(255,166,0,0.25)',  color: '#ffa600', pulse: false },
    active:  { label: 'Aktiv',          dot: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',   color: '#22C55E', pulse: true },
    error:   { label: 'Fehler',         dot: '#bf111b', bg: 'rgba(191,17,27,0.08)',  border: 'rgba(191,17,27,0.2)',   color: '#ff6b6b', pulse: true },
    loading: { label: 'Lädt',           dot: '#52b7c1', bg: 'rgba(82,183,193,0.08)', border: 'rgba(82,183,193,0.2)', color: '#52b7c1', pulse: true },
    live:    { label: 'Live',           dot: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',   color: '#22C55E', pulse: true },
  }
  const { label, dot, bg, border, color, pulse } = map[status] || map.dev
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.625rem', background: bg, border: `1px solid ${border}`, borderRadius: 20, fontSize: '0.5625rem', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0, animation: pulse ? 'pulse-dot 2s ease infinite' : 'none' }} />
      {label}
    </span>
  )
}
