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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function InventoryPage({
  loggedInUser,
  onLogout,
  inventoryItems,
  jobsites = [],
  onLoadInventory,
  onLoadJobsites,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReportItemStatus,
  onUploadItemPhoto,
  onCreateRequest,
  message,
  error,
}) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobsiteFilter, setJobsiteFilter] = useState("");

  // Request modal state
  const [requestModalItem, setRequestModalItem] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestJobsiteId, setRequestJobsiteId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Photo upload state
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  // Edit modal state
  const [editItem, setEditItem] = useState(null);
  const [editFormValues, setEditFormValues] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

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
    setRequestJobsiteId("");
    setRequestNotes("");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);

    const payload = {
      item_id: requestModalItem.item_id,
      quantity_requested: Number(requestQuantity),
      notes: requestNotes,
    };

    // Include jobsite if selected
    if (requestJobsiteId) {
      payload.jobsite_id = parseInt(requestJobsiteId, 10);
    }

    const success = await onCreateRequest(payload);

    setRequestSubmitting(false);

    if (success) {
      handleCloseRequestModal();
    }
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setEditFormValues({
      name: item.name,
      description: item.description,
      type: item.type,
      location: item.location,
      jobsite_id: item.jobsite_id ? String(item.jobsite_id) : "",
      quantity: String(item.quantity),
      price: item.price,
      supplier: item.supplier,
    });
  };

  const handleCloseEditModal = () => {
    setEditItem(null);
    setEditFormValues(EMPTY_FORM);
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);

    const payload = {
      name: editFormValues.name,
      description: editFormValues.description,
      type: editFormValues.type,
      location: editFormValues.location,
      quantity: Number(editFormValues.quantity),
      price: editFormValues.price,
      supplier: editFormValues.supplier,
    };

    if (editFormValues.location === "jobsite" && editFormValues.jobsite_id) {
      payload.jobsite_id = parseInt(editFormValues.jobsite_id, 10);
    }

    const success = await onUpdateItem(editItem.item_id, payload);
    setEditSubmitting(false);

    if (success) {
      handleCloseEditModal();
    }
  };

  const sortedJobsites = [...jobsites].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handlePhotoUpload = async (itemId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotoId(itemId);
    await onUploadItemPhoto(itemId, file);
    setUploadingPhotoId(null);
    e.target.value = "";
  };

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
              {deleteMode ? (
                <>
                  {selectedForDelete.length > 0 && (
                    <button
                      className="btn btn--danger"
                      onClick={() => {
                        if (window.confirm(`Delete ${selectedForDelete.length} item(s)? This cannot be undone.`)) {
                          selectedForDelete.forEach((id) => onDeleteItem(id));
                          setSelectedForDelete([]);
                          setDeleteMode(false);
                        }
                      }}
                    >
                      Delete {selectedForDelete.length} item(s)
                    </button>
                  )}
                  <button
                    className="btn btn--ghost"
                    onClick={() => {
                      setDeleteMode(false);
                      setSelectedForDelete([]);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn--danger"
                    onClick={() => {
                      setShowAddForm(false);
                      setDeleteMode(true);
                      setSelectedForDelete([]);
                    }}
                  >
                    Delete items
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => setShowAddForm((prev) => !prev)}
                  >
                    {showAddForm ? "Cancel" : "+ Add item"}
                  </button>
                </>
              )}
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
                    <label htmlFor="name">Name *</label>
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
                      <label htmlFor="jobsite_id">Jobsite *</label>
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
                    <label htmlFor="quantity">Quantity *</label>
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
                    <label htmlFor="price">Price (USD) *</label>
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
                    <label htmlFor="supplier">Supplier *</label>
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
                      : "No items in inventory yet. Add one to get started."}
                  </div>
                </div>
              ) : (
                <table className="inventory-table inventory-table--compact">
                  <thead>
                    <tr>
                      {deleteMode && <th className="checkbox-col"></th>}
                      <th>Photo</th>
                      <th>Item</th>
                      <th>Location</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Qty</th>
                      <th>Details</th>
                      {!deleteMode && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.item_id} className={`${item.status === "missing" ? "row--missing" : ""} ${selectedForDelete.includes(item.item_id) ? "row--selected" : ""}`}>
                        {deleteMode && (
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={selectedForDelete.includes(item.item_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForDelete((prev) => [...prev, item.item_id]);
                                } else {
                                  setSelectedForDelete((prev) => prev.filter((id) => id !== item.item_id));
                                }
                              }}
                            />
                          </td>
                        )}
                        <td>
                          <label className="item-photo-btn item-photo-btn--small">
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => handlePhotoUpload(item.item_id, e)}
                              disabled={uploadingPhotoId === item.item_id}
                            />
                            {uploadingPhotoId === item.item_id ? (
                              <span className="photo-loading">...</span>
                            ) : item.photo_url ? (
                              <img
                                src={`${API_BASE}${item.photo_url}`}
                                alt={item.name}
                                className="item-photo-thumb"
                              />
                            ) : (
                              <span className="photo-placeholder">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <polyline points="21 15 16 10 5 21"/>
                                </svg>
                              </span>
                            )}
                          </label>
                        </td>
                        <td>
                          <div className="item-cell">
                            <strong className="item-cell__name">{item.name}</strong>
                            <span className="item-cell__desc">{item.description}</span>
                            <span className={`badge badge--tiny ${item.type === "equipment" ? "badge--red" : "badge--blue"}`}>
                              {item.type}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--location">
                            {item.location === "jobsite" && item.jobsite_name
                              ? item.jobsite_name
                              : item.location}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${item.status === "missing" ? "badge--missing" : "badge--available"}`}>
                            {item.status === "missing" ? "Missing" : "In Stock"}
                          </span>
                        </td>
                        <td className="text-center mono">{item.quantity}</td>
                        <td>
                          <div className="details-cell">
                            <span className="details-cell__price">${item.price}</span>
                            <span className="details-cell__supplier">{item.supplier}</span>
                          </div>
                        </td>
                        {!deleteMode && (
                          <td className="actions-cell">
                            {item.status === "missing" ? (
                              <button
                                className="btn btn--success btn--sm"
                                onClick={() => onReportItemStatus(item.item_id, "available")}
                              >
                                Found
                              </button>
                            ) : (
                              <button
                                className="btn btn--warning btn--sm"
                                onClick={() => onReportItemStatus(item.item_id, "missing")}
                              >
                                Missing
                              </button>
                            )}
                            <button
                              className="btn btn--outline btn--sm"
                              onClick={() => handleOpenRequestModal(item)}
                            >
                              Request
                            </button>
                            <button
                              className="btn btn--icon btn--sm"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit item"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                              </svg>
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
                  Currently in stock: {requestModalItem.quantity} units
                </span>
              </p>

              <form onSubmit={handleSubmitRequest}>
                <div className="field">
                  <label htmlFor="requestQuantity">Quantity needed</label>
                  <input
                    id="requestQuantity"
                    type="number"
                    min="1"
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="requestJobsite">Destination jobsite</label>
                  <select
                    id="requestJobsite"
                    value={requestJobsiteId}
                    onChange={(e) => setRequestJobsiteId(e.target.value)}
                  >
                    <option value="">-- No specific jobsite --</option>
                    {sortedJobsites.map((js) => (
                      <option key={js.jobsite_id} value={js.jobsite_id}>
                        {js.name}
                      </option>
                    ))}
                  </select>
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

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Edit Item</h2>
              <button
                className="modal__close"
                onClick={handleCloseEditModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal__body">
              <form onSubmit={handleSubmitEdit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="edit-name">Name *</label>
                    <input
                      id="edit-name"
                      name="name"
                      value={editFormValues.name}
                      onChange={handleEditFieldChange}
                      required
                    />
                  </div>

                  <div className="field field--full">
                    <label htmlFor="edit-description">Description</label>
                    <input
                      id="edit-description"
                      name="description"
                      value={editFormValues.description}
                      onChange={handleEditFieldChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="edit-type">Type</label>
                    <select
                      id="edit-type"
                      name="type"
                      value={editFormValues.type}
                      onChange={handleEditFieldChange}
                    >
                      <option value="material">Material</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="edit-location">Location</label>
                    <select
                      id="edit-location"
                      name="location"
                      value={editFormValues.location}
                      onChange={handleEditFieldChange}
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="yard">Yard</option>
                      <option value="jobsite">Jobsite</option>
                    </select>
                  </div>

                  {editFormValues.location === "jobsite" && (
                    <div className="field">
                      <label htmlFor="edit-jobsite">Jobsite *</label>
                      <select
                        id="edit-jobsite"
                        name="jobsite_id"
                        value={editFormValues.jobsite_id}
                        onChange={handleEditFieldChange}
                        required
                      >
                        <option value="">-- Select a jobsite --</option>
                        {sortedJobsites.map((js) => (
                          <option key={js.jobsite_id} value={js.jobsite_id}>
                            {js.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="edit-quantity">Quantity *</label>
                    <input
                      id="edit-quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={editFormValues.quantity}
                      onChange={handleEditFieldChange}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="edit-price">Price (USD) *</label>
                    <input
                      id="edit-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormValues.price}
                      onChange={handleEditFieldChange}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="edit-supplier">Supplier *</label>
                    <input
                      id="edit-supplier"
                      name="supplier"
                      value={editFormValues.supplier}
                      onChange={handleEditFieldChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
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
