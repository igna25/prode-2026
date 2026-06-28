import { NavLink } from "react-router-dom";
import { Book, Chart, List, Trophy } from "./Icons";

const items = [
  { to: "/", label: "Cuadro", icon: Trophy, end: true },
  { to: "/posiciones", label: "Posiciones", icon: Chart },
  { to: "/historial", label: "Historial", icon: List },
  { to: "/reglas", label: "Reglas", icon: Book }
];

export default function Navbar() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-item">
            <Icon />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
