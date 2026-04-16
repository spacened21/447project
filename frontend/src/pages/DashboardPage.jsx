import { useNavigate } from "react-router-dom";

function DashboardPage({
  loggedInUser,
  onLogout,
  onSeedInventory,
  message,
  error,
}) {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div className="dashboard-container">
        <h1>Welcome, {loggedInUser.username}</h1>
        <p>Email: {loggedInUser.email}</p>
        <p>Role: {loggedInUser.role}</p>

        <div className="button-row">
          <button onClick={() => navigate("/inventory")}>Go to Inventory</button>
          <button onClick={onSeedInventory}>Create Test Data</button>
          <button onClick={onLogout}>Log Out</button>
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default DashboardPage;