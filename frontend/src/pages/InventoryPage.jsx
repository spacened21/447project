import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.webp";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "material",
  quantity: "",
  price: "",
  supplier: "",
};

function InventoryPage({
  inventoryItems,
  onLoadInventory,
  onAddItem,
  onDeleteItem,
  message,
  error,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await onAddItem({
      name: formValues.name,
      description: formValues.description,
      type: formValues.type,
      quantity: Number(formValues.quantity),
      price: formValues.price,
      supplier: formValues.supplier,
    });

    setSubmitting(false);

    if (success) {
      setFormValues(EMPTY_FORM);
      setShowAddForm(false);
    }
  };

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
              <small>Inventory suite</small>
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
            <button
              className="btn btn--ghost small-button"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Operations</span>
              <h1 className="page-header__title">Inventory</h1>
              <p className="page-header__subtitle">
                Review stock, add new items, and remove records as your team
                makes updates.
              </p>
            </div>

            <div className="page-actions">
              <button
                className="btn btn--outline"
                onClick={() => {
                  setShowAddForm(false);
                  setDeleteMode(false);
                  onLoadInventory();
                }}
              >
                Refresh
              </button>
              <button
                className={`btn ${
                  deleteMode ? "btn--ghost" : "btn--danger"
                }`}
                onClick={() => {
                  setShowAddForm(false);
                  setDeleteMode((prev) => !prev);
                }}
              >
                {deleteMode ? "Done deleting" : "Delete items"}
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setDeleteMode(false);
                  setShowAddForm((prev) => !prev);
                }}
              >
                {showAddForm ? "Cancel" : "+ Add item"}
              </button>
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

          {showAddForm && (
            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2 className="panel__title">Add a new item</h2>
                  <p className="panel__hint">
                    All fields are required. Items appear in the table once
                    saved.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitAdd}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      name="name"
                      value={formValues.name}
                      onChange={handleFieldChange}
                      placeholder="e.g. Safety helmet"
                      required
                    />
                  </div>

                  <div className="field field--full">
                    <label htmlFor="description">Description</label>
                    <input
                      id="description"
                      name="description"
                      value={formValues.description}
                      onChange={handleFieldChange}
                      placeholder="Short description of the item"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={formValues.type}
                      onChange={handleFieldChange}
                    >
                      <option value="material">Material</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={formValues.quantity}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="price">Price (USD)</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formValues.price}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="supplier">Supplier</label>
                    <input
                      id="supplier"
                      name="supplier"
                      value={formValues.supplier}
                      onChange={handleFieldChange}
                      placeholder="Supplier name"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormValues(EMPTY_FORM);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Save item"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="table-card">
            <div className="table-card__header">
              <div>
                <h2>All items</h2>
                <p>
                  {inventoryItems.length}{" "}
                  {inventoryItems.length === 1 ? "item" : "items"} loaded
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              {inventoryItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No inventory loaded</div>
                  <div className="empty-state__hint">
                    Hit Refresh to pull the latest items, or add one to get
                    started.
                  </div>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Supplier</th>
                      <th>Created by</th>
                      {deleteMode && <th aria-label="Actions" />}
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((item) => (
                      <tr key={item.item_id}>
                        <td className="mono">#{item.item_id}</td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>{item.description}</td>
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
                        <td className="mono">{item.quantity}</td>
                        <td className="mono">${item.price}</td>
                        <td>{item.supplier}</td>
                        <td>
                          <span className="badge badge--neutral">
                            {item.created_by}
                          </span>
                        </td>
                        {deleteMode && (
                          <td>
                            <button
                              className="btn btn--danger small-button"
                              onClick={() => onDeleteItem(item.item_id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InventoryPage;
