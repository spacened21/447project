import { useState, useEffect } from "react";
import Header from "../components/Header";

function RequestsPage({
  loggedInUser,
  onLogout,
  materialRequests,
  onLoadRequests,
  message,
  error,
}) {
  const [myActivityOnly, setMyActivityOnly] = useState(false);

  useEffect(() => {
    onLoadRequests();
  }, []);

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
              <h1 className="page-header__title">Activity Log</h1>
              <p className="page-header__subtitle">
                Track what materials have been taken and by whom.
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
                <h2>Recent Activity</h2>
                <p>
                  {filteredActivity.length}{" "}
                  {filteredActivity.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              <div className="filter-controls">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={myActivityOnly}
                    onChange={(e) => setMyActivityOnly(e.target.checked)}
                  />
                  My activity only
                </label>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredActivity.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No activity yet</div>
                  <div className="empty-state__hint">
                    {myActivityOnly
                      ? "You haven't taken any materials yet."
                      : "No materials have been taken yet."}
                  </div>
                </div>
              ) : (
                <table className="inventory-table activity-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Taken By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.map((entry) => (
                      <tr key={entry.request_id}>
                        <td className="mono">{formatDate(entry.created_at)}</td>
                        <td>
                          <strong>{entry.item_name}</strong>
                        </td>
                        <td className="mono">{entry.quantity_requested}</td>
                        <td>
                          <span className="badge badge--neutral">
                            {entry.requester}
                          </span>
                        </td>
                        <td className="notes-cell">{entry.notes || "—"}</td>
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
