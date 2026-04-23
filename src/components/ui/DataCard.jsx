import { motion } from 'framer-motion'

export default function DataCard({ label, value, sub, trend, icon: Icon, color = '#52b7c1' }) {
  return (
    <motion.div
      whileHover={{ translateY: -3, boxShadow: '0 12px 36px rgba(0,0,0,0.35)' }}
      style={{
        background: '#162230', border: '1px solid rgba(82,183,193,0.15)',
        borderTop: `3px solid ${color}`,
        borderRadius: 14, padding: '1.25rem',
        position: 'relative', overflow: 'hidden', cursor: 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</p>
        {Icon && (
          <div style={{ width: 28, height: 28, background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} color={color} />
          </div>
        )}
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.25rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.625rem' }}>
        {sub && <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{sub}</p>}
        {trend !== undefined && (
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: trend >= 0 ? '#22C55E' : '#bf111b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </motion.div>
  )
}
