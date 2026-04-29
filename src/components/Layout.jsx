import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import DataSourcesPanel from './DataSourcesPanel'

export default function Layout({ onLogout }) {
  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Topbar onLogout={onLogout} />
      <main style={{ paddingTop: 56, minHeight: '100vh' }}>
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2.5rem)', maxWidth: '100%', width: '100%' }}>
          <Outlet />
        </div>
      </main>
      <DataSourcesPanel />
    </div>
  )
}
