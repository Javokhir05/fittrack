import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">FitTrack</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/workouts" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            🏋️ Workouts
          </NavLink>
          <NavLink to="/exercises" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            💪 Exercises
          </NavLink>
          <NavLink to="/progress" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            📈 Progress
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              🔧 Admin
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
