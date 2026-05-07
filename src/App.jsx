import { useApp } from './context/AppContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Login from './modules/Login/index.jsx'
import AdminDashboard from './modules/Dashboard/AdminDashboard.jsx'
import ManagerDashboard from './modules/Dashboard/ManagerDashboard.jsx'
import LearnerDashboard from './modules/Dashboard/LearnerDashboard.jsx'
import Catalog from './modules/Catalog/index.jsx'
import CourseDetail from './modules/Catalog/CourseDetail.jsx'
import CourseBuilder from './modules/CourseBuilder/index.jsx'
import Assignments from './modules/Assignments/index.jsx'
import Player from './modules/Player/index.jsx'
import TeamView from './modules/TeamView/index.jsx'
import MemberDetail from './modules/TeamView/MemberDetail.jsx'
import Reports from './modules/Reports/index.jsx'
import Roleplay from './modules/Roleplay/index.jsx'
import Certificates from './modules/Certificates/index.jsx'
import Leaderboard from './modules/Leaderboard/index.jsx'
import AuditLog from './modules/Compliance/AuditLog.jsx'
import Settings from './modules/Settings/index.jsx'

export default function App() {
  const { authed, role, module, selectedMember, selectedCourse, mobileNavOpen, setMobileNavOpen } = useApp()

  if (!authed) return <Login />

  return (
    <div className={`app-shell ${mobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <Sidebar />
      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="main-pane">
        <Topbar />
        <div className="page-area fade-in" key={`${role}-${module}-${selectedMember || ''}-${selectedCourse || ''}`}>
          <Router />
        </div>
      </div>
    </div>
  )
}

function Router() {
  const { role, module, selectedMember, selectedCourse } = useApp()

  if (selectedCourse && (module === 'my-courses' || module === 'catalog')) return <Player />
  if (selectedCourse && module === 'catalog') return <CourseDetail />
  if (selectedMember && module === 'team-view') return <MemberDetail />

  switch (module) {
    case 'dashboard':
      if (role === 'admin') return <AdminDashboard />
      if (role === 'manager') return <ManagerDashboard />
      return <LearnerDashboard />
    case 'catalog':
      return selectedCourse ? <CourseDetail /> : <Catalog />
    case 'builder':
      return <CourseBuilder />
    case 'assignments':
      return <Assignments />
    case 'team-view':
      return selectedMember ? <MemberDetail /> : <TeamView />
    case 'reports':
      return <Reports />
    case 'compliance':
      return <AuditLog />
    case 'my-courses':
      return selectedCourse ? <Player /> : <LearnerDashboard mode="courses" />
    case 'my-learning':
      return <LearnerDashboard mode="courses" />
    case 'roleplay':
      return <Roleplay />
    case 'certificates':
      return <Certificates />
    case 'leaderboard':
      return <Leaderboard />
    case 'settings':
      return <Settings />
    default:
      return <LearnerDashboard />
  }
}
