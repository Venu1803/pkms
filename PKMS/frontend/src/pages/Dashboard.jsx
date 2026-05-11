import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  Activity,
  ShieldCheck,
  Clock,
  ExternalLink,
  Plus,
  Folder,
  Users,
  Key,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  LogOut,
  ArrowUpRight,
  Zap,
  BarChart2,
} from "lucide-react";

function DonutChart({
  segments,
  size = 120,
  strokeWidth = 14,
  label,
  sublabel,
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let accumulated = 0;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#1e293b"
        strokeWidth={strokeWidth}
      />
      {total === 0 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
      ) : (
        segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = -accumulated * circumference;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "all 0.6s ease" }}
            />
          );
        })
      )}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize="22"
        fontWeight="800"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#64748b"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          textTransform: "uppercase",
        }}
      >
        {sublabel}
      </text>
    </svg>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent, sub, glow }) {
  return (
    <div
      className="stat-card"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a2540 100%)",
        border: `1px solid ${accent}22`,
        borderRadius: "20px",
        padding: "22px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = `1px solid ${accent}55`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 32px ${accent}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = `1px solid ${accent}22`;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Background glow blob */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "8px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#f8fafc",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              style={{
                fontSize: "11px",
                color: accent,
                marginTop: "8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ArrowUpRight size={12} /> {sub}
            </p>
          )}
        </div>
        <div
          style={{
            width: "42px",
            height: "42px",
            background: `${accent}18`,
            border: `1px solid ${accent}33`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={accent} />
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const isSuperAdminOrAdmin =
    user?.role === "superadmin" || user?.role === "admin";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [api.get("/projects")];
      if (isSuperAdminOrAdmin) {
        calls.push(api.get("/audit/recent"));
        calls.push(api.get("/users"));
      }
      const results = await Promise.all(calls);
      setProjects(results[0]?.data || []);
      if (isSuperAdminOrAdmin) {
        setRecentLogs(results[1]?.data || []);
        setUsers(results[2]?.data || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdminOrAdmin]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const inactiveProjects = totalProjects - activeProjects;

  const totalUsers = users.length;
  const adminUsers = users.filter(
    (u) => u.role === "admin" || u.role === "superadmin",
  ).length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const inactiveUsers = totalUsers - activeUsers;

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      status: project.status,
    });
    setShowForm(true);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      if (editingProject) {
        const res = await api.put(
          `/projects/${editingProject._id}`,
          newProject,
        );
        setProjects((prev) =>
          prev.map((p) => (p._id === editingProject._id ? res.data : p)),
        );
      } else {
        const res = await api.post("/projects", newProject);
        setProjects((prev) => [res.data, ...prev]);
      }
      setShowForm(false);
      setEditingProject(null);
      setNewProject({ name: "", description: "", status: "active" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (d) => {
    const date = new Date(d);
    return (
      date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
      " · " +
      date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const actionColor = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("delete") || a.includes("remove")) return "#f87171";
    if (a.includes("create") || a.includes("add")) return "#34d399";
    if (a.includes("update") || a.includes("edit")) return "#60a5fa";
    return "#a78bfa";
  };

  if (!user)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#020817",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid #3b82f6",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );

  const BASE = {
    bg: "#020817",
    card: "#0f172a",
    border: "#1e293b",
    text: "#f8fafc",
    muted: "#64748b",
    blue: "#3b82f6",
    emerald: "#10b981",
    violet: "#8b5cf6",
    amber: "#f59e0b",
    rose: "#f43f5e",
  };

  return (
    <div
      style={{
        background: BASE.bg,
        minHeight: "100vh",
        padding: "32px 32px 48px",
        fontFamily: "'Inter', sans-serif",
        color: BASE.text,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 900,
              color: BASE.text,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: BASE.muted, margin: "4px 0 0", fontSize: "14px" }}>
            Welcome back,{" "}
            <span style={{ color: BASE.blue, fontWeight: 600 }}>
              {user.name}
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: "11px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "20px",
                padding: "2px 10px",
                color: BASE.muted,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {user.role}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchData}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "9px 12px",
              color: BASE.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = BASE.blue;
              e.currentTarget.style.borderColor = `${BASE.blue}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = BASE.muted;
              e.currentTarget.style.borderColor = "#334155";
            }}
            title="Refresh"
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingProject(null);
              setNewProject({ name: "", description: "", status: "active" });
              setShowForm(true);
            }}
            style={{
              background: `linear-gradient(135deg, ${BASE.blue}, #6366f1)`,
              border: "none",
              borderRadius: "12px",
              padding: "9px 18px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: `0 4px 20px ${BASE.blue}40`,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 8px 28px ${BASE.blue}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${BASE.blue}40`;
            }}
          >
            <Plus size={15} /> New Project
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "9px 12px",
              color: BASE.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = BASE.rose;
              e.currentTarget.style.borderColor = `${BASE.rose}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = BASE.muted;
              e.currentTarget.style.borderColor = "#334155";
            }}
            title="Logout"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard
          icon={Folder}
          label="Total Projects"
          value={totalProjects}
          accent={BASE.blue}
          sub="All time"
        />
        <StatCard
          icon={Zap}
          label="Active Projects"
          value={activeProjects}
          accent={BASE.emerald}
          sub="Live now"
        />
        {isSuperAdminOrAdmin && (
          <StatCard
            icon={Users}
            label="Total Users"
            value={totalUsers}
            accent={BASE.violet}
            sub={`${adminUsers} Admin`}
          />
        )}
        {isSuperAdminOrAdmin && (
          <StatCard
            icon={TrendingUp}
            label="Active Users"
            value={activeUsers}
            accent={BASE.amber}
            sub={`${inactiveUsers} Inactive`}
          />
        )}
      </div>

      {/* ── CHARTS + ACTIVITY ── */}
      {isSuperAdminOrAdmin && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Projects Chart */}
          <div
            style={{
              background: BASE.card,
              border: `1px solid ${BASE.border}`,
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "20px",
              }}
            >
              <BarChart2 size={16} color={BASE.blue} />
              <h3
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: BASE.text,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Projects
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <DonutChart
                size={130}
                strokeWidth={16}
                label={totalProjects}
                sublabel="Total"
                segments={[
                  { value: activeProjects, color: BASE.blue },
                  { value: inactiveProjects, color: "#1e3a5f" },
                ]}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  { label: "Active", value: activeProjects, color: BASE.blue },
                  {
                    label: "Inactive",
                    value: inactiveProjects,
                    color: "#1e3a5f",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: s.color,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12px", color: BASE.muted }}>
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: BASE.text,
                        marginLeft: "auto",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users Chart */}
          <div
            style={{
              background: BASE.card,
              border: `1px solid ${BASE.border}`,
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "20px",
              }}
            >
              <Users size={16} color={BASE.violet} />
              <h3
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: BASE.text,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Users
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <DonutChart
                size={130}
                strokeWidth={16}
                label={totalUsers}
                sublabel="Total"
                segments={[
                  { value: adminUsers, color: BASE.rose },
                  { value: activeUsers - adminUsers, color: BASE.emerald },
                  { value: inactiveUsers, color: "#334155" },
                ]}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  { label: "Admin", value: adminUsers, color: BASE.rose },
                  {
                    label: "Active",
                    value: activeUsers - adminUsers,
                    color: BASE.emerald,
                  },
                  { label: "Inactive", value: inactiveUsers, color: "#334155" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: s.color,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12px", color: BASE.muted }}>
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: BASE.text,
                        marginLeft: "auto",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            style={{
              background: BASE.card,
              border: `1px solid ${BASE.border}`,
              borderRadius: "20px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "20px",
              }}
            >
              <Clock size={16} color={BASE.amber} />
              <h3
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: BASE.text,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Recent Activity
              </h3>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "180px",
              }}
            >
              {recentLogs.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: BASE.muted,
                    opacity: 0.5,
                    gap: 8,
                  }}
                >
                  <Activity size={24} />
                  <span style={{ fontSize: "11px" }}>No recent activity</span>
                </div>
              ) : (
                recentLogs.slice(0, 8).map((log) => {
                  const color = actionColor(log.action);
                  return (
                    <div
                      key={log._id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: color,
                          marginTop: 5,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${color}`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {log.action}
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              color: BASE.muted,
                              whiteSpace: "nowrap",
                              marginLeft: 4,
                            }}
                          >
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            color: "#94a3b8",
                            marginTop: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.details}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROJECTS TABLE ── */}
      <div
        style={{
          background: BASE.card,
          border: `1px solid ${BASE.border}`,
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${BASE.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Folder size={16} color={BASE.blue} />
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 800,
                color: BASE.text,
              }}
            >
              Your Projects
            </h2>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "#1e293b",
              border: `1px solid ${BASE.border}`,
              borderRadius: "20px",
              padding: "3px 12px",
              color: BASE.muted,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {projects.length} Total
          </span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              gap: 12,
              color: BASE.muted,
            }}
          >
            <RefreshCw
              size={18}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ fontSize: "14px" }}>Loading projects…</span>
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: BASE.muted,
            }}
          >
            <Folder size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
              No projects yet
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
              Click "New Project" to get started
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0b1120" }}>
                  {["Project", "Status", "Created", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        textAlign: i === 3 ? "right" : "left",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: BASE.muted,
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        borderBottom: `1px solid ${BASE.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <ProjectRow
                    key={project._id}
                    project={project}
                    even={idx % 2 === 0}
                    BASE={BASE}
                    onView={() => navigate(`/projects/${project._id}/keys`)}
                    onEdit={() => handleEditClick(project)}
                    onDelete={() => handleDeleteProject(project._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "24px",
              padding: "32px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <h2
              style={{
                margin: "0 0 24px",
                fontSize: "20px",
                fontWeight: 800,
                color: BASE.text,
              }}
            >
              {editingProject ? "Edit Project" : "New Project"}
            </h2>
            <form onSubmit={handleAddProject}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {[
                  {
                    key: "name",
                    label: "Project Name",
                    type: "text",
                    placeholder: "e.g. Production App",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: BASE.muted,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "8px",
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={newProject[f.key]}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          [f.key]: e.target.value,
                        })
                      }
                      placeholder={f.placeholder}
                      required
                      style={{
                        width: "100%",
                        background: "#020817",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        padding: "11px 14px",
                        color: BASE.text,
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = BASE.blue)}
                      onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                    />
                  </div>
                ))}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: BASE.muted,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "8px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    placeholder="What is this project about?"
                    rows={3}
                    style={{
                      width: "100%",
                      background: "#020817",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      padding: "11px 14px",
                      color: BASE.text,
                      fontSize: "14px",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BASE.blue)}
                    onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: BASE.muted,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "8px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) =>
                      setNewProject({ ...newProject, status: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "#020817",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      padding: "11px 14px",
                      color: BASE.text,
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      appearance: "none",
                      cursor: "pointer",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BASE.blue)}
                    onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div
                  style={{ display: "flex", gap: "12px", paddingTop: "8px" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProject(null);
                      setNewProject({
                        name: "",
                        description: "",
                        status: "active",
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      background: "transparent",
                      color: BASE.muted,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 700,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1e293b";
                      e.currentTarget.style.color = BASE.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = BASE.muted;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "none",
                      background: `linear-gradient(135deg, ${BASE.blue}, #6366f1)`,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 700,
                      boxShadow: `0 4px 20px ${BASE.blue}40`,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {editingProject ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
}

/* ─── Project Row ────────────────────────────────────────────────────────── */
function ProjectRow({ project, even, BASE, onView, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const avatarColors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
  ];
  const colorIdx = project.name?.charCodeAt(0) % avatarColors.length;

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#131f38" : even ? "transparent" : "#0b1120",
        transition: "background 0.15s",
        borderBottom: `1px solid ${BASE.border}`,
      }}
    >
      {/* Project Name */}
      <td style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "11px",
              background: `${avatarColors[colorIdx]}18`,
              border: `1px solid ${avatarColors[colorIdx]}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 800,
              color: avatarColors[colorIdx],
              flexShrink: 0,
            }}
          >
            {getInitials(project.name)}
          </div>
          <div>
            <span
              onClick={onView}
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: hovered ? BASE.blue : BASE.text,
                cursor: "pointer",
                transition: "color 0.15s",
                display: "block",
              }}
            >
              {project.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: BASE.muted,
                display: "block",
                marginTop: "2px",
                maxWidth: "220px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.description || "No description provided"}
            </span>
          </div>
        </div>
      </td>
      {/* Status */}
      <td style={{ padding: "16px 20px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: project.status === "active" ? "#10b98115" : "#64748b15",
            border: `1px solid ${project.status === "active" ? "#10b98133" : "#64748b33"}`,
            color: project.status === "active" ? BASE.emerald : BASE.muted,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                project.status === "active" ? BASE.emerald : BASE.muted,
              boxShadow:
                project.status === "active"
                  ? `0 0 6px ${BASE.emerald}`
                  : "none",
            }}
          />
          {project.status}
        </span>
      </td>
      {/* Created */}
      <td style={{ padding: "16px 20px" }}>
        <span style={{ fontSize: "12px", color: BASE.muted }}>
          {project.createdAt
            ? new Date(project.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      </td>
      {/* Actions */}
      <td style={{ padding: "16px 20px", textAlign: "right" }}>
        <div
          style={{
            display: "flex",
            gap: "6px",
            justifyContent: "flex-end",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        >
          {[
            {
              icon: ExternalLink,
              color: BASE.blue,
              action: onView,
              title: "View Keys",
            },
            { icon: Edit, color: BASE.muted, action: onEdit, title: "Edit" },
            {
              icon: Trash2,
              color: "#f43f5e",
              action: onDelete,
              title: "Delete",
            },
          ].map(({ icon: Icon, color, action, title }) => (
            <button
              key={title}
              onClick={action}
              title={title}
              style={{
                background: "transparent",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                color: BASE.muted,
                display: "flex",
                alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}15`;
                e.currentTarget.style.color = color;
                e.currentTarget.style.borderColor = `${color}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = BASE.muted;
                e.currentTarget.style.borderColor = "#1e293b";
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default Dashboard;
