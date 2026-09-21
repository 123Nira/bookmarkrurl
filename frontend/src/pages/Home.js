import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../utils";
import { ToastContainer } from "react-toastify";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const emptyForm = { siteName: "", siteUrl: "", loginId: "", password: "" };
const normalizeUrl = (url) => url.toLowerCase().replace(/\/+$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`http://localhost:8080${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token"),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
};

function Home({ theme, toggleTheme }) {
  const [loggedInUser] = useState(
    () => localStorage.getItem("loggedInUser") || "there",
  );
  const [bookmarks, setBookmarks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const handleRequestError = (err) => {
    if (err.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("loggedInUser");
      handleError("Your session has expired. Please log in again.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
      return;
    }

    handleError(err.message);
  };

  const fetchBookmarks = async () => {
    try {
      setBookmarks(await request("/bookmarks"));
    } catch (err) {
      handleRequestError(err);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const filteredBookmarks = useMemo(
    () =>
      bookmarks.filter((bookmark) =>
        bookmark.siteName.toLowerCase().includes(search.toLowerCase().trim()),
      ),
    [bookmarks, search],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookmarks.length / pageSize),
  );
  const visibleBookmarks = filteredBookmarks.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    handleSuccess("User Loggedout");
    setTimeout(() => navigate("/login"), 1000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const siteName = form.siteName.trim();
    const siteUrl = form.siteUrl.trim();
    const wasEditing = Boolean(editingId);

    if (siteName.length > 50) {
      handleError("Site name cannot exceed 50 characters");
      return;
    }
    if (form.loginId.length > 40) {
      handleError("Login ID cannot exceed 40 characters");
      return;
    }
    if (form.password.length > 20) {
      handleError("Password cannot exceed 20 characters");
      return;
    }

    if (!wasEditing && (!siteName || !siteUrl)) {
      handleError("Site name and site URL are required");
      return;
    }

    const duplicate = bookmarks.find((bookmark) => {
      if (!siteName || !siteUrl || bookmark._id === editingId) return false;
      return (
        bookmark.siteName.trim().toLowerCase() === siteName.toLowerCase() ||
        normalizeUrl(bookmark.siteUrl.trim()) === normalizeUrl(siteUrl)
      );
    });

    if (duplicate) {
      handleError(
        normalizeUrl(duplicate.siteUrl.trim()) === normalizeUrl(siteUrl)
          ? "This URL already exists"
          : "This site name already exists",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await request(wasEditing ? `/bookmarks/${editingId}` : "/bookmarks", {
        method: wasEditing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, siteName, siteUrl }),
      });
      resetForm();
      await fetchBookmarks();
      handleSuccess(wasEditing ? "Bookmark updated" : "Bookmark saved");
    } catch (err) {
      handleRequestError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editBookmark = (bookmark) => {
    setEditingId(bookmark._id);
    setForm({
      siteName: bookmark.siteName || "",
      siteUrl: bookmark.siteUrl || "",
      loginId: bookmark.loginId || "",
      password: bookmark.password || "",
    });
    setIsFormOpen(true);
  };

  const removeBookmark = async () => {
    if (!bookmarkToDelete) return;

    const id = bookmarkToDelete._id;
    try {
      await request(`/bookmarks/${id}`, { method: "DELETE" });
      setBookmarks((current) =>
        current.filter((bookmark) => bookmark._id !== id),
      );
      setBookmarkToDelete(null);
      handleSuccess("Bookmark deleted");
    } catch (err) {
      handleRequestError(err);
    }
  };

  const handleBookmarkClick = (bookmark) => {
    request(`/bookmarks/${bookmark._id}/click`, { method: "POST" })
      .then(({ bookmark: updatedBookmark }) => {
        setBookmarks((current) =>
          [
            ...current.map((item) =>
              item._id === updatedBookmark._id ? updatedBookmark : item,
            ),
          ].sort(
            (first, second) =>
              (second.clickCount || 0) - (first.clickCount || 0) ||
              new Date(second.createdAt) - new Date(first.createdAt),
          ),
        );
      })
      .catch(handleRequestError);
  };

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand auth-brand">
          bookmark<span>r</span>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          <a className="nav-item active" href="#bookmarks">
            <span>▦</span> All bookmarks
          </a>
          <a className="nav-item" href="#bookmarks">
            <span>↗</span> Most visited
          </a>
          <span className="nav-label nav-label-spaced">Account</span>
          <button className="nav-item" type="button" onClick={toggleTheme}>
            <span>{theme === "light" ? "☾" : "☀"}</span>{" "}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <Link className="nav-item" to="/contact">
            <span>✉</span> Contact me
          </Link>
        </nav>
        <button
          className="sidebar-logout logout-control"
          type="button"
          onClick={handleLogout}
        >
          <span className="logout-icon" aria-hidden="true">
            <LogOut size={20} strokeWidth={2.5} />
          </span>
          <span className="logout-label">Logout</span>
        </button>
      </aside>
      <div className="dashboard-main">
        <header className="topbar">
          <div className="mobile-brand auth-brand">
            bookmark<span>r</span>
          </div>
          <div className="topbar-context">
            <span className="topbar-greeting">
              Good to see you, {loggedInUser}.
            </span>
            <span className="topbar-workspace">
              <span className="topbar-dot" /> Personal workspace
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
          </div>
        </header>
        <section className="dashboard-content" id="bookmarks">
          <div className="toolbar">
            <label className="page-size-control">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10 rows</option>
                <option value="20">20 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
              </select>
            </label>
            <label className="search-box">
              <span className="search-input-wrap">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by site name"
                />
                {search && (
                  <button
                    className="search-clear"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </span>
            </label>
            <button
              className="primary-button new-entry-button"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setIsFormOpen(true);
              }}
            >
              <span>Add URL</span>
            </button>
            <span>{filteredBookmarks.length} Total Sites</span>
          </div>
          {isFormOpen && (
            <div
              className="bookmark-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bookmark-form-title"
            >
              <button
                className="modal-backdrop"
                type="button"
                aria-label="Close bookmark form"
                onClick={resetForm}
              />
              <form
                className="bookmark-form"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div className="form-heading">
                  <div>
                    <p className="eyebrow">
                      {editingId ? "Edit entry" : "New entry"}
                    </p>
                    <h2 id="bookmark-form-title">
                      {editingId ? "Update bookmark" : "Save a bookmark"}
                    </h2>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
                <div className="bookmark-fields">
                  <label>
                    Site name
                    <input
                      name="siteName"
                      value={form.siteName}
                      onChange={handleChange}
                      placeholder="e.g. GitHub"
                      maxLength={50}
                      autoComplete="organization"
                      required
                    />
                  </label>
                  <label>
                    Site URL
                    <input
                      name="siteUrl"
                      type="url"
                      value={form.siteUrl}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      autoComplete="url"
                      required
                    />
                  </label>
                  <label>
                    Login ID
                    <input
                      name="loginId"
                      value={form.loginId}
                      onChange={handleChange}
                      placeholder="Optional"
                      maxLength={40}
                      autoComplete="username"
                    />
                  </label>
                  <label>
                    Password
                    <span className="password-field">
                      <input
                        name="password"
                        type={visiblePasswords.form ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Optional"
                        maxLength={20}
                        autoComplete={
                          editingId ? "current-password" : "new-password"
                        }
                      />
                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() =>
                          setVisiblePasswords((current) => ({
                            ...current,
                            form: !current.form,
                          }))
                        }
                        aria-label={
                          visiblePasswords.form
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {visiblePasswords.form ? (
                          <Eye size={19} />
                        ) : (
                          <EyeOff size={19} />
                        )}
                      </button>
                    </span>
                  </label>
                </div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Update bookmark"
                        : "Save bookmark"}
                  </span>
                </button>
              </form>
            </div>
          )}
          {bookmarkToDelete && (
            <div
              className="confirmation-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-bookmark-title"
            >
              <button
                className="modal-backdrop"
                type="button"
                aria-label="Cancel delete"
                onClick={() => setBookmarkToDelete(null)}
              />
              <div className="confirmation-card">
                <button
                  className="confirmation-close"
                  type="button"
                  onClick={() => setBookmarkToDelete(null)}
                  aria-label="Close delete confirmation"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
                <h3 id="delete-bookmark-title">
                  Are you sure you want to delete this{" "}
                  {bookmarkToDelete.siteName}?
                </h3>
                <p>
                  This will permanently remove{" "}
                  <strong>{bookmarkToDelete.siteName}</strong> from your vault.
                </p>
                <div className="confirmation-actions">
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() => setBookmarkToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={removeBookmark}
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="table-shell">
            <table className="bookmark-table">
              <thead>
                <tr>
                  <th>Site name</th>
                  <th>Site URL</th>
                  <th>Login ID</th>
                  <th>Password</th>
                  <th>Visits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookmarks.length ? (
                  visibleBookmarks.map((bookmark, index) => (
                    <tr key={bookmark._id}>
                      <td>
                        <strong
                          title={
                            bookmark.siteName.length > 20
                              ? bookmark.siteName
                              : undefined
                          }
                        >
                          {bookmark.siteName}
                        </strong>
                      </td>
                      <td>
                        <a
                          href={bookmark.siteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => handleBookmarkClick(bookmark)}
                          title={
                            bookmark.siteUrl.length > 49
                              ? bookmark.siteUrl
                              : undefined
                          }
                        >
                          {bookmark.siteUrl}
                        </a>
                      </td>
                      <td>{bookmark.loginId || "-"}</td>
                      <td>
                        {bookmark.password
                          ? visiblePasswords[bookmark._id]
                            ? bookmark.password
                            : "••••••••"
                          : "-"}
                      </td>
                      <td>
                        <span className="click-count">
                          {bookmark.clickCount || 0}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="card-action"
                            type="button"
                            onClick={() =>
                              setVisiblePasswords((current) => ({
                                ...current,
                                [bookmark._id]: !current[bookmark._id],
                              }))
                            }
                          >
                            {visiblePasswords[bookmark._id] ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                            View
                          </button>
                          <button
                            className="card-action"
                            type="button"
                            onClick={() => editBookmark(bookmark)}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                          <button
                            className="card-action danger"
                            type="button"
                            onClick={() => setBookmarkToDelete(bookmark)}
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="table-empty" colSpan="7">
                      {search
                        ? "No site names match your search."
                        : "Your vault is ready. Add your first bookmark."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>
              Page {page} of {totalPages}
            </span>
            <div>
              <button
                className="page-button"
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label="Previous page"
              >
                &#8592;
              </button>
              <button
                className="page-button"
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                &#8594;
              </button>
            </div>
          </div>
        </section>
      </div>
      <ToastContainer />
    </main>
  );
}

export default Home;
