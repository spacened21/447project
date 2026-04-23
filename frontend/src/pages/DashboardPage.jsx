import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.webp";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function DashboardPage({
  loggedInUser,
  onLogout,
  onSeedInventory,
  message,
  error,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
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
                location.pathname === "/dashboard"
                  ? "app-nav__link--active"
                  : ""
              }`}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`app-nav__link ${
                location.pathname === "/inventory"
                  ? "app-nav__link--active"
                  : ""
              }`}
              onClick={() => navigate("/inventory")}
            >
              Inventory
            </button>
          </nav>

          <div className="app-nav__right">
            <div className="app-nav__user">
              <span className="avatar" aria-hidden="true">
                {initials(loggedInUser.username)}
              </span>
              <div>
                <div className="app-nav__user-name">
                  {loggedInUser.username}
                </div>
                <div className="app-nav__user-role">{loggedInUser.role}</div>
              </div>
            </div>
            <button
              className="btn btn--ghost small-button"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <section className="welcome-card">
            <div className="welcome-card__content">
              <span className="welcome-card__eyebrow">Dashboard</span>
              <h1 className="welcome-card__title">
                Welcome back, {loggedInUser.username}.
              </h1>
              <p className="welcome-card__meta">
                Here's a quick look at your workspace and what you can do next.
              </p>
            </div>
          </section>

          {message && (
            <div className="alert alert--success" role="status">
              <span className="alert__dot" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              <span className="alert__dot" />
              <span>{error}</span>
            </div>
          )}

          <section>
            <div className="page-header">
              <div>
                <span className="page-header__eyebrow">Your profile</span>
                <h2 className="page-header__title">Account details</h2>
              </div>
            </div>

            <div className="card-grid">
              <div className="info-card">
                <span className="info-card__label">Username</span>
                <span className="info-card__value">
                  {loggedInUser.username}
                </span>
              </div>
              <div className="info-card">
                <span className="info-card__label">Email</span>
                <span className="info-card__value">{loggedInUser.email}</span>
              </div>
              <div className="info-card">
                <span className="info-card__label">Role</span>
                <span className="info-card__value">
                  <span
                    className={`badge ${
                      loggedInUser.role === "admin"
                        ? "badge--red"
                        : "badge--blue"
                    }`}
                  >
                    {loggedInUser.role}
                  </span>
                </span>
              </div>
            </div>
          </section>

          <section>
            <div className="page-header">
              <div>
                <span className="page-header__eyebrow">Quick actions</span>
                <h2 className="page-header__title">Jump back in</h2>
                <p className="page-header__subtitle">
                  Pick up where you left off or seed a fresh sandbox for
                  testing.
                </p>
              </div>
            </div>

            <div className="card-grid">
              <button
                type="button"
                className="action-card action-card--clickable"
                onClick={() => navigate("/inventory")}
              >
                <span className="action-card__icon action-card__icon--blue">
                  ▤
                </span>
                <h3 className="action-card__title">Manage inventory</h3>
                <p className="action-card__desc">
                  View, add, and remove materials and equipment.
                </p>
              </button>

              <button
                type="button"
                className="action-card action-card--clickable"
                onClick={onSeedInventory}
              >
                <span className="action-card__icon action-card__icon--red">
                  ✦
                </span>
                <h3 className="action-card__title">Create test data</h3>
                <p className="action-card__desc">
                  Populate your workspace with sample records to explore.
                </p>
              </button>

              <button
                type="button"
                className="action-card action-card--clickable"
                onClick={onLogout}
              >
                <span className="action-card__icon action-card__icon--gradient">
                  ⎋
                </span>
                <h3 className="action-card__title">Log out</h3>
                <p className="action-card__desc">
                  End your session on this device.
                </p>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
