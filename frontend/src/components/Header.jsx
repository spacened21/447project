import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.webp";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Header({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <div className="app-nav__brand">
          <span className="app-nav__logo">
            <img src={logo} alt="" />
          </span>
          <span className="app-nav__brand-name">
            CoolSys
            <small>Inventory Management System</small>
          </span>
        </div>

        <nav className="app-nav__links" aria-label="Primary">
          <button
            className={`app-nav__link ${
              location.pathname === "/dashboard" ? "app-nav__link--active" : ""
            }`}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/inventory" ? "app-nav__link--active" : ""
            }`}
            onClick={() => navigate("/inventory")}
          >
            Inventory
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/deliveries" ? "app-nav__link--active" : ""
            }`}
            onClick={() => navigate("/deliveries")}
          >
            Deliveries
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/requests" ? "app-nav__link--active" : ""
            }`}
            onClick={() => navigate("/requests")}
          >
            Activity Log
          </button>
        </nav>

        <div className="app-nav__right">
          <button
            className={`account-button ${
              location.pathname === "/account" ? "account-button--active" : ""
            }`}
            onClick={() => navigate("/account")}
            aria-label="Account settings"
          >
            <span className="avatar" aria-hidden="true">
              {initials(loggedInUser.username)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
