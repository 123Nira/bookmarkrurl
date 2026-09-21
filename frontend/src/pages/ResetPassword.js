import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import { Eye, EyeOff } from "lucide-react";

function ResetPassword({ theme, toggleTheme }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 4)
      return handleError("Password must be at least 4 characters");
    if (password !== confirmPassword)
      return handleError("Passwords do not match");

    try {
      const response = await fetch(
        `http://localhost:8080/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Request failed");
      handleSuccess(result.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      handleError(error.message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand">
        bookmark<span>r</span>
      </div>
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "☾" : "☀"}
      </button>
      <section className="auth-layout auth-layout-centered">
        <div className="auth-card">
          <div className="card-heading">
            <p className="eyebrow">Account recovery</p>
            <h2>Choose a new password</h2>
            <p>Your reset link is valid for 15 minutes.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password">New password</label>
              <span className="password-field">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter a new password..."
                  autoFocus
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={19} /> : <EyeOff size={19} />}
                </button>
              </span>
            </div>
            <div>
              <label htmlFor="confirm-password">Confirm password</label>
              <span className="password-field">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password..."
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <Eye size={19} />
                  ) : (
                    <EyeOff size={19} />
                  )}
                </button>
              </span>
            </div>
            <button className="primary-button" type="submit">
              Update password <span>→</span>
            </button>
            <p className="form-footer">
              <Link to="/login">Back to sign in</Link>
            </p>
          </form>
        </div>
      </section>
      <ToastContainer />
    </main>
  );
}

export default ResetPassword;
