import { useRole } from "../context/RoleContext";
import "./Header.css";

export default function Header() {
  const { role, toggleRole } = useRole();

  return (
    <header className="app-header">
      <div className="app-header__brand">Chowly</div>
      <button className="app-header__toggle" onClick={toggleRole}>
        <span className={role === "customer" ? "active" : ""}>Customer</span>
        <span className={role === "waiter" ? "active" : ""}>Waiter</span>
      </button>
    </header>
  );
}