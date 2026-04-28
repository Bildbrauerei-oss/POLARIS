import StatusBadge from './StatusBadge'

export default function PageHeader({ title, description, status, children, icon: Icon, color = '#52b7c1' }) {
  return (
    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {Icon && (
          <div style={{ width: 52, height: 52, background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Icon size={23} color={color} />
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.875rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{title}</h1>
            {status && <StatusBadge status={status} />}
          </div>
          {description && (
            <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', color: '#C8DCF0', fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: 560, fontStyle: 'italic' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  )
}
