import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// Icons for stat cards
const Icons = {
  items: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  stock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  warning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  equipment: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

function DashboardPage({
  loggedInUser,
  onLogout,
  inventoryItems = [],
  message,
  error,
}) {
  const navigate = useNavigate();
  const [activeLocation, setActiveLocation] = useState("all");
  const [activeModal, setActiveModal] = useState(null); // 'total', 'stock', 'missing', 'equipment'

  // Calculate inventory metrics
  const totalItems = inventoryItems.length;
  const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

  // Missing items = items reported as missing by field crews
  const missingItems = inventoryItems.filter((item) => item.status === "missing");
  const missingCount = missingItems.length;

  // In stock items
  const inStockItems = inventoryItems.filter((item) => item.quantity > 0);

  // Items by type
  const materials = inventoryItems.filter((item) => item.type === "material");
  const equipment = inventoryItems.filter((item) => item.type === "equipment");
  const materialCount = materials.length;
  const equipmentCount = equipment.length;

  // Group missing items by location
  const locations = ["warehouse", "yard", "jobsite"];
  const missingByLocation = {
    all: missingItems,
    warehouse: missingItems.filter((item) => item.location === "warehouse"),
    yard: missingItems.filter((item) => item.location === "yard"),
    jobsite: missingItems.filter((item) => item.location === "jobsite"),
  };

  const displayedMissingItems = missingByLocation[activeLocation] || [];

  // Get modal content based on active modal
  const getModalContent = () => {
    switch (activeModal) {
      case 'total':
        return {
          title: 'All Items',
          subtitle: `${totalItems} items in inventory`,
          items: inventoryItems,
          columns: ['name', 'type', 'location', 'quantity'],
        };
      case 'stock':
        return {
          title: 'In Stock Items',
          subtitle: `${totalStock} total units across ${inStockItems.length} items`,
          items: inStockItems.sort((a, b) => b.quantity - a.quantity),
          columns: ['name', 'type', 'location', 'quantity'],
        };
      case 'missing':
        return {
          title: 'Missing Items',
          subtitle: `${missingCount} items reported as missing`,
          items: missingItems,
          columns: ['name', 'type', 'location', 'supplier'],
        };
      case 'equipment':
        return {
          title: 'Equipment',
          subtitle: `${equipmentCount} equipment items`,
          items: equipment,
          columns: ['name', 'location', 'quantity', 'supplier'],
        };
      default:
        return null;
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

      <main className="app-main">
        <div className="app-container">
          {/* Page Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-header__title">Dashboard</h1>
              <p className="dashboard-header__subtitle">
                Welcome back, {loggedInUser.username}
              </p>
            </div>
          </div>

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

          {/* Stats Row - Now Clickable */}
          <div className="stats-row">
            <button
              className="stat-card stat-card--blue stat-card--clickable"
              onClick={() => setActiveModal('total')}
            >
              <div className="stat-card__accent"></div>
              <div className="stat-card__body">
                <span className="stat-card__icon">{Icons.items}</span>
                <span className="stat-card__value">{totalItems}</span>
                <span className="stat-card__label">Total Items</span>
              </div>
            </button>

            <button
              className="stat-card stat-card--green stat-card--clickable"
              onClick={() => setActiveModal('stock')}
            >
              <div className="stat-card__accent"></div>
              <div className="stat-card__body">
                <span className="stat-card__icon">{Icons.stock}</span>
                <span className="stat-card__value">{totalStock}</span>
                <span className="stat-card__label">In Stock</span>
              </div>
            </button>

            <button
              className="stat-card stat-card--red stat-card--clickable"
              onClick={() => setActiveModal('missing')}
            >
              <div className="stat-card__accent"></div>
              <div className="stat-card__body">
                <span className="stat-card__icon">{Icons.warning}</span>
                <span className="stat-card__value">{missingCount}</span>
                <span className="stat-card__label">Missing Items</span>
              </div>
            </button>

            <button
              className="stat-card stat-card--purple stat-card--clickable"
              onClick={() => setActiveModal('equipment')}
            >
              <div className="stat-card__accent"></div>
              <div className="stat-card__body">
                <span className="stat-card__icon">{Icons.equipment}</span>
                <span className="stat-card__value">{equipmentCount}</span>
                <span className="stat-card__label">Equipment</span>
              </div>
            </button>
          </div>

          {/* Two Column Layout */}
          <div className="dashboard-grid">
            {/* Left Column - Missing Items */}
            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2 className="dashboard-panel__title">Missing Items</h2>
                <button
                  className="btn btn--outline small-button"
                  onClick={() => navigate("/inventory")}
                >
                  View All
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

              <div className="dashboard-panel__content">
                {displayedMissingItems.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    <div className="empty-state__icon">✓</div>
                    <div className="empty-state__title">All stocked</div>
                    <div className="empty-state__hint">
                      No missing items
                    </div>
                  </div>
                ) : (
                  <div className="missing-items-list">
                    {displayedMissingItems.slice(0, 5).map((item) => (
                      <div key={item.item_id} className="missing-item">
                        <div className="missing-item__info">
                          <span className="missing-item__name">{item.name}</span>
                          <span className="missing-item__meta">
                            {item.type} · {item.location}
                          </span>
                        </div>
                        <span className="missing-item__badge">Missing</span>
                      </div>
                    ))}
                    {displayedMissingItems.length > 5 && (
                      <div className="missing-items-more">
                        +{displayedMissingItems.length - 5} more items
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Right Column - Quick Actions */}
            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2 className="dashboard-panel__title">Quick Actions</h2>
              </div>

              <div className="dashboard-panel__content">
                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => navigate("/inventory")}
                  >
                    <span className="quick-action__icon quick-action__icon--blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </span>
                    <div className="quick-action__text">
                      <span className="quick-action__title">Inventory</span>
                      <span className="quick-action__desc">Manage items</span>
                    </div>
                    <span className="quick-action__arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => navigate("/deliveries")}
                  >
                    <span className="quick-action__icon quick-action__icon--green">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13"/>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    </span>
                    <div className="quick-action__text">
                      <span className="quick-action__title">Deliveries</span>
                      <span className="quick-action__desc">Log shipments</span>
                    </div>
                    <span className="quick-action__arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => navigate("/requests")}
                  >
                    <span className="quick-action__icon quick-action__icon--orange">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                    </span>
                    <div className="quick-action__text">
                      <span className="quick-action__title">Requests</span>
                      <span className="quick-action__desc">View requests</span>
                    </div>
                    <span className="quick-action__arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => navigate("/jobsites")}
                  >
                    <span className="quick-action__icon quick-action__icon--purple">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </span>
                    <div className="quick-action__text">
                      <span className="quick-action__title">Jobsites</span>
                      <span className="quick-action__desc">Manage locations</span>
                    </div>
                    <span className="quick-action__arrow">→</span>
                  </button>

                  {loggedInUser.role === "admin" && (
                    <button
                      type="button"
                      className="quick-action"
                      onClick={() => navigate("/admin")}
                    >
                      <span className="quick-action__icon quick-action__icon--red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <div className="quick-action__text">
                        <span className="quick-action__title">Admin</span>
                        <span className="quick-action__desc">Manage users</span>
                      </div>
                      <span className="quick-action__arrow">→</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Inventory Breakdown */}
          <section className="dashboard-panel dashboard-panel--full">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">Inventory Breakdown</h2>
            </div>
            <div className="dashboard-panel__content">
              <div className="breakdown-grid">
                <div className="breakdown-item">
                  <span className="breakdown-item__label">Materials</span>
                  <span className="breakdown-item__value">{materialCount}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-item__label">Equipment</span>
                  <span className="breakdown-item__value">{equipmentCount}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-item__label">Warehouse</span>
                  <span className="breakdown-item__value">
                    {inventoryItems.filter(i => i.location === "warehouse").length}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-item__label">Yard</span>
                  <span className="breakdown-item__value">
                    {inventoryItems.filter(i => i.location === "yard").length}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-item__label">Jobsites</span>
                  <span className="breakdown-item__value">
                    {inventoryItems.filter(i => i.location === "jobsite").length}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Stats Detail Modal */}
      {activeModal && modalContent && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h2 className="modal__title">{modalContent.title}</h2>
                <p className="modal__subtitle">{modalContent.subtitle}</p>
              </div>
              <button
                className="modal__close"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
              >
                {Icons.close}
              </button>
            </div>

            <div className="modal__body">
              {modalContent.items.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No items</div>
                  <div className="empty-state__hint">
                    No items match this criteria.
                  </div>
                </div>
              ) : (
                <div className="modal-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        {modalContent.columns.includes('name') && <th>Name</th>}
                        {modalContent.columns.includes('type') && <th>Type</th>}
                        {modalContent.columns.includes('location') && <th>Location</th>}
                        {modalContent.columns.includes('quantity') && <th>Qty</th>}
                        {modalContent.columns.includes('supplier') && <th>Supplier</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {modalContent.items.slice(0, 10).map((item) => (
                        <tr key={item.item_id}>
                          {modalContent.columns.includes('name') && (
                            <td><strong>{item.name}</strong></td>
                          )}
                          {modalContent.columns.includes('type') && (
                            <td>
                              <span className={`badge ${item.type === 'equipment' ? 'badge--red' : 'badge--blue'}`}>
                                {item.type}
                              </span>
                            </td>
                          )}
                          {modalContent.columns.includes('location') && (
                            <td>
                              <span className="badge badge--location">{item.location}</span>
                            </td>
                          )}
                          {modalContent.columns.includes('quantity') && (
                            <td className="mono">{item.quantity}</td>
                          )}
                          {modalContent.columns.includes('supplier') && (
                            <td>{item.supplier || '—'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {modalContent.items.length > 10 && (
                    <div className="modal-table-more">
                      Showing 10 of {modalContent.items.length} items.{' '}
                      <button
                        className="btn btn--ghost small-button"
                        onClick={() => {
                          setActiveModal(null);
                          navigate('/inventory');
                        }}
                      >
                        View all in Inventory →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
