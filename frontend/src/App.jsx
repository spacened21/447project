import { useEffect, useState } from "react";
import logo from "./assets/logo.webp";
import "./App.css";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showInventory, setShowInventory] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/session/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setLoggedInUser(data.user);
        } else {
          setLoggedInUser(null);
        }
      })
      .catch(() => {
        setLoggedInUser(null);
      });
  }, []);

  const clearForm = () => {
    setUsername("");
    setPassword("");
    setEmail("");
    setRole("user");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      setLoggedInUser(data.user);
      clearForm();
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          email,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setMessage("Registration successful. You can now log in.");
      clearForm();
      setIsRegistering(false);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });

    setLoggedInUser(null);
    setInventoryItems([]);
    setShowInventory(false);
    setMessage("");
    setError("");
  };

  const handleLoadInventory = async () => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/api/inventory/", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load inventory");
        return;
      }

      setInventoryItems(data.items);
      setShowInventory(true);
    } catch {
      setError("Could not connect to server");
    }
  };

  const handleSeedInventory = async () => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/api/inventory/seed/", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not create test inventory");
        return;
      }

      setMessage(data.message);
      handleLoadInventory();
    } catch {
      setError("Could not connect to server");
    }
  };

  if (loggedInUser) {
    return (
      <div className="dashboard-container">
        <h1>Welcome, {loggedInUser.username}</h1>
        <p>Email: {loggedInUser.email}</p>
        <p>Role: {loggedInUser.role}</p>

        <div className="button-row">
          <button onClick={handleLoadInventory}>View Inventory</button>
          <button onClick={handleSeedInventory}>Create Test Data</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {showInventory && (
          <div className="inventory-section">
            <h2>Inventory Items</h2>

            {inventoryItems.length === 0 ? (
              <p>No inventory items found.</p>
            ) : (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Supplier</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => (
                    <tr key={item.item_id}>
                      <td>{item.item_id}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td>{item.type}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                      <td>{item.supplier}</td>
                      <td>{item.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
    <img src={logo} alt="Logo" className="logo" />
      <h1>{isRegistering ? "Register" : "Login"}</h1>

      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        <button type="submit">{isRegistering ? "Register" : "Log In"}</button>
      </form>

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setIsRegistering(!isRegistering);
          setError("");
          setMessage("");
          clearForm();
        }}
      >
        {isRegistering
          ? "Already have an account? Log In"
          : "Need an account? Register"}
      </button>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;