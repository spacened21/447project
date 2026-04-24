import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function DashboardPage({
  loggedInUser,
  onLogout,
  onSeedInventory,
  inventoryItems = [],
  message,
  error,
}) {
  const navigate = useNavigate();

  // Calculate inventory metrics
  const totalItems = inventoryItems.length;
  const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventoryItems
    .filter((item) => item.quantity <= 10)
    .sort((a, b) => a.quantity - b.quantity);
  const lowStockCount = lowStockItems.length;

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} onLogout={onLogout} />

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
                  <span className="metric-card__value">{lowStockCount}</span>
                  <span className="metric-card__label">Low Stock Alerts</span>
                </div>
              </div>
            </div>
          </section>

          {/* Low Stock Alerts Section */}
          {lowStockItems.length > 0 && (
            <section className="table-card">
              <div className="table-card__header">
                <div>
                  <h2>Low Stock Items</h2>
                </div>
                <button
                  className="btn btn--outline small-button"
                  onClick={() => navigate("/inventory")}
                >
                  View all inventory →
                </button>
              </div>

              <div className="table-wrapper">
                <table className="inventory-table low-stock-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
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
                        <td className="mono">
                          <span className={item.quantity <= 5 ? "low-stock-critical" : "low-stock-warning"}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
