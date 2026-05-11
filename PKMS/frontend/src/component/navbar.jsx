import React from "react";
import { Shield, User, Crown, Bell } from "lucide-react";

const Navbar = ({ user }) => {
  const getRoleBadge = () => {
    switch (user.role) {
      case "superadmin":
        return (
          <span className="flex items-center gap-1 bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-xs">
            <Crown size={14} /> Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs">
            <Shield size={14} /> Admin
          </span>
        );
      case "user":
        return (
          <span className="flex items-center gap-1 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs">
            <User size={14} /> User
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-gray-600/20 text-gray-400 px-3 py-1 rounded-full text-xs">
            <User size={14} /> Unknown
          </span>
        );
    }
  };

  const getDashboardTitle = () => {
    switch (user.role) {
      case "superadmin":
        return "Super Admin Dashboard";
      case "admin":
        return "Admin Dashboard";
      case "user":
        return "User Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex item-center justify-between px-6">
      <h1 className="text-xl font-semibold text-cyan-50">
        {getDashboardTitle()}
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{user.designation}</span>
        {getRoleBadge()}
        <button className="relative text-slate-300 hover:text-white transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
