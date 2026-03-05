
// frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from "react-router-dom";

import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddEmployee from "./pages/Admin/AddEmployee";
import OnboardedEmployees from "./pages/Admin/OnboardedEmployees";
import EmployeeActivity from "./pages/Admin/EmployeeActivity";
import RemoveEmployee from "./pages/Admin/ManageEmployee";
import EmployeeProfile from "./pages/Admin/EmployeeProfile";

import FaceEnroll from "./components/FaceEnroll";


function App() {
  const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  return (
    <Router>
      <Routes>
        {/* Default route → Login page first */}
        <Route path="/" element={<Navigate to="/admin-login" />} />

        {/* Admin login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin dashboard */}
        <Route
          path="/admin-home"
          element={isLoggedIn ? <AdminDashboard /> : <Navigate to="/admin-login" />}
        />

        {/* Admin pages */}
        <Route
          path="/add-employee"
          element={isLoggedIn ? <AddEmployee /> : <Navigate to="/admin-login" />}
        />
        <Route
          path="/onboarded-employees"
          element={isLoggedIn ? <OnboardedEmployees /> : <Navigate to="/admin-login" />}
        />
        <Route
          path="/employee-activity"
          element={isLoggedIn ? <EmployeeActivity /> : <Navigate to="/admin-login" />}
        />
        <Route
          path="/remove-employee"
          element={isLoggedIn ? <RemoveEmployee /> : <Navigate to="/admin-login" />}
        />
<Route path="/employee-profile" element={<EmployeeProfile />} />

        {/* Employee face login route */}
        <Route
          path="/face-login"
          element={<FaceEnrollWithQuery />}
        />
      </Routes>
    </Router>
  );
}

// Wrapper to read query params and pass to FaceEnroll
const FaceEnrollWithQuery = () => {
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get("name") || "";
  const prefillEmail = searchParams.get("email") || "";
  const prefillId = searchParams.get("empId") || "";

  return <FaceEnroll prefillName={prefillName} prefillEmail={prefillEmail} prefillId={prefillId} />;
};

export default App;