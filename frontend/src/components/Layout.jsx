import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/workouts', icon: '🏋️', label: 'Workouts' },
    { to: '/exercises', icon: '💪', label: 'Exercises' },
    { to: '/progress', icon: '📈', label: 'Progress' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', icon: '🔧', label: 'Admin' }] : []),
  ];

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="FitTrack" className="logo-img" />
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-wrapper">
        {/* Mobile top bar */}
        <header className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <img src="/logo.png" alt="FitTrack" className="logo-img-mobile" />
          <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
