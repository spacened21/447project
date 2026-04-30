import { useEffect } from "react";
import Header from "../components/Header";

function AdminPage({
  loggedInUser,
  users = [],
  onLoadUsers,
  onUpdateUser,
  message,
  error,
}) {
  useEffect(() => {
    onLoadUsers();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleToggleActive = (user) => {
    const action = user.is_active ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) {
      return;
    }
    onUpdateUser(user.id, { is_active: !user.is_active });
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const action =
      newRole === "admin" ? "promote to admin" : "demote to user";
    if (!window.confirm(`Are you sure you want to ${action}: ${user.username}?`)) {
      return;
    }
    onUpdateUser(user.id, { role: newRole });
  };

  const sortedUsers = [...users].sort((a, b) => a.id - b.id);

  return (
    <div className="app-shell">
      <Header loggedInUser={loggedInUser} />

      <main className="app-main">
        <div className="app-container">
          <div className="page-header">
            <div>
              <span className="page-header__eyebrow">Administration</span>
              <h1 className="page-header__title">Admin Permissions</h1>
              <p className="page-header__subtitle">
                Manage user accounts, deactivate access, and assign admin roles.
              </p>
            </div>

            <div className="page-actions">
              <button className="btn btn--outline" onClick={onLoadUsers}>
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
                <h2>All Users</h2>
                <p>
                  {sortedUsers.length}{" "}
                  {sortedUsers.length === 1 ? "account" : "accounts"}
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              {sortedUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__title">No users found</div>
                  <div className="empty-state__hint">
                    There are no user accounts to display.
                  </div>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => {
                      const isSelf = user.id === loggedInUser.id;
                      return (
                        <tr key={user.id}>
                          <td className="mono">#{user.id}</td>
                          <td>
                            <strong>{user.username}</strong>
                            {isSelf && (
                              <span
                                className="badge badge--neutral"
                                style={{ marginLeft: "0.5rem" }}
                              >
                                you
                              </span>
                            )}
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                user.role === "admin"
                                  ? "badge--red"
                                  : "badge--blue"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                user.is_active
                                  ? "badge--blue"
                                  : "badge--neutral"
                              }`}
                            >
                              {user.is_active ? "active" : "deactivated"}
                            </span>
                          </td>
                          <td className="mono">
                            {formatDate(user.date_joined)}
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="btn btn--outline small-button"
                                onClick={() => handleToggleRole(user)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? "You cannot change your own role"
                                    : ""
                                }
                              >
                                {user.role === "admin"
                                  ? "Demote to user"
                                  : "Make admin"}
                              </button>
                              <button
                                className={`btn small-button ${
                                  user.is_active
                                    ? "btn--danger"
                                    : "btn--outline"
                                }`}
                                onClick={() => handleToggleActive(user)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? "You cannot deactivate yourself"
                                    : ""
                                }
                              >
                                {user.is_active ? "Deactivate" : "Reactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default AdminPage;
