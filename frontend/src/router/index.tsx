import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ReportPage from "../pages/ReportPage";
import { RouteErrorBoundary } from "../components/ErrorBoundary";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "/report",
            element: <ReportPage />,
            errorElement: <RouteErrorBoundary />,
          },
        ],
      },
    ],
  },
]);

export default router;
