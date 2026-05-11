import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Shield,
  Lock,
  CheckSquare,
  Check,
  Info,
  AlertCircle,
} from "lucide-react";

const PERMISSIONS_LIST = [
  { key: "viewKeys", label: "View Keys" },
  { key: "editKeys", label: "Edit Keys" },
  { key: "deleteKeys", label: "Delete Keys" },
  { key: "createKeys", label: "Create Keys" },
];

const ITEMS_PER_PAGE = 5;

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(date) {
  if (!date) return "Never";
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const emptyForm = {
    name: "",
    email: "",
    role: "",
    designation: "",
    employeeId: "",
    status: "active",
    password: "",
    permissions: [],
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (roles.length > 0 && !formData.role && !editingUser) {
      setFormData((prev) => ({
        ...prev,
        role: roles[0].name,
        permissions: roles[0].permissions ?? [],
      }));
    }
  }, [roles, editingUser, formData.role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error("Failed to fetch users or roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatRoleLabel = (roleName) => {
    if (!roleName) return "";
    return roleName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  const getRoleLabel = (roleName) => {
    const role = roles.find((r) => r.name === roleName);
    return role ? formatRoleLabel(role.name) : formatRoleLabel(roleName);
  };

  const getRoleColor = (roleName) => {
    const colors = [
      "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      "bg-orange-500/15 text-orange-400 border border-orange-500/30",
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
      "bg-rose-500/15 text-rose-400 border border-rose-500/30",
      "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < (roleName || "").length; i++) {
      hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const roleOptions = useMemo(() => {
    return roles.map((role) => ({
      value: role.name,
      label: formatRoleLabel(role.name),
    }));
  }, [roles]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (getRoleLabel(u.role) || u.role)?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pageUsers = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      designation: user.designation || "",
      employeeId: user.employeeId || "",
      status: user.status || "active",
      password: "",
      permissions: user.permissions || [],
    });
    setFormError("");
    setShowAddModal(true);
  };

  const openViewModal = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete "${user.name}"?`))
      return;
    try {
      await api.delete(`/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete user", "error");
    }
  };

  const handleRoleChange = (role) => {
    const matchedRole = roles.find((r) => r.name === role);
    const perms = matchedRole?.permissions ?? [];
    setFormData((prev) => ({ ...prev, role, permissions: perms }));
  };

  const handlePermissionToggle = (perm) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setFormError("Password is required for new users.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (editingUser && !payload.password.trim()) {
        delete payload.password;
      }

      if (editingUser) {
        const res = await api.put(`/users/${editingUser._id}`, payload);
        setUsers((prev) =>
          prev.map((u) => (u._id === editingUser._id ? res.data : u)),
        );
      } else {
        const res = await api.post("/users", payload);
        setUsers((prev) => [res.data, ...prev]);
      }

      setShowAddModal(false);
      setEditingUser(null);
      setFormData(emptyForm);
      addToast(
        editingUser
          ? "User updated successfully!"
          : "User created successfully!",
        "success",
      );
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-slate-400 mt-1">
          Manage and administer system users
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition text-sm"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-600/20 text-sm"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/60">
                {[
                  "NAME",
                  "EMPLOYEE ID",
                  "ROLE",
                  "EMAIL",
                  "STATUS",
                  "LAST ACTIVE",
                  "ACTIONS",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-4 px-5 text-xs font-semibold text-slate-400 tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(user.name)}`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {user.name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {user.designation ||
                              getRoleLabel(user.role) ||
                              user.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-300 text-sm">
                      {user.employeeId || "—"}
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                      >
                        {getRoleLabel(user.role) || user.role}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-300 text-sm">
                      {user.email}
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === "active"
                              ? "bg-emerald-400"
                              : "bg-red-400"
                          }`}
                        />
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-400 text-sm">
                      {timeAgo(user.lastActive || user.updatedAt)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-end gap-4 px-5 py-4 border-t border-slate-700/60">
            <span className="text-sm text-slate-400">
              {startIdx + 1}–
              {Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold text-white">
                  {editingUser ? "Edit User" : "Add User"}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <User size={14} /> Full Name
                </label>
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Mail size={14} /> Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    placeholder="e.g. 001"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    placeholder="e.g. Developer"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Shield size={14} /> Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm appearance-none cursor-pointer"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <CheckSquare size={14} /> Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm appearance-none cursor-pointer"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Lock size={14} /> Password
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current"
                        : "Create a password"
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                  <CheckSquare size={14} /> Permissions
                </label>
                <div className="flex flex-wrap gap-4">
                  {PERMISSIONS_LIST.map((p) => (
                    <label
                      key={p.key}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(p.key)}
                        onChange={() => handlePermissionToggle(p.key)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-slate-300">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {submitting
                    ? "Saving..."
                    : editingUser
                      ? "Update User"
                      : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">User Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Avatar + name header */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${getAvatarColor(viewingUser.name)}`}
                >
                  {getInitials(viewingUser.name)}
                </div>
                <div>
                  <p className="text-white text-lg font-semibold">
                    {viewingUser.name}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {viewingUser.designation || getRoleLabel(viewingUser.role)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <DetailRow label="Email" value={viewingUser.email} />
                <DetailRow
                  label="Employee ID"
                  value={viewingUser.employeeId || "—"}
                />
                <DetailRow
                  label="Role"
                  value={getRoleLabel(viewingUser.role) || viewingUser.role}
                />
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        viewingUser.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewingUser.status === "active"
                            ? "bg-emerald-400"
                            : "bg-red-400"
                        }`}
                      />
                      {viewingUser.status === "active" ? "Active" : "Inactive"}
                    </span>
                  }
                />
                <DetailRow
                  label="Permissions"
                  value={
                    <div className="flex flex-wrap gap-1.5">
                      {(viewingUser.permissions || []).map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs"
                        >
                          {PERMISSIONS_LIST.find((pl) => pl.key === p)?.label ||
                            p}
                        </span>
                      ))}
                    </div>
                  }
                />
                <DetailRow
                  label="Last Active"
                  value={timeAgo(
                    viewingUser.lastActive || viewingUser.updatedAt,
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-in fade-in slide-in-from-right-10 duration-300 backdrop-blur-md ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : toast.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            <div
              className={`p-1 rounded-full ${
                toast.type === "success"
                  ? "bg-green-500/20"
                  : toast.type === "error"
                    ? "bg-red-500/20"
                    : "bg-blue-500/20"
              }`}
            >
              {toast.type === "success" ? (
                <Check size={14} />
              ) : toast.type === "error" ? (
                <AlertCircle size={14} />
              ) : (
                <Info size={14} />
              )}
            </div>
            <span className="text-sm font-semibold">{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="ml-4 hover:opacity-70 transition text-slate-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-700/40">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default UserManagement;
