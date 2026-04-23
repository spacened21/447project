import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import { apiFetch } from "./api";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const res = await apiFetch("/api/session/");
      const data = await res.json();

      if (data.authenticated && data.user) {
        setLoggedInUser(data.user);
      } else {
        setLoggedInUser(null);
      }
    } catch {
      setLoggedInUser(null);
    }
  };

  useEffect(() => {
    loadSession().finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await apiFetch("/api/logout/", {
      method: "POST",
    });

    setLoggedInUser(null);
    setInventoryItems([]);
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
              inventoryItems={inventoryItems}
              onLoadInventory={handleLoadInventory}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              message={message}
              error={error}
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