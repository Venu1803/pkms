import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  Users,
  UserCog,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between min-h-screen">
      <div>
        <div className="px-4 py-6">
          <h2 className="text-cyan-50 font-semibold text-lg">Key Accel</h2>
        </div>

        <nav className="px-4 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            to="/dashboard"
            active={location.pathname === "/dashboard"}
          />

          <SidebarItem
            icon={<Folder size={18} />}
            label="Projects"
            to="/projects"
            active={location.pathname === "/projects"}
          />

          <SidebarItem
            icon={<Users size={18} />}
            label="User Management"
            to="/user-management"
            active={location.pathname === "/user-management"}
          />

          {(user?.role === "superadmin" || user?.role === "admin") && (
            <SidebarItem
              icon={<Shield size={18} />}
              label="Role Management"
              to="/roles"
              active={location.pathname === "/roles"}
            />
          )}
        </nav>
      </div>

      <div className="px-4 pb-6 space-y-6">
        <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
          <img
            src={`https://ui-avatars.com/api/?name=${user?.name}`}
            alt="profile"
            className="w-10 h-10 rounded-full"
          />

          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-red-400 hover:bg-slate-800 p-3 rounded-lg transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, to }) => {
  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
};

export default Sidebar;
