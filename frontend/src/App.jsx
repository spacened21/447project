import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import RequestsPage from "./pages/RequestsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import AccountPage from "./pages/AccountPage";
import { apiFetch } from "./api";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
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

  const handleSeedInventory = async () => {
    setError("");
    setMessage("");

    try {
      const res = await apiFetch("/api/inventory/seed/", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not create test inventory");
        return;
      }

      setMessage(data.message);
    } catch {
      setError("Could not connect to server");
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
              onSeedInventory={handleSeedInventory}
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
              onLoadInventory={handleLoadInventory}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
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
              onLoadDeliveries={handleLoadDeliveries}
              onCreateDelivery={handleCreateDelivery}
              onLoadInventory={handleLoadInventory}
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
    </Routes>
  );
}

export default App;