import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import RequestsPage from "./pages/RequestsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import JobsitesPage from "./pages/JobsitesPage";
import { apiFetch } from "./api";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobsites, setJobsites] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const res = await apiFetch("/api/session/");
      const data = await res.json();

      if (data.authenticated && data.user) {
        setLoggedInUser(data.user);
        return true;
      } else {
        setLoggedInUser(null);
        return false;
      }
    } catch {
      setLoggedInUser(null);
      return false;
    }
  };

  useEffect(() => {
    loadSession()
      .then((isAuthenticated) => {
        if (isAuthenticated) {
          return handleLoadInventory();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await apiFetch("/api/logout/", {
      method: "POST",
    });

    setLoggedInUser(null);
    setInventoryItems([]);
    setMaterialRequests([]);
    setDeliveries([]);
    setUsers([]);
    setJobsites([]);
    setMessage("");
    setError("");
  };

  const handleLoadInventory = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/inventory/");
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load inventory");
        return;
      }

      setInventoryItems(data.items);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleAddItem = async (itemData) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/inventory/add/", {
        method: "POST",
        body: JSON.stringify(itemData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not add item");
        return false;
      }

      setInventoryItems((prev) => [...prev, data.item]);
      setMessage(data.message);
      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  const handleDeleteItem = async (itemId) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(`/api/inventory/${itemId}/`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not delete item");
        return;
      }

      setInventoryItems((prev) =>
        prev.filter((item) => item.item_id !== itemId)
      );
      setMessage(data.message);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleLoadUsers = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/admin/users/");
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load users");
        return;
      }

      setUsers(data.users);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not update user");
        return false;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data.user : u))
      );
      setMessage(data.message);
      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  const handleLoadRequests = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/requests/");
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load requests");
        return;
      }

      setMaterialRequests(data.requests);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleCreateRequest = async (requestData) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/requests/", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not create request");
        return false;
      }

      setMaterialRequests((prev) => [data.request, ...prev]);
      setMessage(data.message);
      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(`/api/requests/${requestId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not update request");
        return;
      }

      setMaterialRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId ? data.request : r
        )
      );
      setMessage(data.message);

      // Refresh inventory if approved (since quantity changed)
      if (newStatus === "approved") {
        handleLoadInventory();
      }
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleLoadDeliveries = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/deliveries/");
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load deliveries");
        return;
      }

      setDeliveries(data.deliveries);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleCreateDelivery = async (deliveryData) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/deliveries/", {
        method: "POST",
        body: JSON.stringify(deliveryData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not log delivery");
        return false;
      }

      setDeliveries((prev) => [data.delivery, ...prev]);
      setMessage(data.message);

      // Refresh inventory since delivery may have added/updated items
      handleLoadInventory();

      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  const handleLoadJobsites = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/jobsites/");
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load jobsites");
        return;
      }

      setJobsites(data.jobsites);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleCreateJobsite = async (jobsiteData) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/jobsites/", {
        method: "POST",
        body: JSON.stringify(jobsiteData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not create jobsite");
        return false;
      }

      setJobsites((prev) =>
        [...prev, data.jobsite].sort((a, b) => a.name.localeCompare(b.name))
      );
      setMessage(data.message);
      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  const handleDeleteJobsite = async (jobsiteId) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(`/api/jobsites/${jobsiteId}/`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not delete jobsite");
        return;
      }

      setJobsites((prev) => prev.filter((j) => j.jobsite_id !== jobsiteId));
      setMessage(data.message);
      // Items previously assigned to this jobsite are now unassigned
      handleLoadInventory();
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleReassignItem = async (itemId, payload) => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(`/api/inventory/${itemId}/reassign/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not reassign item");
        return false;
      }

      setInventoryItems((prev) =>
        prev.map((item) => (item.item_id === itemId ? data.item : item))
      );
      setMessage(data.message);
      return true;
    } catch {
      setError("Could not connect to server");
      return false;
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          loggedInUser ? (
            <Navigate to="/dashboard" />
          ) : (
            <AuthPage
              setLoggedInUser={setLoggedInUser}
              loadSession={loadSession}
              error={error}
              setError={setError}
              message={message}
              setMessage={setMessage}
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          loggedInUser ? (
            <DashboardPage
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              inventoryItems={inventoryItems}
              message={message}
              error={error}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/inventory"
        element={
          loggedInUser ? (
            <InventoryPage
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              inventoryItems={inventoryItems}
              jobsites={jobsites}
              onLoadInventory={handleLoadInventory}
              onLoadJobsites={handleLoadJobsites}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onReassignItem={handleReassignItem}
              onCreateRequest={handleCreateRequest}
              message={message}
              error={error}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/requests"
        element={
          loggedInUser ? (
            <RequestsPage
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              materialRequests={materialRequests}
              onLoadRequests={handleLoadRequests}
              message={message}
              error={error}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/deliveries"
        element={
          loggedInUser ? (
            <DeliveriesPage
              loggedInUser={loggedInUser}
              deliveries={deliveries}
              inventoryItems={inventoryItems}
              jobsites={jobsites}
              onLoadDeliveries={handleLoadDeliveries}
              onCreateDelivery={handleCreateDelivery}
              onLoadInventory={handleLoadInventory}
              onLoadJobsites={handleLoadJobsites}
              message={message}
              error={error}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/account"
        element={
          loggedInUser ? (
            <AccountPage
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/jobsites"
        element={
          loggedInUser ? (
            <JobsitesPage
              loggedInUser={loggedInUser}
              jobsites={jobsites}
              inventoryItems={inventoryItems}
              onLoadJobsites={handleLoadJobsites}
              onLoadInventory={handleLoadInventory}
              onCreateJobsite={handleCreateJobsite}
              onDeleteJobsite={handleDeleteJobsite}
              onReassignItem={handleReassignItem}
              message={message}
              error={error}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/admin"
        element={
          loggedInUser ? (
            loggedInUser.role === "admin" ? (
              <AdminPage
                loggedInUser={loggedInUser}
                users={users}
                onLoadUsers={handleLoadUsers}
                onUpdateUser={handleUpdateUser}
                message={message}
                error={error}
              />
            ) : (
              <Navigate to="/dashboard" />
            )
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
}

export default App;