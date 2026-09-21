import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import { Eye, EyeOff, LogIn } from "lucide-react";

function Login({ theme, toggleTheme }) {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const copyLoginInfo = { ...loginInfo };
    copyLoginInfo[name] = value;
    setLoginInfo(copyLoginInfo);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("email and password are required");
    }
    try {
      const url = `http://localhost:8080/auth/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      });
      const result = await response.json();
      const { success, message, jwtToken, name, error } = result;
      if (success) {
        handleSuccess(message);
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("loggedInUser", name);
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else if (error) {
        const details = error?.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
    } catch (err) {
      handleError(err);
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
      <section className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">Your links, beautifully organized</p>
          <h1>Keep the web worth remembering.</h1>
          <p className="intro-copy">
            Save the pages that matter, find them in a heartbeat, and keep your
            digital world close.
          </p>
          <div className="stat-row">
            <span>
              <strong>01</strong> simple space
            </span>
            <span>
              <strong>∞</strong> useful links
            </span>
          </div>
        </div>
        <div className="auth-card">
          <div className="card-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to bookmarkr</h2>
            <p>Pick up right where you left off.</p>
          </div>
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                onChange={handleChange}
                type="email"
                name="email"
                placeholder="Enter your email..."
                value={loginInfo.email}
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <span className="password-field">
                <input
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password..."
                  value={loginInfo.password}
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
            <p className="form-helper">
              <Link to="/forgot-password">Forgot your password?</Link>
            </p>
            <button className="primary-button login-button" type="submit">
              <LogIn
                className="login-icon"
                size={24}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="login-label">Login</span>
            </button>
            <p className="form-footer">
              New to bookmarkr? <Link to="/signup">Create an account</Link>
              <br />
              Need help? <Link to="/contact">Contact me</Link>
            </p>
          </form>
        </div>
      </section>
      <ToastContainer />
    </main>
  );
}

export default Login;
