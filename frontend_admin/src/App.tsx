import { Routes, Route, Navigate } from "react-router-dom";
import Background from "./components/Layout/Background";
import DashboardLayout from "./components/Layout/DashboardLayout";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/Auth/AuthPage";
import Dashboard from "./components/Dashboard";
// import Settings from "./components/User/Settings";
// import BookTicket from "./components/Tickets/BookTicket";
// import MyTickets from "./components/Tickets/MyTickets";
import AdminScanner from "./components/Admin/AdminScanner";
import DatabaseAccess from "./components/Admin/DatabaseAccess";

function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Background 3D Scene */}
      <Background />

      {/* Foreground Content */}
      {/* Foreground Content - Full Width/Height, Handling scrolling per route */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <Routes>
          {/* Public Routes - Wrapped in centering container if needed */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <div style={{ height: "100%", width: "100%", overflowY: "auto" }}>
                <AuthPage />
              </div>
            }
          />

          {/* Dashboard Routes - Wrapped in DashboardLayout (Sidebar) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/scanner" element={<AdminScanner />} />
            <Route path="/admin/database" element={<DatabaseAccess />} />
          </Route>

          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
