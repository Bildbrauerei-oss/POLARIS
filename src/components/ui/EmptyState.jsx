export default function EmptyState({ title = 'Keine Daten', message, icon: Icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      {Icon && <Icon size={40} color="rgba(82,183,193,0.2)" style={{ margin: '0 auto 1rem' }} />}
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem' }}>{title}</p>
      {message && (
        <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          {message}
        </p>
      )}
    </div>
  )
}
