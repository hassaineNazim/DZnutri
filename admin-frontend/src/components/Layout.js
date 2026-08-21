import { LogOut, RefreshCw } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const navItems = [
  { path: '/', label: 'Soumissions', end: true },
  { path: '/reports/auto', label: 'Auto' },
  { path: '/reports/users', label: 'Utilisateurs' },
  { path: '/additives/pending', label: 'Additifs' },
  { path: '/cosmetics/submissions', label: 'Cosmétiques' },
  { path: '/ratings', label: 'Avis' },
  { path: '/monitoring', label: 'Monitoring' },
];

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <header className="admin-nav-wrap">
        <div className="admin-navbar">
          <NavLink to="/" className="admin-brand" aria-label="Accueil Remo Scan Admin">
            <img className="admin-brand-logo" src="/assets/logo-remo.png" alt="Logo Remo Scan" />
            <span className="admin-brand-copy">
              <span className="admin-brand-name">Remo Scan</span>
              <span className="admin-brand-subtitle">ADMIN</span>
            </span>
          </NavLink>

          <nav className="admin-nav-scroll" aria-label="Navigation principale">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="admin-nav-actions">
            <button className="admin-icon-button" onClick={() => window.location.reload()} title="Rafraîchir" aria-label="Rafraîchir la page">
              <RefreshCw size={18} />
            </button>
            <button className="admin-logout-button" onClick={handleLogout}>
              <LogOut size={17} />
              <span className="admin-logout-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
