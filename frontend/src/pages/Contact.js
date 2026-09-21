import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";

function Contact({ theme, toggleTheme }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch("http://localhost:8080/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Request failed");
      setForm({ name: "", email: "", message: "" });
      handleSuccess(result.message);
    } catch (error) {
      handleError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="auth-page contact-page">
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
        <div className="auth-card contact-card">
          <div className="card-heading">
            <p className="eyebrow">Let's talk</p>
            <h2>Send me a message</h2>
            <p>Questions, ideas, or feedback are always welcome.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="How can I help?"
                rows="5"
                required
              />
            </div>
            <button
              className="primary-button"
              type="submit"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send message"} <span>→</span>
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

export default Contact;
