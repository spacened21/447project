import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/session/", {
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
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
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
      const res = await fetch("http://127.0.0.1:8000/api/register/", {
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
    await fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });

    setLoggedInUser(null);
    setMessage("");
    setError("");
  };

  if (loggedInUser) {
    return (
      <div className="container">
        <h1>Welcome, {loggedInUser.username}</h1>
        <p>Email: {loggedInUser.email}</p>
        <p>Role: {loggedInUser.role}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="container">
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