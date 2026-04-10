import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/session/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Not logged in");
        }
        return res.json();
      })
      .then((data) => {
        setLoggedInUser(data.username);
      })
      .catch(() => {
        setLoggedInUser(null);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

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

      setLoggedInUser(data.username);
      setUsername("");
      setPassword("");
    } catch (err) {
      setError("Could not connect to server");
    }
  };

  const handleLogout = async () => {
    await fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });

    setLoggedInUser(null);
  };

  // ✅ Logged-in view
  if (loggedInUser) {
    return (
      <div className="container">
        <h1>Welcome, {loggedInUser}</h1>
        <p>You are logged in.</p>
        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  // ✅ Login view
  return (
    <div className="container">
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Log In</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;