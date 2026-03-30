import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';

export function Layout() {
  const { profile } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">AgoraQ Portal</Link>
        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/sales">Vendas</NavLink>
          <NavLink to="/finance">Financeiro</NavLink>
          {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
            <NavLink to="/commission-tables">Tabelas</NavLink>
          )}
          {profile?.role === 'admin' && <NavLink to="/users">Usuários</NavLink>}
        </nav>
        <div className="sidebar-footer">
          <strong>{profile?.full_name}</strong>
          <span>{profile?.role}</span>
          <button className="button button-secondary" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
