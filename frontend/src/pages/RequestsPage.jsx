import { useState, useEffect } from "react";
import Header from "../components/Header";

function RequestsPage({
  loggedInUser,
  onLogout,
  materialRequests,
  onLoadRequests,
  onUpdateRequestStatus,
  message,
  error,
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [myRequestsOnly, setMyRequestsOnly] = useState(false);

  useEffect(() => {
    onLoadRequests();
  }, []);

  const filterRequests = (requests) => {
    let filtered = requests;

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (myRequestsOnly) {
      filtered = filtered.filter((r) => r.requester === loggedInUser.username);
    }

    return filtered;
  };

  const filteredRequests = filterRequests(materialRequests);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "badge--pending";
      case "approved":
        return "badge--approved";
      case "denied":
        return "badge--denied";
      case "fulfilled":
        return "badge--fulfilled";
      default:
        return "badge--neutral";
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
      <Header
        loggedInUser={loggedInUser}
        onLogout={onLogout}
        showBackButton={true}
      />

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Operations</span>
              <h1 className="page-header__title">Material Requests</h1>
              <p className="page-header__subtitle">
                Review and manage material requests from your team.
              </p>
            </div>

            <div className="page-actions">
              <button className="btn btn--outline" onClick={onLoadRequests}>
                Refresh
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

          <section className="table-card">
            <div className="table-card__header">
              <div>
                <h2>All Requests</h2>
                <p>
                  {filteredRequests.length} of {materialRequests.length}{" "}
                  {materialRequests.length === 1 ? "request" : "requests"}
                </p>
              </div>

              <div className="filter-controls">
                <select
                  className="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={myRequestsOnly}
                    onChange={(e) => setMyRequestsOnly(e.target.checked)}
                  />
                  My requests only
                </label>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No requests found</div>
                  <div className="empty-state__hint">
                    {statusFilter || myRequestsOnly
                      ? "Try adjusting your filters."
                      : "No material requests have been made yet."}
                  </div>
                </div>
              ) : (
                <table className="inventory-table requests-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Requester</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Reviewed by</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td className="mono">#{req.request_id}</td>
                        <td>
                          <strong>{req.item_name}</strong>
                        </td>
                        <td className="mono">{req.quantity_requested}</td>
                        <td>
                          <span className="badge badge--neutral">
                            {req.requester}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="mono">{formatDate(req.created_at)}</td>
                        <td>{req.reviewed_by || "—"}</td>
                        <td className="notes-cell">{req.notes || "—"}</td>
                        <td className="actions-cell">
                          {req.status === "pending" && (
                            <>
                              <button
                                className="btn btn--approve small-button"
                                onClick={() =>
                                  onUpdateRequestStatus(
                                    req.request_id,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn--deny small-button"
                                onClick={() =>
                                  onUpdateRequestStatus(
                                    req.request_id,
                                    "denied"
                                  )
                                }
                              >
                                Deny
                              </button>
                            </>
                          )}
                          {req.status === "approved" && (
                            <button
                              className="btn btn--fulfill small-button"
                              onClick={() =>
                                onUpdateRequestStatus(
                                  req.request_id,
                                  "fulfilled"
                                )
                              }
                            >
                              Mark Fulfilled
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
    </div>
  );
}

export default RequestsPage;
