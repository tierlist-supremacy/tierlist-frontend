import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { TierList } from "./types";
import { Home } from "./pages/Home";
import { Editor } from "./pages/Editor";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

// Protected route wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="editor-error"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <div
          className="spin"
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #6366f1",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 1rem",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public only route (login/register)
const PublicOnlyRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Navigate to="/" replace /> : <Outlet />;
};

const AppRoutes = () => {
  const { user, loading, migrateLocalData } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [currentList, setCurrentList] = useState<TierList | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Migra localStorage → API após login
  useEffect(() => {
    if (user && !loading) {
      migrateLocalData();
    }
  }, [user, loading, migrateLocalData]);

  const handleStartEditor = (list: TierList) => {
    setCurrentList(list);
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home onStartEditor={handleStartEditor} />} />
        <Route
          path="/editor"
          element={
            <Editor
              currentList={currentList}
              onSetCurrentList={setCurrentList}
            />
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
