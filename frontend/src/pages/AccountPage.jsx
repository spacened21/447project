import Header from "../components/Header";

function AccountPage({ loggedInUser, onLogout }) {
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
              <span className="page-header__eyebrow">Settings</span>
              <h1 className="page-header__title">Account</h1>
              <p className="page-header__subtitle">
                View your account information and manage your session.
              </p>
            </div>
          </div>

          <div className="account-page-grid">
            <section className="panel account-card">
              <div className="account-card__avatar">
                {loggedInUser.username?.slice(0, 2).toUpperCase() || "?"}
              </div>
              <h2 className="account-card__name">{loggedInUser.username}</h2>
              <p className="account-card__email">{loggedInUser.email}</p>
              <span
                className={`badge ${
                  loggedInUser.role === "admin" ? "badge--red" : "badge--blue"
                }`}
              >
                {loggedInUser.role}
              </span>
            </section>

            <section className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Account Details</h2>
              </div>

              <div className="info-list">
                <div className="info-list__item">
                  <span className="info-list__label">User ID</span>
                  <span className="info-list__value">#{loggedInUser.id}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Username</span>
                  <span className="info-list__value">{loggedInUser.username}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Email</span>
                  <span className="info-list__value">{loggedInUser.email}</span>
                </div>
                <div className="info-list__item">
                  <span className="info-list__label">Role</span>
                  <span className="info-list__value" style={{ textTransform: "capitalize" }}>
                    {loggedInUser.role}
                  </span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Session</h2>
              </div>

              <p className="panel__hint" style={{ marginBottom: "1rem" }}>
                Logging out will end your current session. You'll need to sign in again to access the system.
              </p>

              <button className="btn btn--danger" onClick={onLogout}>
                Log out
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountPage;
