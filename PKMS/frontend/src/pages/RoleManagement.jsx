import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Shield,
  ShieldCheck,
  ShieldOff,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";

// ─── Base Permissions Catalogue ──────────────────────────────────────────────
const BASE_MATRIX = [];

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
            t.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : t.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}
        >
          {t.type === "success" ? (
            <Check size={16} />
          ) : t.type === "error" ? (
            <AlertCircle size={16} />
          ) : (
            <Info size={16} />
          )}
          <span className="text-sm font-medium">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Permission Checkbox ──────────────────────────────────────────────────────
function Checkbox({ checked, onChange, disabled, label, indeterminate }) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center transition ${
            checked || indeterminate
              ? "bg-[#6366f1] border-[#6366f1]"
              : "border-slate-600 bg-transparent"
          }`}
        >
          {checked && !indeterminate && (
            <Check size={12} className="text-white" strokeWidth={3} />
          )}
          {indeterminate && !checked && (
            <div className="w-2 h-0.5 bg-white rounded-full" />
          )}
        </div>
      </div>
      {label && (
        <div className="text-sm font-medium text-slate-300">{label}</div>
      )}
    </label>
  );
}

function RoleCard({
  role,
  onEdit,
  onDelete,
  expanded,
  onToggle,
  allPermissionsFlat,
}) {
  const activePerms = (role.permissions || []).map(
    (k) => allPermissionsFlat.find((p) => p.key === k)?.label || k,
  );

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        role.isProtected
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60"
      }`}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              role.isProtected
                ? "bg-amber-500/15 text-amber-400"
                : "bg-violet-500/15 text-violet-400"
            }`}
          >
            {role.isProtected ? <Lock size={17} /> : <Shield size={17} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm capitalize">
                {role.name}
              </h3>
              {role.isProtected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Protected
                </span>
              )}
            </div>
            {role.description && (
              <p className="text-xs text-slate-400 mt-0.5">
                {role.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">
            {activePerms.length} permission{activePerms.length !== 1 ? "s" : ""}
          </span>

          {!role.isProtected && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(role);
                }}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition"
                title="Edit role"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(role);
                }}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                title="Delete role"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded permissions */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4">
          {activePerms.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No permissions assigned.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activePerms.map((label) => (
                <span
                  key={label}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Role Form Modal ──────────────────────────────────────────────────────────
function RoleFormModal({ open, role, onClose, onSave, matrixPermissions }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(role?.name || "");
      setDescription(role?.description || "");
      setPermissions(role?.permissions || []);
      setError("");
    }
  }, [open, role]);

  const togglePerm = (key) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const getGroupKeys = (group) => {
    return group.rows.flatMap((r) => [
      ...(r.key ? [r.key] : []),
      ...Object.values(r.actions),
    ]);
  };

  const getRowKeys = (row) => {
    return [...(row.key ? [row.key] : []), ...Object.values(row.actions)];
  };

  const getColumnKeys = (group, col) => {
    return group.rows.map((r) => r.actions[col]).filter(Boolean);
  };

  const toggleGroup = (group) => {
    const keys = getGroupKeys(group);
    if (keys.length === 0) return;
    const allChecked = keys.every((k) => permissions.includes(k));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const toggleRow = (row) => {
    const keys = getRowKeys(row);
    if (keys.length === 0) return;
    const allChecked = keys.every((k) => permissions.includes(k));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const toggleColumn = (group, col) => {
    const keys = getColumnKeys(group, col);
    if (keys.length === 0) return;
    const allChecked = keys.every((k) => permissions.includes(k));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        permissions,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] w-full max-w-3xl rounded-xl shadow-2xl max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center">
              <Shield size={16} className="text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {role ? "Edit Role" : "Create Role"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body – scrollable */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-6 space-y-6"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Role Name */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Role Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. developer, qa-lead"
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Description
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this role can do..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition resize-none"
            />
          </div>

          {/* Permissions section matching screenshot */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-semibold text-slate-200">
                Permissions
              </label>
              <span className="text-sm text-slate-500">
                {permissions.length} selected
              </span>
            </div>

            <div className="space-y-6">
              {matrixPermissions.map((group) => {
                const groupKeys = getGroupKeys(group);
                const checkedGroupKeys = groupKeys.filter((k) =>
                  permissions.includes(k),
                );
                const allGroupChecked =
                  groupKeys.length > 0 &&
                  checkedGroupKeys.length === groupKeys.length;
                const someGroupChecked =
                  checkedGroupKeys.length > 0 && !allGroupChecked;

                return (
                  <div key={group.group} className="space-y-3">
                    {/* Group Header */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allGroupChecked}
                        indeterminate={someGroupChecked}
                        onChange={() => toggleGroup(group)}
                        label={group.group}
                      />
                    </div>

                    {/* Group Table/Matrix */}
                    <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-800/10">
                      {/* Table Header */}
                      <div
                        className="grid border-b border-slate-700/60 bg-slate-800/30 auto-cols-min"
                        style={{
                          gridTemplateColumns: `1fr repeat(${group.columns.length}, minmax(80px, 100px))`,
                        }}
                      >
                        <div className="p-3 font-medium text-slate-300 text-sm flex items-center">
                          {group.group}
                        </div>
                        {group.columns.map((col) => {
                          const colKeys = getColumnKeys(group, col);
                          const checkedColKeys = colKeys.filter((k) =>
                            permissions.includes(k),
                          );
                          const allColChecked =
                            colKeys.length > 0 &&
                            checkedColKeys.length === colKeys.length;
                          const someColChecked =
                            checkedColKeys.length > 0 && !allColChecked;

                          return (
                            <div
                              key={col}
                              className="p-3 border-l border-slate-700/60 flex items-center justify-center"
                            >
                              <Checkbox
                                checked={allColChecked}
                                indeterminate={someColChecked}
                                onChange={() => toggleColumn(group, col)}
                                label={
                                  <span className="text-xs text-slate-400 ml-1">
                                    {col}
                                  </span>
                                }
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Table Rows */}
                      <div className="flex flex-col">
                        {group.rows.map((row, idx) => {
                          const rowKeys = getRowKeys(row);
                          const checkedRowKeys = rowKeys.filter((k) =>
                            permissions.includes(k),
                          );
                          const allRowChecked =
                            rowKeys.length > 0 &&
                            checkedRowKeys.length === rowKeys.length;
                          const someRowChecked =
                            checkedRowKeys.length > 0 && !allRowChecked;

                          return (
                            <div
                              key={row.label}
                              className={`grid ${
                                idx !== group.rows.length - 1
                                  ? "border-b border-slate-700/40"
                                  : ""
                              }`}
                              style={{
                                gridTemplateColumns: `1fr repeat(${group.columns.length}, minmax(80px, 100px))`,
                              }}
                            >
                              <div className="p-3 pl-6 flex items-center">
                                <Checkbox
                                  checked={allRowChecked}
                                  indeterminate={someRowChecked}
                                  onChange={() => toggleRow(row)}
                                  label={
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-200">
                                        {row.label}
                                      </span>
                                      {row.isRestricted && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20">
                                          Restricted
                                        </span>
                                      )}
                                    </div>
                                  }
                                />
                              </div>
                              {group.columns.map((col) => {
                                const actionKey = row.actions[col];
                                return (
                                  <div
                                    key={col}
                                    className="p-3 border-l border-slate-700/40 flex items-center justify-center"
                                  >
                                    {actionKey ? (
                                      <Checkbox
                                        checked={permissions.includes(
                                          actionKey,
                                        )}
                                        onChange={() => togglePerm(actionKey)}
                                      />
                                    ) : (
                                      <span className="text-slate-600 text-xs">
                                        -
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-6 py-4 border-t border-slate-700/60 shrink-0 bg-slate-800/30 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving...
              </>
            ) : role ? (
              "Update Role"
            ) : (
              "Create Role"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, envsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/environments"),
      ]);
      setRoles(rolesRes.data);

      // Deduplicate by normalized name (case-insensitive)
      const seenNames = new Set();
      const deduplicated = envsRes.data.filter((env) => {
        const normalized = env.name.toLowerCase();
        if (seenNames.has(normalized)) return false;
        seenNames.add(normalized);
        return true;
      });
      setEnvironments(deduplicated);
    } catch (err) {
      addToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const matrixPermissions = useMemo(() => {
    // Deduplicate environments by name
    const uniqueEnvs = Array.from(
      new Map(environments.map((env) => [env.name, env])).values(),
    );

    const envRows = uniqueEnvs.map((env) => ({
      label: env.name,
      isRestricted: env.name.toLowerCase() === "production",
      key: `env:${env.name.toLowerCase()}`,
      actions: {},
    }));

    const dynamicMatrix = [...BASE_MATRIX];
    if (envRows.length > 0) {
      dynamicMatrix.push({
        group: "Environments",
        columns: [],
        rows: envRows,
      });
    }
    return dynamicMatrix;
  }, [environments]);

  const allPermissionsFlat = useMemo(() => {
    return matrixPermissions.flatMap((g) =>
      g.rows.flatMap((r) => [
        ...(r.key
          ? [
              {
                key: r.key,
                label: `${g.group} - ${r.label}`,
              },
            ]
          : []),
        ...Object.entries(r.actions).map(([action, key]) => ({
          key,
          label:
            g.group === "Environments"
              ? `${g.group} - ${r.label} ${action}`
              : `${g.group} - ${action}`,
        })),
      ]),
    );
  }, [matrixPermissions]);

  const filtered = roles.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`))
      return;
    try {
      await api.delete(`/roles/${role._id}`);
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
      addToast(`Role "${role.name}" deleted.`, "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to delete role.",
        "error",
      );
    }
  };

  const handleSaveRole = async (data) => {
    if (editingRole) {
      const res = await api.put(`/roles/${editingRole._id}`, data);
      setRoles((prev) =>
        prev.map((r) => (r._id === editingRole._id ? res.data : r)),
      );
      addToast(`Role "${res.data.name}" updated.`, "success");
    } else {
      const res = await api.post("/roles", data);
      setRoles((prev) => [res.data, ...prev]);
      addToast(`Role "${res.data.name}" created.`, "success");
    }
  };

  // Stats
  const total = roles.length;
  const protected_ = roles.filter((r) => r.isProtected).length;
  const totalPermsAssigned = roles.reduce(
    (s, r) => s + (r.permissions?.length || 0),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck size={28} className="text-violet-400" />
          Role Management
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Define roles and configure their permissions dynamically.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          {
            label: "Total Roles",
            value: total,
            color: "#8b5cf6",
            Icon: Shield,
          },
          {
            label: "Protected Roles",
            value: protected_,
            color: "#f59e0b",
            Icon: Lock,
          },
          {
            label: "Permissions Used",
            value: totalPermsAssigned,
            color: "#10b981",
            Icon: ShieldCheck,
          },
        ]).map(({ label, value, color, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border p-5 flex items-center gap-4"
            style={{
              borderColor: `${color}22`,
              background: "rgba(15,23,42,0.8)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none">
                {value}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 text-sm transition"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-violet-600/20 text-sm shrink-0"
        >
          <Plus size={16} />
          New Role
        </button>
      </div>

      {/* ── Roles list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin mb-4" />
          Loading roles…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
          <ShieldOff size={40} className="text-slate-700" />
          <p className="text-sm">
            {search
              ? "No roles match your search."
              : "No roles yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((role) => (
            <RoleCard
              key={role._id}
              role={role}
              onEdit={openEdit}
              onDelete={handleDeleteRole}
              expanded={expandedId === role._id}
              onToggle={() =>
                setExpandedId((prev) => (prev === role._id ? null : role._id))
              }
              allPermissionsFlat={allPermissionsFlat}
            />
          ))}
        </div>
      )}

      {/* ── Permission Guide ── */}
      <div className="mt-8 rounded-2xl border border-slate-700/40 bg-slate-800/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Permissions Reference
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {matrixPermissions.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="space-y-1.5">
                {group.rows.flatMap((r) =>
                  Object.entries(r.actions).map(([action, key]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-300">
                          {r.label}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {" "}
                          – {action}
                        </span>
                      </div>
                    </div>
                  )),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      <RoleFormModal
        open={modalOpen}
        role={editingRole}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRole}
        matrixPermissions={matrixPermissions}
      />

      {/* ── Toasts ── */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default RoleManagement;
