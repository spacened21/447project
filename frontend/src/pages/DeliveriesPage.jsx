import { useState, useEffect } from "react";
import Header from "../components/Header";

function DeliveriesPage({
  loggedInUser,
  deliveries,
  inventoryItems,
  jobsites = [],
  onLoadDeliveries,
  onCreateDelivery,
  onLoadInventory,
  onLoadJobsites,
  message,
  error,
}) {
  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [location, setLocation] = useState("warehouse");
  const [jobsiteId, setJobsiteId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);

  useEffect(() => {
    onLoadDeliveries();
    onLoadInventory();
    if (onLoadJobsites) {
      onLoadJobsites();
    }
  }, []);

  const sortedJobsites = [...jobsites].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleAddItemRow = () => {
    setItems([...items, { item_name: "", item_type: "material", quantity: 1, description: "", existing_item_id: "" }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
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
      setShowForm(false);
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
              <button className="btn btn--outline" onClick={onLoadDeliveries}>
                Refresh
              </button>
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

                <div className="delivery-items-section">
                  <div className="delivery-items-header">
                    <h3>Items Received</h3>
                    <button type="button" className="btn btn--outline small-button" onClick={handleAddItemRow}>
                      + Add Item
                    </button>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="delivery-item-row">
                      <div className="field">
                        <label>Add to existing item?</label>
                        <select
                          value={item.existing_item_id}
                          onChange={(e) => handleItemChange(index, "existing_item_id", e.target.value)}
                        >
                          <option value="">-- New Item --</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.item_id} value={inv.item_id}>
                              {inv.name} (current: {inv.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Item Name *</label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                          placeholder="e.g., Copper Pipe"
                          disabled={!!item.existing_item_id}
                        />
                      </div>

                      <div className="field">
                        <label>Type</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(index, "item_type", e.target.value)}
                          disabled={!!item.existing_item_id}
                        >
                          <option value="material">Material</option>
                          <option value="equipment">Equipment</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn--danger small-button remove-item-btn"
                          onClick={() => handleRemoveItemRow(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Log Delivery
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
                      <th>Items</th>
                      <th>Total Qty</th>
                      <th>Received By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.delivery_id}>
                        <td className="mono">{formatDate(delivery.received_at)}</td>
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
