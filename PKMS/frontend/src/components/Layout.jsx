import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Navbar from "../component/navbar";

// layout wraps pages that require authenticated shell
const Layout = () => {
  const navigate = useNavigate();
  // In a real app you'd check auth token
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
