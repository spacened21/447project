import { useState, useEffect } from "react";
import Header from "../components/Header";

// Amazon-style tracking stepper component
function RequestTracker({ status }) {
  const steps = [
    { key: "pending", label: "Submitted" },
    { key: "approved", label: "Approved" },
    { key: "fulfilled", label: "Completed" },
  ];

  const getStepState = (stepKey) => {
    if (status === "denied" || status === "cancelled") {
      if (stepKey === "pending") return "completed";
      if (stepKey === "approved") return status === "denied" ? "denied" : "cancelled";
      return "inactive";
    }

    const statusOrder = ["pending", "approved", "fulfilled"];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "inactive";
  };

  return (
    <div className="request-tracker">
      {steps.map((step, index) => {
        const state = getStepState(step.key);
        return (
          <div key={step.key} className="request-tracker__step">
            <div className={`request-tracker__circle request-tracker__circle--${state}`}>
              {state === "completed" && "✓"}
              {state === "denied" && "✕"}
              {state === "cancelled" && "—"}
              {state === "current" && (index + 1)}
              {state === "inactive" && (index + 1)}
            </div>
            <span className={`request-tracker__label request-tracker__label--${state}`}>
              {step.key === "approved" && status === "denied"
                ? "Denied"
                : step.key === "approved" && status === "cancelled"
                ? "Cancelled"
                : step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`request-tracker__line request-tracker__line--${state === "completed" ? "completed" : "inactive"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RequestsPage({
  loggedInUser,
  onLogout,
  materialRequests,
  inventoryItems = [],
  jobsites = [],
  onLoadRequests,
  onLoadInventory,
  onLoadJobsites,
  onCreateRequest,
  onUpdateRequestStatus,
  message,
  error,
}) {
  const [myActivityOnly, setMyActivityOnly] = useState(false);
  const [viewMode, setViewMode] = useState("tracker"); // "tracker" or "table"

  // New request modal state
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestMode, setRequestMode] = useState("existing"); // "existing" or "new"
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("material");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestJobsiteId, setRequestJobsiteId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onLoadRequests();
    if (onLoadInventory) onLoadInventory();
    if (onLoadJobsites) onLoadJobsites();
  }, []);

  const sortedJobsites = [...jobsites].sort((a, b) => a.name.localeCompare(b.name));
  const sortedItems = [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenNewRequest = () => {
    setShowNewRequest(true);
    setRequestMode("existing");
    setSelectedItemId("");
    setNewItemName("");
    setNewItemType("material");
    setRequestQuantity("");
    setRequestJobsiteId("");
    setRequestNotes("");
  };

  const handleCloseNewRequest = () => {
    setShowNewRequest(false);
  };

  const handleSubmitNewRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      quantity_requested: Number(requestQuantity),
      notes: requestNotes,
    };

    if (requestMode === "existing") {
      payload.item_id = parseInt(selectedItemId, 10);
    } else {
      // New item request
      payload.new_item_name = newItemName;
      payload.new_item_type = newItemType;
    }

    if (requestJobsiteId) {
      payload.jobsite_id = parseInt(requestJobsiteId, 10);
    }

    const success = await onCreateRequest(payload);
    setSubmitting(false);

    if (success) {
      handleCloseNewRequest();
    }
  };

  const handleCancelRequest = (requestId) => {
    if (window.confirm("Cancel this request?")) {
      onUpdateRequestStatus(requestId, "cancelled");
    }
  };

  const filterActivity = (requests) => {
    let filtered = requests;

    if (myActivityOnly) {
      filtered = filtered.filter((r) => r.requester === loggedInUser.username);
    }

    // Sort by most recent first
    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  };

  const filteredActivity = filterActivity(materialRequests);

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Records</span>
              <h1 className="page-header__title">Material Requests</h1>
              <p className="page-header__subtitle">
                Track material requests and their approval status.
              </p>
            </div>
            <button className="btn btn--primary" onClick={handleOpenNewRequest}>
              New Request
            </button>
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

          <section className="panel">
            <div className="panel__header" style={{ marginBottom: 0 }}>
              <div>
                <h2 className="panel__title">Request History</h2>
                <p className="panel__hint">
                  {filteredActivity.length}{" "}
                  {filteredActivity.length === 1 ? "request" : "requests"}
                </p>
              </div>

              <div className="filter-controls">
                <div className="view-toggle">
                  <button
                    className={`view-toggle__btn ${viewMode === "tracker" ? "view-toggle__btn--active" : ""}`}
                    onClick={() => setViewMode("tracker")}
                  >
                    Tracker
                  </button>
                  <button
                    className={`view-toggle__btn ${viewMode === "table" ? "view-toggle__btn--active" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    Table
                  </button>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={myActivityOnly}
                    onChange={(e) => setMyActivityOnly(e.target.checked)}
                  />
                  My requests only
                </label>
              </div>
            </div>

            {filteredActivity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__title">No requests yet</div>
                <div className="empty-state__hint">
                  {myActivityOnly
                    ? "You haven't made any material requests yet."
                    : "No material requests have been made yet."}
                </div>
              </div>
            ) : viewMode === "tracker" ? (
              /* Tracker View (Amazon-style cards) */
              <div className="request-cards">
                {filteredActivity.map((entry) => (
                  <div key={entry.request_id} className={`request-card request-card--${entry.status}`}>
                    <div className="request-card__header">
                      <div className="request-card__info">
                        <span className="request-card__id">Request #{entry.request_id}</span>
                        <span className="request-card__date">{formatDate(entry.created_at)}</span>
                      </div>
                      <span className={`badge badge--${entry.status}`}>
                        {entry.status === "fulfilled" ? "completed" : entry.status}
                      </span>
                    </div>

                    <div className="request-card__body">
                      <div className="request-card__item">
                        <strong className="request-card__item-name">
                          {entry.item_name}
                          {entry.is_new_item && <span className="badge badge--new">New</span>}
                        </strong>
                        <span className="request-card__qty">× {entry.quantity_requested}</span>
                      </div>
                      <div className="request-card__meta">
                        <span>Requested by <strong>{entry.requester}</strong></span>
                        {entry.jobsite_name && (
                          <span className="request-card__destination">
                            → <strong>{entry.jobsite_name}</strong>
                          </span>
                        )}
                        {entry.notes && <span className="request-card__notes">"{entry.notes}"</span>}
                      </div>
                    </div>

                    <RequestTracker status={entry.status} />

                    <div className="request-card__actions">
                      {loggedInUser.role === "admin" && entry.status === "pending" && (
                        <>
                          <button
                            className="btn btn--success"
                            onClick={() => onUpdateRequestStatus(entry.request_id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn--danger"
                            onClick={() => onUpdateRequestStatus(entry.request_id, "denied")}
                          >
                            Deny
                          </button>
                        </>
                      )}
                      {loggedInUser.role === "admin" && entry.status === "approved" && (
                        <button
                          className="btn btn--primary"
                          onClick={() => onUpdateRequestStatus(entry.request_id, "fulfilled")}
                        >
                          Mark Complete
                        </button>
                      )}
                      {(entry.status === "pending" || entry.status === "approved") &&
                        entry.requester === loggedInUser.username && (
                          <button
                            className="btn btn--ghost"
                            onClick={() => handleCancelRequest(entry.request_id)}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View (Simple text-based) */
              <div className="table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Requester</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.map((entry) => (
                      <tr key={entry.request_id}>
                        <td className="mono">#{entry.request_id}</td>
                        <td>
                          <strong>
                            {entry.item_name}
                            {entry.is_new_item && <span className="badge badge--new">New</span>}
                          </strong>
                          {entry.notes && (
                            <div className="table-notes">"{entry.notes}"</div>
                          )}
                        </td>
                        <td className="mono">{entry.quantity_requested}</td>
                        <td>
                          <span className="badge badge--neutral">{entry.requester}</span>
                        </td>
                        <td>
                          {entry.jobsite_name ? (
                            <span className="badge badge--location">{entry.jobsite_name}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--${entry.status}`}>
                            {entry.status === "fulfilled" ? "completed" : entry.status}
                          </span>
                        </td>
                        <td className="mono">{formatDate(entry.created_at)}</td>
                        <td className="actions-cell">
                          {loggedInUser.role === "admin" && entry.status === "pending" && (
                            <>
                              <button
                                className="btn btn--success btn--sm"
                                onClick={() => onUpdateRequestStatus(entry.request_id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => onUpdateRequestStatus(entry.request_id, "denied")}
                              >
                                Deny
                              </button>
                            </>
                          )}
                          {loggedInUser.role === "admin" && entry.status === "approved" && (
                            <button
                              className="btn btn--primary btn--sm"
                              onClick={() => onUpdateRequestStatus(entry.request_id, "fulfilled")}
                            >
                              Complete
                            </button>
                          )}
                          {(entry.status === "pending" || entry.status === "approved") &&
                            entry.requester === loggedInUser.username && (
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => handleCancelRequest(entry.request_id)}
                              >
                                Cancel
                              </button>
                            )}
                          {(entry.status === "denied" || entry.status === "fulfilled" || entry.status === "cancelled") && "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* New Request Modal */}
          {showNewRequest && (
            <div className="modal-overlay" onClick={handleCloseNewRequest}>
              <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                  <h2>New Material Request</h2>
                  <button className="modal__close" onClick={handleCloseNewRequest}>
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmitNewRequest}>
                  <div className="modal__body">
                    <div className="form-group">
                      <label>Request Type</label>
                      <div className="toggle-group">
                        <button
                          type="button"
                          className={`toggle-group__btn ${requestMode === "existing" ? "toggle-group__btn--active" : ""}`}
                          onClick={() => setRequestMode("existing")}
                        >
                          Existing Item
                        </button>
                        <button
                          type="button"
                          className={`toggle-group__btn ${requestMode === "new" ? "toggle-group__btn--active" : ""}`}
                          onClick={() => setRequestMode("new")}
                        >
                          New Item
                        </button>
                      </div>
                    </div>

                    {requestMode === "existing" ? (
                      <div className="form-group">
                        <label htmlFor="requestItem">Item *</label>
                        <select
                          id="requestItem"
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          required
                        >
                          <option value="">Select an item...</option>
                          {sortedItems.map((item) => (
                            <option key={item.item_id} value={item.item_id}>
                              {item.name} (Qty: {item.quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label htmlFor="newItemName">Item Name *</label>
                          <input
                            id="newItemName"
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. Copper pipe 1/2 inch"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="newItemType">Type</label>
                          <select
                            id="newItemType"
                            value={newItemType}
                            onChange={(e) => setNewItemType(e.target.value)}
                          >
                            <option value="material">Material</option>
                            <option value="equipment">Equipment</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label htmlFor="requestQty">Quantity *</label>
                      <input
                        id="requestQty"
                        type="number"
                        min="1"
                        value={requestQuantity}
                        onChange={(e) => setRequestQuantity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="requestJobsite">Destination Jobsite</label>
                      <select
                        id="requestJobsite"
                        value={requestJobsiteId}
                        onChange={(e) => setRequestJobsiteId(e.target.value)}
                      >
                        <option value="">None (Warehouse pickup)</option>
                        {sortedJobsites.map((js) => (
                          <option key={js.jobsite_id} value={js.jobsite_id}>
                            {js.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="requestNotes">Notes</label>
                      <textarea
                        id="requestNotes"
                        rows={3}
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                        placeholder="Any additional details..."
                      />
                    </div>
                  </div>

                  <div className="modal__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={handleCloseNewRequest}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={
                        submitting ||
                        !requestQuantity ||
                        (requestMode === "existing" && !selectedItemId) ||
                        (requestMode === "new" && !newItemName)
                      }
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default RequestsPage;
