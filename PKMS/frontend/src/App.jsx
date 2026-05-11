import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Projects from "./pages/projects";
import ProjectKeys from "./pages/ProjectKeys";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId/keys" element={<ProjectKeys />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/roles" element={<RoleManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
