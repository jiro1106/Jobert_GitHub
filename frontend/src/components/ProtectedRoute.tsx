import { Navigate, Outlet } from 'react-router';

const isAuthenticated = false;

export default function ProtectedRoute() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
