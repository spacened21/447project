import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function DashboardPage({
  loggedInUser,
  onLogout,
  inventoryItems = [],
  message,
  error,
}) {
  const navigate = useNavigate();
  const [activeLocation, setActiveLocation] = useState("all");

  // Calculate inventory metrics
  const totalItems = inventoryItems.length;
  const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

  // Missing items = quantity is 0
  const missingItems = inventoryItems.filter((item) => item.quantity === 0);
  const missingCount = missingItems.length;

  // Group missing items by location
  const locations = ["warehouse", "yard", "jobsite"];
  const missingByLocation = {
    all: missingItems,
    warehouse: missingItems.filter((item) => item.location === "warehouse"),
    yard: missingItems.filter((item) => item.location === "yard"),
    jobsite: missingItems.filter((item) => item.location === "jobsite"),
  };

  const displayedMissingItems = missingByLocation[activeLocation] || [];

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

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

          {/* Stock Overview Section */}
          <section>
            <div className="page-header">
              <div>
                <span className="page-header__eyebrow">Stock overview</span>
                <h2 className="page-header__title">Inventory at a glance</h2>
              </div>
            </div>

            <div className="dashboard-metrics">
              <div className="metric-card">
                <span className="metric-card__icon metric-card__icon--blue">▤</span>
                <div className="metric-card__content">
                  <span className="metric-card__value">{totalItems}</span>
                  <span className="metric-card__label">Total Items</span>
                </div>
              </div>

              <div className="metric-card">
                <span className="metric-card__icon metric-card__icon--green">◉</span>
                <div className="metric-card__content">
                  <span className="metric-card__value">{totalStock}</span>
                  <span className="metric-card__label">Total Stock</span>
                </div>
              </div>

              <div className="metric-card">
                <span className="metric-card__icon metric-card__icon--orange">⚠</span>
                <div className="metric-card__content">
                  <span className="metric-card__value">{missingCount}</span>
                  <span className="metric-card__label">Missing Items</span>
                </div>
              </div>
            </div>
          </section>

          {/* Missing Items Section */}
          <section className="table-card">
            <div className="table-card__header">
              <div>
                <h2>Missing Items</h2>
                <p>Items that are out of stock at each location</p>
              </div>
              <button
                className="btn btn--outline small-button"
                onClick={() => navigate("/inventory")}
              >
                View all inventory →
              </button>
            </div>

            <div className="location-tabs">
              <button
                className={`location-tab ${activeLocation === "all" ? "location-tab--active" : ""}`}
                onClick={() => setActiveLocation("all")}
              >
                All ({missingByLocation.all.length})
              </button>
              {locations.map((loc) => (
                <button
                  key={loc}
                  className={`location-tab ${activeLocation === loc ? "location-tab--active" : ""}`}
                  onClick={() => setActiveLocation(loc)}
                >
                  {loc.charAt(0).toUpperCase() + loc.slice(1)} ({missingByLocation[loc].length})
                </button>
              ))}
            </div>

            <div className="table-wrapper">
              {displayedMissingItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No missing items</div>
                  <div className="empty-state__hint">
                    {activeLocation === "all"
                      ? "All items are in stock across all locations."
                      : `All items are in stock at the ${activeLocation}.`}
                  </div>
                </div>
              ) : (
                <table className="inventory-table low-stock-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMissingItems.map((item) => (
                      <tr key={item.item_id}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.type === "equipment"
                                ? "badge--red"
                                : "badge--blue"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge--location">
                            {item.location}
                          </span>
                        </td>
                        <td>{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

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
                  Pick up where you left off.
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

              {loggedInUser.role === "admin" && (
                <button
                  type="button"
                  className="action-card action-card--clickable"
                  onClick={() => navigate("/admin")}
                >
                  <span className="action-card__icon action-card__icon--red">
                    ⚿
                  </span>
                  <h3 className="action-card__title">Admin permissions</h3>
                  <p className="action-card__desc">
                    Manage user accounts, roles, and access.
                  </p>
                </button>
              )}

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
