import { useEffect, useState } from "react";
import Header from "../components/Header";

const EMPTY_FORM = {
  name: "",
  address: "",
  notes: "",
};

const LOCATION_OPTIONS = [
  { value: "warehouse", label: "Warehouse" },
  { value: "yard", label: "Yard" },
  { value: "jobsite", label: "Jobsite" },
];

function JobsitesPage({
  loggedInUser,
  jobsites = [],
  inventoryItems = [],
  onLoadJobsites,
  onLoadInventory,
  onCreateJobsite,
  onDeleteJobsite,
  onReassignItem,
  message,
  error,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJobsiteId, setSelectedJobsiteId] = useState(null);

  // Reassign modal
  const [reassignItem, setReassignItem] = useState(null);
  const [reassignLocation, setReassignLocation] = useState("warehouse");
  const [reassignJobsiteId, setReassignJobsiteId] = useState("");
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  useEffect(() => {
    onLoadJobsites();
    onLoadInventory();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await onCreateJobsite({
      name: formValues.name,
      address: formValues.address,
      notes: formValues.notes,
    });

    setSubmitting(false);

    if (success) {
      setFormValues(EMPTY_FORM);
      setShowAddForm(false);
    }
  };

  const handleDelete = async (jobsite) => {
    if (
      !window.confirm(
        `Delete jobsite "${jobsite.name}"? Items currently at this jobsite will be unassigned.`
      )
    ) {
      return;
    }
    await onDeleteJobsite(jobsite.jobsite_id);
    if (selectedJobsiteId === jobsite.jobsite_id) {
      setSelectedJobsiteId(null);
    }
  };

  const handleOpenReassign = (item) => {
    setReassignItem(item);
    setReassignLocation(item.location);
    setReassignJobsiteId(item.jobsite_id ? String(item.jobsite_id) : "");
  };

  const handleCloseReassign = () => {
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
      handleCloseReassign();
    }
  };

  const sortedJobsites = [...jobsites].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const selectedJobsite =
    selectedJobsiteId != null
      ? sortedJobsites.find((j) => j.jobsite_id === selectedJobsiteId)
      : null;

  const itemsAtSelected = selectedJobsite
    ? inventoryItems.filter(
        (item) => item.jobsite_id === selectedJobsite.jobsite_id
      )
    : [];

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Operations</span>
              <h1 className="page-header__title">Jobsites</h1>
              <p className="page-header__subtitle">
                Create jobsites, browse the inventory at each location, and
                reassign items between them.
              </p>
            </div>

            <div className="page-actions">
              <button
                className="btn btn--outline"
                onClick={() => {
                  setShowAddForm(false);
                  onLoadJobsites();
                  onLoadInventory();
                }}
              >
                Refresh
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setShowAddForm((prev) => !prev)}
              >
                {showAddForm ? "Cancel" : "+ Add jobsite"}
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
                  <h2 className="panel__title">New jobsite</h2>
                  <p className="panel__hint">
                    Name is required. Address and notes are optional.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitAdd}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="js-name">Name</label>
                    <input
                      id="js-name"
                      name="name"
                      value={formValues.name}
                      onChange={handleFieldChange}
                      placeholder="e.g. 7th Street Project"
                      required
                    />
                  </div>

                  <div className="field field--full">
                    <label htmlFor="js-address">Address</label>
                    <input
                      id="js-address"
                      name="address"
                      value={formValues.address}
                      onChange={handleFieldChange}
                      placeholder="Street, city, state"
                    />
                  </div>

                  <div className="field field--full">
                    <label htmlFor="js-notes">Notes</label>
                    <textarea
                      id="js-notes"
                      name="notes"
                      value={formValues.notes}
                      onChange={handleFieldChange}
                      placeholder="Anything the team should know about this jobsite"
                      rows={3}
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
                    {submitting ? "Saving…" : "Save jobsite"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="table-card">
            <div className="table-card__header">
              <div>
                <h2>All jobsites</h2>
                <p>
                  {sortedJobsites.length}{" "}
                  {sortedJobsites.length === 1 ? "jobsite" : "jobsites"}
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              {sortedJobsites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No jobsites yet</div>
                  <div className="empty-state__hint">
                    Click "Add jobsite" to create your first one.
                  </div>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Items</th>
                      <th>Total qty</th>
                      <th>Created by</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJobsites.map((js) => {
                      const isSelected =
                        selectedJobsiteId === js.jobsite_id;
                      return (
                        <tr key={js.jobsite_id}>
                          <td>
                            <strong>{js.name}</strong>
                          </td>
                          <td>{js.address || "—"}</td>
                          <td className="mono">{js.item_count}</td>
                          <td className="mono">{js.total_quantity}</td>
                          <td>
                            <span className="badge badge--neutral">
                              {js.created_by || "—"}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              className="btn btn--outline small-button"
                              onClick={() =>
                                setSelectedJobsiteId(
                                  isSelected ? null : js.jobsite_id
                                )
                              }
                            >
                              {isSelected ? "Hide inventory" : "View inventory"}
                            </button>
                            <button
                              className="btn btn--danger small-button"
                              onClick={() => handleDelete(js)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {selectedJobsite && (
            <section className="table-card">
              <div className="table-card__header">
                <div>
                  <h2>Inventory at {selectedJobsite.name}</h2>
                  <p>
                    {itemsAtSelected.length}{" "}
                    {itemsAtSelected.length === 1 ? "item" : "items"} assigned
                  </p>
                </div>
                <button
                  className="btn btn--ghost small-button"
                  onClick={() => setSelectedJobsiteId(null)}
                >
                  Close
                </button>
              </div>

              <div className="table-wrapper">
                {itemsAtSelected.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__title">No items here yet</div>
                    <div className="empty-state__hint">
                      Reassign items from the Inventory page or log a delivery
                      to this jobsite.
                    </div>
                  </div>
                ) : (
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Supplier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsAtSelected.map((item) => (
                        <tr key={item.item_id}>
                          <td className="mono">#{item.item_id}</td>
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
                          <td className="mono">{item.quantity}</td>
                          <td>{item.supplier}</td>
                          <td className="actions-cell">
                            <button
                              className="btn btn--outline small-button"
                              onClick={() => handleOpenReassign(item)}
                            >
                              Reassign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {reassignItem && (
        <div className="modal-overlay" onClick={handleCloseReassign}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Reassign item</h2>
              <button
                className="modal__close"
                onClick={handleCloseReassign}
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
                  {reassignItem.location === "jobsite" && reassignItem.jobsite_name
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
                    {LOCATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
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
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleCloseReassign}
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
    </div>
  );
}

export default JobsitesPage;
