import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";

function ForgotPassword({ theme, toggleTheme }) {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return handleError("Email is required");

    try {
      const response = await fetch(
        "http://localhost:8080/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Request failed");

      handleSuccess(result.message);
      if (result.resetUrl) {
        setTimeout(
          () => navigate(result.resetUrl.replace("http://localhost:3000", "")),
          1000,
        );
      }
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
            <h2>Reset your password</h2>
            <p>Enter your email and we will send reset instructions.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email..."
                autoFocus
                required
              />
            </div>
            <button className="primary-button" type="submit">
              Send reset link <span>→</span>
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

export default ForgotPassword;
