export default function Dashboard({ onLogout }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#131e27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.25em', color: '#ffa600', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Bildbrauerei · Politik
        </p>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
          POLARIS
        </h1>
        <div style={{ width: '40px', height: '2px', backgroundColor: '#ffa600', margin: '0.875rem auto' }} />
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          Das politische Gehirn Deutschlands.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#52b7c1', marginTop: '2rem', fontWeight: 600 }}>
          ✓ Erfolgreich eingeloggt
        </p>
        <button
          onClick={onLogout}
          style={{
            marginTop: '2rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: 'transparent',
            border: '1px solid #3d5068',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#ffa600'; e.target.style.color = '#ffa600' }}
          onMouseLeave={e => { e.target.style.borderColor = '#3d5068'; e.target.style.color = 'rgba(255,255,255,0.4)' }}
        >
          Ausloggen
        </button>
      </div>
    </div>
  )
}
