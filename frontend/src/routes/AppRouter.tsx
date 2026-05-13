import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import Home from "../pages/Home";
import { useAuth } from "../context/AuthContext";
import { JSX } from "react/jsx-runtime";
import "../App.css";

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/auth" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* default entry logic */}
        <Route path="/" element={<Protected><Home /></Protected>} />

        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}