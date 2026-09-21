import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import { useEffect, useState } from "react";
import RefrshHandler from "./RefrshHandler";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <RefrshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/login"
          element={<Login theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/signup"
          element={<Signup theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/contact"
          element={<Contact theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/home"
          element={
            <PrivateRoute
              element={<Home theme={theme} toggleTheme={toggleTheme} />}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
