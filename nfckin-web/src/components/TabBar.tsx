import { NavLink } from 'react-router-dom';

export default function TabBar() {
  return (
    <nav className="tabbar">
      <NavLink to="/" end>
        <span className="icon">🏠</span>
        Cards
      </NavLink>
      <NavLink to="/activate">
        <span className="icon">➕</span>
        Ativar
      </NavLink>
      <NavLink to="/settings">
        <span className="icon">⚙️</span>
        Ajustes
      </NavLink>
    </nav>
  );
}
