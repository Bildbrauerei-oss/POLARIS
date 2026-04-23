export default function LoadingSpinner({ size = 24, color = '#52b7c1' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: size, height: size, border: `2px solid rgba(82,183,193,0.15)`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}
