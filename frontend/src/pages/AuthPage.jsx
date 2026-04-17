import { useState } from "react";
import { apiFetch } from "../api";
import logo from "../assets/logo.webp";

function AuthPage({
  setLoggedInUser,
  loadSession,
  error,
  setError,
  message,
  setMessage,
}) {
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

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
      const res = await apiFetch("/api/login/", {
        method: "POST",
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

      await loadSession();
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
      const res = await apiFetch("/api/register/", {
        method: "POST",
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

  return (
    <div className="centered-page">
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

          <button type="submit">
            {isRegistering ? "Register" : "Log In"}
          </button>
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
    </div>
  );
}

export default AuthPage;