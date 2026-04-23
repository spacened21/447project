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
    <div className="auth-shell">
      <aside className="auth-shell__brand">
        <div className="auth-shell__brand-inner">
          <img src={logo} alt="Stratus" className="auth-shell__brand-logo" />
          <div>
            <h1 className="auth-shell__headline">
              Inventory that moves at the speed of your team.
            </h1>
            <p className="auth-shell__subtext">
              Track materials, equipment, and suppliers in one modern dashboard
              built for operations teams.
            </p>
          </div>
        </div>

        <ul className="auth-shell__features">
          <li className="auth-shell__feature">
            <span className="auth-shell__feature-dot" />
            Real-time inventory across every location
          </li>
          <li className="auth-shell__feature">
            <span className="auth-shell__feature-dot" />
            Role-based access for admins and operators
          </li>
          <li className="auth-shell__feature">
            <span className="auth-shell__feature-dot" />
            Audit trail on every adjustment
          </li>
        </ul>
      </aside>

      <section className="auth-shell__form-side">
        <div className="card card--auth">
          <span className="card__eyebrow">
            {isRegistering ? "Create account" : "Welcome back"}
          </span>
          <h2 className="card__title">
            {isRegistering ? "Join your team" : "Sign in to your workspace"}
          </h2>
          <p className="card__subtitle">
            {isRegistering
              ? "Set up credentials to get started with CoolSys."
              : "Use your CoolSys credentials to continue."}
          </p>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jane.doe"
                required
              />
            </div>

            {isRegistering && (
              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {isRegistering && (
              <div className="field">
                <label htmlFor="auth-role">Role</label>
                <select
                  id="auth-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--block">
              {isRegistering ? "Create account" : "Log in"}
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
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </button>

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
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
