import { useState, useEffect } from "react";
import Header from "../components/Header";
import { API_BASE } from "../api";

// Camera icon for packing slip upload
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

function DeliveriesPage({
  loggedInUser,
  deliveries,
  inventoryItems,
  jobsites = [],
  materialRequests = [],
  onLoadDeliveries,
  onCreateDelivery,
  onDeleteDelivery,
  onLoadInventory,
  onLoadJobsites,
  onLoadRequests,
  onUploadPackingSlip,
  message,
  error,
}) {
  const [showForm, setShowForm] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [location, setLocation] = useState("warehouse");
  const [jobsiteId, setJobsiteId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);

  useEffect(() => {
    onLoadDeliveries();
    onLoadInventory();
    if (onLoadJobsites) {
      onLoadJobsites();
    }
    if (onLoadRequests) {
      onLoadRequests();
    }
  }, []);

  const sortedJobsites = [...jobsites].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Get approved requests that can be fulfilled
  const approvedRequests = materialRequests.filter((r) => r.status === "approved");

  const handleRequestToggle = (requestId) => {
    const request = approvedRequests.find((r) => r.request_id === requestId);
    if (!request) return;

    if (selectedRequestIds.includes(requestId)) {
      // Deselecting - remove from selected and remove auto-added item
      setSelectedRequestIds((prev) => prev.filter((id) => id !== requestId));
      setItems((prev) => prev.filter((item) => item.from_request_id !== requestId));
    } else {
      // Selecting - add to selected and auto-add item
      setSelectedRequestIds((prev) => [...prev, requestId]);
      setItems((prev) => [
        ...prev,
        {
          item_name: request.item_name,
          item_type: "material",
          quantity: request.quantity_requested,
          description: `Fulfilling request #${requestId}`,
          existing_item_id: String(request.item_id),
          from_request_id: requestId,
        },
      ]);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);
  };

  const handleRemoveItemRow = (index) => {
    const itemToRemove = items[index];

    // If this item came from a request, deselect that request
    if (itemToRemove.from_request_id) {
      setSelectedRequestIds((prev) =>
        prev.filter((id) => id !== itemToRemove.from_request_id)
      );
    }

    // Remove the item (allow removing last item only if it's from a request)
    if (items.length > 1 || itemToRemove.from_request_id) {
      const newItems = items.filter((_, i) => i !== index);
      // Ensure at least one empty row remains for manual entry
      if (newItems.length === 0) {
        setItems([{ item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);
      } else {
        setItems(newItems);
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // If selecting existing item, populate the name
    if (field === "existing_item_id" && value) {
      const existingItem = inventoryItems.find(i => i.item_id === parseInt(value));
      if (existingItem) {
        updated[index].item_name = existingItem.name;
        updated[index].item_type = existingItem.type;
      }
    }

    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter(i => i.item_name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      return;
    }

    if (location === "jobsite" && !jobsiteId) {
      return;
    }

    const payload = {
      supplier,
      location,
      notes,
      items: validItems.map(i => ({
        ...i,
        existing_item_id: i.existing_item_id ? parseInt(i.existing_item_id) : null,
        add_to_inventory: !i.existing_item_id,
      })),
      fulfill_request_ids: selectedRequestIds,
    };

    if (location === "jobsite") {
      payload.jobsite_id = parseInt(jobsiteId, 10);
    }

    const success = await onCreateDelivery(payload);

    if (success) {
      setSupplier("");
      setLocation("warehouse");
      setJobsiteId("");
      setNotes("");
      setItems([{ item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);
      setSelectedRequestIds([]);
      setShowForm(false);
      // Refresh requests to show updated status
      if (onLoadRequests) {
        onLoadRequests();
      }
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePackingSlipClick = (deliveryId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handlePackingSlipChange(e, deliveryId);
    input.click();
  };

  const handlePackingSlipChange = async (e, deliveryId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(deliveryId);
    await onUploadPackingSlip(deliveryId, file);
    setUploadingId(null);
  };

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Operations</span>
              <h1 className="page-header__title">Deliveries</h1>
              <p className="page-header__subtitle">
                Log incoming deliveries and track what materials arrived.
              </p>
            </div>

            <div className="page-actions">
              <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "+ Log Delivery"}
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

          {showForm && (
            <section className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Log New Delivery</h2>
                <p className="panel__hint">Record what just arrived</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label>Supplier *</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="e.g., Home Supply Co"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Delivered To *</label>
                    <select
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (e.target.value !== "jobsite") {
                          setJobsiteId("");
                        }
                      }}
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="yard">Yard</option>
                      <option value="jobsite">Jobsite</option>
                    </select>
                  </div>

                  {location === "jobsite" && (
                    <div className="field">
                      <label>Jobsite *</label>
                      <select
                        value={jobsiteId}
                        onChange={(e) => setJobsiteId(e.target.value)}
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

                  <div className="field field--full">
                    <label>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes about this delivery..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Fulfill Pending Requests - Simple Callout */}
                {approvedRequests.length > 0 && (
                  <div className="callout-box">
                    <div className="callout-box__header">
                      <div>
                        <strong>Fulfill Pending Requests?</strong>
                        <span className="callout-box__hint">Check any requests this delivery completes</span>
                      </div>
                    </div>
                    <div className="callout-box__list">
                      {approvedRequests.map((req) => (
                        <label key={req.request_id} className={`callout-box__item ${selectedRequestIds.includes(req.request_id) ? "callout-box__item--selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selectedRequestIds.includes(req.request_id)}
                            onChange={() => handleRequestToggle(req.request_id)}
                          />
                          <span><strong>{req.item_name}</strong> × {req.quantity_requested}</span>
                          <span className="callout-box__requester">by {req.requester}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Received - Clean Table */}
                <div className="delivery-items-simple">
                  <div className="delivery-items-simple__header">
                    <strong>Items Received</strong>
                    <button type="button" className="btn btn--outline btn--sm" onClick={handleAddItemRow}>
                      + Add Row
                    </button>
                  </div>

                  <table className="delivery-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className={item.from_request_id ? "row--from-request" : ""}>
                          <td>
                            {item.from_request_id ? (
                              <div className="item-from-request">
                                <span>{item.item_name}</span>
                                <span className="badge badge--small badge--approved">Request #{item.from_request_id}</span>
                              </div>
                            ) : (
                              <select
                                value={item.existing_item_id}
                                onChange={(e) => {
                                  handleItemChange(index, "existing_item_id", e.target.value);
                                }}
                                className="item-select"
                              >
                                <option value="">Type new item name...</option>
                                {inventoryItems.map((inv) => (
                                  <option key={inv.item_id} value={inv.item_id}>
                                    {inv.name} (+{inv.quantity} in stock)
                                  </option>
                                ))}
                              </select>
                            )}
                            {!item.from_request_id && !item.existing_item_id && (
                              <input
                                type="text"
                                value={item.item_name}
                                onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                                placeholder="New item name"
                                className="item-name-input"
                              />
                            )}
                          </td>
                          <td className="qty-cell">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="qty-input"
                              disabled={!!item.from_request_id}
                            />
                          </td>
                          <td className="remove-cell">
                            {(items.length > 1 || item.from_request_id) && (
                              <button
                                type="button"
                                className="btn btn--icon btn--remove"
                                onClick={() => handleRemoveItemRow(index)}
                                title="Remove"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Log Delivery{selectedRequestIds.length > 0 && ` & Fulfill ${selectedRequestIds.length} Request(s)`}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="table-card">
            <div className="table-card__header">
              <div>
                <h2>Delivery History</h2>
                <p>{deliveries.length} {deliveries.length === 1 ? "delivery" : "deliveries"}</p>
              </div>
            </div>

            <div className="table-wrapper">
              {deliveries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No deliveries logged</div>
                  <div className="empty-state__hint">
                    Click "Log Delivery" to record your first incoming shipment.
                  </div>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Location</th>
                      <th>Packing Slip</th>
                      <th>Items</th>
                      <th>Total Qty</th>
                      <th>Received By</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.delivery_id}>
                        <td className="mono nowrap">{formatDate(delivery.received_at)}</td>
                        <td>
                          <strong>{delivery.supplier}</strong>
                        </td>
                        <td>
                          <span className="badge badge--location">
                            {delivery.location === "jobsite" && delivery.jobsite_name
                              ? `Jobsite: ${delivery.jobsite_name}`
                              : delivery.location}
                          </span>
                        </td>
                        <td>
                          <button
                            className="packing-slip-btn"
                            onClick={() => handlePackingSlipClick(delivery.delivery_id)}
                            disabled={uploadingId === delivery.delivery_id}
                            title={delivery.packing_slip_url ? "View/Replace packing slip" : "Upload packing slip"}
                          >
                            {uploadingId === delivery.delivery_id ? (
                              <span className="photo-loading">...</span>
                            ) : delivery.packing_slip_url ? (
                              <img
                                src={`${API_BASE}${delivery.packing_slip_url}`}
                                alt="Packing slip"
                                className="packing-slip-thumb"
                              />
                            ) : (
                              <span className="photo-placeholder">
                                <CameraIcon />
                              </span>
                            )}
                          </button>
                        </td>
                        <td>
                          <span className="delivery-items-preview">
                            {delivery.items.slice(0, 2).map(i => i.item_name).join(", ")}
                            {delivery.items.length > 2 && ` +${delivery.items.length - 2} more`}
                          </span>
                        </td>
                        <td className="mono">{delivery.total_quantity}</td>
                        <td>
                          <span className="badge badge--neutral">{delivery.received_by}</span>
                        </td>
                        <td className="notes-cell">{delivery.notes || "—"}</td>
                        <td>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => {
                              if (window.confirm(`Delete delivery #${delivery.delivery_id}? This cannot be undone.`)) {
                                onDeleteDelivery(delivery.delivery_id);
                              }
                            }}
                          >
                            Delete
                          </button>
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
    </div>
  );
}

export default DeliveriesPage;
