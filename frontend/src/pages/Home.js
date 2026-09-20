import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../utils";
import { ToastContainer } from "react-toastify";

const emptyForm = { siteName: "", siteUrl: "", loginId: "", password: "" };
const pageSize = 8;
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
  if (!response.ok) throw new Error(result.message || "Request failed");
  return result;
};

function Home({ theme, toggleTheme }) {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => setLoggedInUser(localStorage.getItem("loggedInUser")), []);

  const fetchBookmarks = async () => {
    try {
      setBookmarks(await request("/bookmarks"));
    } catch (err) {
      handleError(err.message);
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

    if (!siteName || !siteUrl) {
      handleError("Site name and site URL are required");
      return;
    }

    const duplicate = bookmarks.find((bookmark) => {
      if (bookmark._id === editingId) return false;
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
      const wasEditing = Boolean(editingId);
      await request(wasEditing ? `/bookmarks/${editingId}` : "/bookmarks", {
        method: wasEditing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, siteName, siteUrl }),
      });
      resetForm();
      await fetchBookmarks();
      handleSuccess(wasEditing ? "Bookmark updated" : "Bookmark saved");
    } catch (err) {
      handleError(err.message);
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

  const removeBookmark = async (id) => {
    if (!window.confirm("Delete this bookmark?")) return;
    try {
      await request(`/bookmarks/${id}`, { method: "DELETE" });
      setBookmarks((current) =>
        current.filter((bookmark) => bookmark._id !== id),
      );
      handleSuccess("Bookmark deleted");
    } catch (err) {
      handleError(err.message);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div className="auth-brand">
          bookmark<span>r</span>
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
          <button className="logout-button" onClick={handleLogout}>
            Log out <span>↗</span>
          </button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Your private vault</p>
            <h1>Good to see you, {loggedInUser || "there"}.</h1>
            <p className="intro-copy">
              Keep the places and credentials you return to close at hand.
            </p>
          </div>
          <div className="library-count">
            <strong>{String(bookmarks.length).padStart(2, "0")}</strong>
            <span>saved items</span>
          </div>
        </div>
        <div className="toolbar">
          <label className="search-box">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by site name"
            />
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
            <span>+ New entry</span>
          </button>
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
                    autoComplete="username"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Optional"
                    autoComplete={
                      editingId ? "current-password" : "new-password"
                    }
                  />
                </label>
              </div>
              <button
                className="primary-button bookmark-submit"
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
                <span>↗</span>
              </button>
            </form>
          </div>
        )}
        <div className="section-rule">
          <span>Saved bookmarks</span>
          <span>{filteredBookmarks.length} results</span>
        </div>
        <div className="table-shell">
          <table className="bookmark-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Site name</th>
                <th>Site URL</th>
                <th>Login ID</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookmarks.length ? (
                visibleBookmarks.map((bookmark, index) => (
                  <tr key={bookmark._id}>
                    <td className="product-number">
                      {String((page - 1) * pageSize + index + 1).padStart(
                        2,
                        "0",
                      )}
                    </td>
                    <td>
                      <strong>{bookmark.siteName}</strong>
                    </td>
                    <td>
                      <a
                        href={bookmark.siteUrl}
                        target="_blank"
                        rel="noreferrer"
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
                          {visiblePasswords[bookmark._id] ? "Hide" : "Show"}
                        </button>
                        <button
                          className="card-action"
                          type="button"
                          onClick={() => editBookmark(bookmark)}
                        >
                          Edit
                        </button>
                        <button
                          className="card-action danger"
                          type="button"
                          onClick={() => removeBookmark(bookmark._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="table-empty" colSpan="6">
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
            >
              Previous
            </button>
            <button
              className="page-button"
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
      <ToastContainer />
    </main>
  );
}

export default Home;
