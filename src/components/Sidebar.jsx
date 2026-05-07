import { useApp } from '../context/AppContext.jsx'
import Icon from './Icon.jsx'

export default function Sidebar() {
  const { nav, module, goto, role, switchRole, t, assignments, user } = useApp()

  const dueCount = assignments.filter((a) =>
    a.userId === user?.id && a.status !== 'completed' && new Date(a.dueAt) < new Date(Date.now() + 7 * 86400000)
  ).length

  const badgeFor = (item) => {
    if (item.badge === 'dueCount' && dueCount > 0) return dueCount
    return null
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Avanza LMS" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {nav.map((item) => {
          const badge = badgeFor(item)
          return (
            <button
              key={item.id}
              className={`nav-item ${module === item.id ? 'active' : ''}`}
              onClick={() => goto(item.id)}
            >
              <span className="nav-icon"><Icon name={item.icon} size={16} /></span>
              <span className="nav-label">{t(item.en, item.ar)}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-label">
          {t('Switch role (demo)', 'تبديل الدور (عرض)')}
        </div>
        <div className="role-switcher">
          {['admin','manager','learner','auditor'].map((r) => (
            <button key={r}
              className={`role-chip ${role === r ? 'active' : ''}`}
              onClick={() => switchRole(r)}>
              {t(r, { admin:'مدير', manager:'مشرف', learner:'متعلم', auditor:'مدقق' }[r])}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
