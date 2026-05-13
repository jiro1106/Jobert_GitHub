import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ReportPage from "../pages/ReportPage";
import MapsPage from "../pages/MapsPage";
import { RouteErrorBoundary } from "../components/ErrorBoundary";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <LandingPage />, errorElement: <RouteErrorBoundary /> },
      { path: "/maps", element: <MapsPage />, errorElement: <RouteErrorBoundary /> },
      { path: "/login", element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
      {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [{ path: "/report", element: <ReportPage />, errorElement: <RouteErrorBoundary /> }],
      },
    ],
  },
]);

export default router;
