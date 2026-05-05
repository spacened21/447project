import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo.webp";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Theme icons
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function Header({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // Close menu on navigation
  const handleNavClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <nav className={`app-nav__links ${menuOpen ? "open" : ""}`} aria-label="Primary">
          <button
            className={`app-nav__link ${
              location.pathname === "/dashboard" ? "app-nav__link--active" : ""
            }`}
            onClick={() => handleNavClick("/dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/inventory" ? "app-nav__link--active" : ""
            }`}
            onClick={() => handleNavClick("/inventory")}
          >
            Inventory
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/jobsites" ? "app-nav__link--active" : ""
            }`}
            onClick={() => handleNavClick("/jobsites")}
          >
            Jobsites
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/deliveries" ? "app-nav__link--active" : ""
            }`}
            onClick={() => handleNavClick("/deliveries")}
          >
            Deliveries
          </button>
          <button
            className={`app-nav__link ${
              location.pathname === "/requests" ? "app-nav__link--active" : ""
            }`}
            onClick={() => handleNavClick("/requests")}
          >
            Requests
          </button>
        </nav>

        <div className="app-nav__right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
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
