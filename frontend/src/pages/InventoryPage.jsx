import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "material",
  location: "warehouse",
  jobsite_id: "",
  quantity: "",
  price: "",
  supplier: "",
};

function InventoryPage({
  loggedInUser,
  onLogout,
  inventoryItems,
  jobsites = [],
  onLoadInventory,
  onLoadJobsites,
  onAddItem,
  onDeleteItem,
  onReassignItem,
  onCreateRequest,
  message,
  error,
}) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobsiteFilter, setJobsiteFilter] = useState("");

  // Request modal state
  const [requestModalItem, setRequestModalItem] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Reassign modal state
  const [reassignItem, setReassignItem] = useState(null);
  const [reassignLocation, setReassignLocation] = useState("warehouse");
  const [reassignJobsiteId, setReassignJobsiteId] = useState("");
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  useEffect(() => {
    if (onLoadJobsites) {
      onLoadJobsites();
    }
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formValues.name,
      description: formValues.description,
      type: formValues.type,
      location: formValues.location,
      quantity: Number(formValues.quantity),
      price: formValues.price,
      supplier: formValues.supplier,
    };

    if (formValues.location === "jobsite" && formValues.jobsite_id) {
      payload.jobsite_id = parseInt(formValues.jobsite_id, 10);
    }

    const success = await onAddItem(payload);

    setSubmitting(false);

    if (success) {
      setFormValues(EMPTY_FORM);
      setShowAddForm(false);
    }
  };

  const filterItems = (items, query, location, jobsiteId) => {
    let filtered = items;

    // Filter by location
    if (location) {
      filtered = filtered.filter((item) => item.location === location);
    }

    // Filter by jobsite
    if (jobsiteId) {
      const jsId = parseInt(jobsiteId, 10);
      filtered = filtered.filter((item) => item.jobsite_id === jsId);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.supplier?.toLowerCase().includes(lowerQuery) ||
        item.jobsite_name?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  };

  const filteredItems = filterItems(
    inventoryItems,
    searchQuery,
    locationFilter,
    jobsiteFilter
  );

  const handleOpenRequestModal = (item) => {
    setRequestModalItem(item);
    setRequestQuantity("");
    setRequestNotes("");
  };

  const handleCloseRequestModal = () => {
    setRequestModalItem(null);
    setRequestQuantity("");
    setRequestNotes("");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);

    const success = await onCreateRequest({
      item_id: requestModalItem.item_id,
      quantity_requested: Number(requestQuantity),
      notes: requestNotes,
    });

    setRequestSubmitting(false);

    if (success) {
      handleCloseRequestModal();
    }
  };

  const handleOpenReassignModal = (item) => {
    setReassignItem(item);
    setReassignLocation(item.location);
    setReassignJobsiteId(item.jobsite_id ? String(item.jobsite_id) : "");
  };

  const handleCloseReassignModal = () => {
    setReassignItem(null);
    setReassignJobsiteId("");
  };

  const handleSubmitReassign = async (e) => {
    e.preventDefault();
    setReassignSubmitting(true);

    const payload = { location: reassignLocation };
    if (reassignLocation === "jobsite") {
      payload.jobsite_id = reassignJobsiteId
        ? parseInt(reassignJobsiteId, 10)
        : null;
    }

    const success = await onReassignItem(reassignItem.item_id, payload);
    setReassignSubmitting(false);

    if (success) {
      handleCloseReassignModal();
    }
  };

  const sortedJobsites = [...jobsites].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

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
                    <label htmlFor="location">Location</label>
                    <select
                      id="location"
                      name="location"
                      value={formValues.location}
                      onChange={handleFieldChange}
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="yard">Yard</option>
                      <option value="jobsite">Jobsite</option>
                    </select>
                  </div>

                  {formValues.location === "jobsite" && (
                    <div className="field">
                      <label htmlFor="jobsite_id">Jobsite</label>
                      <select
                        id="jobsite_id"
                        name="jobsite_id"
                        value={formValues.jobsite_id}
                        onChange={handleFieldChange}
                        required
                      >
                        <option value="">-- Select a jobsite --</option>
                        {sortedJobsites.map((js) => (
                          <option key={js.jobsite_id} value={js.jobsite_id}>
                            {js.name}
                          </option>
                        ))}
                      </select>
                      {sortedJobsites.length === 0 && (
                        <p className="panel__hint">
                          No jobsites yet — create one on the Jobsites tab
                          first.
                        </p>
                      )}
                    </div>
                  )}

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
                  {searchQuery
                    ? `${filteredItems.length} of ${inventoryItems.length} items`
                    : `${inventoryItems.length} ${inventoryItems.length === 1 ? "item" : "items"} loaded`}
                </p>
              </div>

              <div className="filter-controls">
                <select
                  className="location-filter"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    if (e.target.value !== "jobsite") {
                      setJobsiteFilter("");
                    }
                  }}
                >
                  <option value="">All Locations</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="yard">Yard</option>
                  <option value="jobsite">Jobsite</option>
                </select>

                {sortedJobsites.length > 0 && (
                  <select
                    className="location-filter"
                    value={jobsiteFilter}
                    onChange={(e) => setJobsiteFilter(e.target.value)}
                  >
                    <option value="">All jobsites</option>
                    {sortedJobsites.map((js) => (
                      <option key={js.jobsite_id} value={js.jobsite_id}>
                        {js.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="search-wrapper">
                  <input
                    type="text"
                    className="search-bar"
                    placeholder="Search by name, description, or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">
                    {searchQuery ? "No matching items" : "No inventory loaded"}
                  </div>
                  <div className="empty-state__hint">
                    {searchQuery
                      ? "Try adjusting your search terms."
                      : "Hit Refresh to pull the latest items, or add one to get started."}
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
                      <th>Location</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Supplier</th>
                      <th>Created by</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
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
                        <td>
                          <span className="badge badge--location">
                            {item.location === "jobsite" && item.jobsite_name
                              ? `Jobsite: ${item.jobsite_name}`
                              : item.location}
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
                        <td className="actions-cell">
                          <button
                            className="btn btn--request small-button"
                            onClick={() => handleOpenRequestModal(item)}
                          >
                            Request
                          </button>
                          <button
                            className="btn btn--outline small-button"
                            onClick={() => handleOpenReassignModal(item)}
                          >
                            Reassign
                          </button>
                          {deleteMode && (
                            <button
                              className="btn btn--danger small-button"
                              onClick={() => onDeleteItem(item.item_id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Reassign Modal */}
      {reassignItem && (
        <div className="modal-overlay" onClick={handleCloseReassignModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Reassign item</h2>
              <button
                className="modal__close"
                onClick={handleCloseReassignModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal__body">
              <p className="modal__item-info">
                <strong>{reassignItem.name}</strong>
                <br />
                <span className="modal__item-stock">
                  Currently at:{" "}
                  {reassignItem.location === "jobsite" &&
                  reassignItem.jobsite_name
                    ? `${reassignItem.jobsite_name} (jobsite)`
                    : reassignItem.location}
                </span>
              </p>

              <form onSubmit={handleSubmitReassign}>
                <div className="field">
                  <label htmlFor="reassign-location">New location</label>
                  <select
                    id="reassign-location"
                    value={reassignLocation}
                    onChange={(e) => setReassignLocation(e.target.value)}
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="yard">Yard</option>
                    <option value="jobsite">Jobsite</option>
                  </select>
                </div>

                {reassignLocation === "jobsite" && (
                  <div className="field">
                    <label htmlFor="reassign-jobsite">Jobsite</label>
                    <select
                      id="reassign-jobsite"
                      value={reassignJobsiteId}
                      onChange={(e) => setReassignJobsiteId(e.target.value)}
                      required
                    >
                      <option value="">-- Select a jobsite --</option>
                      {sortedJobsites.map((js) => (
                        <option key={js.jobsite_id} value={js.jobsite_id}>
                          {js.name}
                        </option>
                      ))}
                    </select>
                    {sortedJobsites.length === 0 && (
                      <p className="panel__hint">
                        No jobsites yet — create one on the Jobsites tab first.
                      </p>
                    )}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleCloseReassignModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={
                      reassignSubmitting ||
                      (reassignLocation === "jobsite" && !reassignJobsiteId)
                    }
                  >
                    {reassignSubmitting ? "Saving…" : "Reassign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {requestModalItem && (
        <div className="modal-overlay" onClick={handleCloseRequestModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Request Material</h2>
              <button
                className="modal__close"
                onClick={handleCloseRequestModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal__body">
              <p className="modal__item-info">
                <strong>{requestModalItem.name}</strong>
                <br />
                <span className="modal__item-stock">
                  Available: {requestModalItem.quantity} units
                </span>
              </p>

              <form onSubmit={handleSubmitRequest}>
                <div className="field">
                  <label htmlFor="requestQuantity">Quantity needed</label>
                  <input
                    id="requestQuantity"
                    type="number"
                    min="1"
                    max={requestModalItem.quantity}
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="requestNotes">Notes (optional)</label>
                  <textarea
                    id="requestNotes"
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Add any notes about this request..."
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleCloseRequestModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={requestSubmitting}
                  >
                    {requestSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
