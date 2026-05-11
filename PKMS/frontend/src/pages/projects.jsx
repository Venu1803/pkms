import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserPlus,
  X,
  Package,
} from "lucide-react";
import Sidebar from "../component/sidebar";
import Navbar from "../component/navbar";

function Projects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    projectId: null,
    userIds: [],
    role: "developer",
    permissions: ["viewKeys"],
    assignedModules: [],
    assignedEnvironments: [],
  });
  const [keyTypes, setKeyTypes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [assignEnvironments, setAssignEnvironments] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  var state = useState("all");
  var activeTab = state[0];
  var setActiveTab = state[1];

  const filteredProjects = projects.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "my")
      return p.createdBy === user.id || p.createdBy === user._id;
    if (activeTab === "assigned")
      return (
        user.role === "superadmin" ||
        p.members?.some(
          (m) =>
            (m.user?._id || m.user) === user.id ||
            (m.user?._id || m.user) === user._id,
        )
      );
    return true;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProjects();
      fetchAllUsers();
      fetchKeyTypes();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      console.log("Fetched users from DB:", response.data);
      setAllUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchKeyTypes = async () => {
    try {
      const response = await api.get("/keyTypes");
      setKeyTypes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching key types:", error);
    }
  };

  const fetchAssignEnvironments = async (projectId) => {
    try {
      const response = await api.get(`/environments?projectId=${projectId}`);
      setAssignEnvironments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching environments for assign:", error);
      setAssignEnvironments([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        createdBy: user.name,
      };

      const token = localStorage.getItem("token");
      if (editingProject) {
        const response = await api.put(
          `/projects/${editingProject._id}`,
          projectData,
        );
        setProjects(
          projects.map((p) =>
            p._id === editingProject._id ? response.data : p,
          ),
        );
        setEditingProject(null);
      } else {
        const response = await api.post("/projects", projectData);
        setProjects([response.data, ...projects]);
      }

      setNewProject({
        name: "",
        description: "",
        status: "active",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p._id !== id));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(error.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignData.userIds || assignData.userIds.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    try {
      const response = await api.post(
        `/projects/${assignData.projectId}/members`,
        {
          userIds: assignData.userIds,
          role: assignData.role,
          permissions:
            assignData.permissions.length > 0
              ? assignData.permissions
              : ["viewKeys"],
          assignedModules: assignData.assignedModules,
          assignedEnvironments: assignData.assignedEnvironments,
        },
      );

      setProjects(
        projects.map((p) =>
          p._id === assignData.projectId ? response.data : p,
        ),
      );
      setShowAssignModal(false);
      setOpenMenuId(null);
      setUserSearchTerm("");
      setAssignData({
        projectId: null,
        userIds: [],
        role: "developer",
        permissions: ["viewKeys"],
        assignedModules: [],
        assignedEnvironments: [],
      });
      setAssignEnvironments([]);
      setEditingMember(null);
    } catch (error) {
      console.error("Error assigning user:", error);
      alert("Failed to assign user.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Logged out successfully");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-slate-400">Manage and track all your projects</p>
        </div>
        {(user.role === "admin" || user.role === "superadmin") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Add Project
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-12">
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={function () {
              setActiveTab("all");
            }}
            className={
              "px-5 py-2 rounded-md text-sm transition " +
              (activeTab === "all"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white")
            }
          >
            All Projects
          </button>
          <button
            onClick={function () {
              setActiveTab("my");
            }}
            className={
              "px-5 py-2 rounded-md text-sm transition " +
              (activeTab === "my"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white")
            }
          >
            My Projects
          </button>
          <button
            onClick={function () {
              setActiveTab("assigned");
            }}
            className={
              "px-5 py-2 rounded-md text-sm transition " +
              (activeTab === "assigned"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white")
            }
          >
            Assigned Projects
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none text-sm text-white placeholder-slate-400"
            />
          </div>

          <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-700 transition">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <div className="bg-slate-800/40 p-10 rounded-2xl border border-slate-700 w-full max-w-xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📁</span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Projects Found</h2>

            <p className="text-slate-400 mb-6">
              You haven't created any projects yet.
            </p>

            {(user.role === "admin" || user.role === "superadmin") && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-lg"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No projects match the selected filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-slate-400 font-semibold text-sm">
                    Project Name
                  </th>

                  <th className="py-3 px-4 text-slate-400 font-semibold text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="text-white font-medium block">
                        {project.name}
                      </span>

                      {project.description && (
                        <span className="text-xs text-slate-500 block truncate max-w-xs mt-1">
                          {project.description}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {project.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end relative">
                        <button
                          onClick={(e) => {
                            const isOpening = openMenuId !== project._id;
                            if (isOpening) {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + 8,
                                left: rect.right - 192,
                              });
                              setOpenMenuId(project._id);
                            } else {
                              setOpenMenuId(null);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === project._id &&
                          createPortal(
                            <>
                              <div
                                className="fixed inset-0 z-[60]"
                                onClick={() => setOpenMenuId(null)}
                              ></div>
                              <div
                                style={{
                                  top: `${menuPosition.top}px`,
                                  left: `${menuPosition.left}px`,
                                }}
                                className="fixed w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-200"
                              >
                                <button
                                  onClick={() => {
                                    navigate(`/projects/${project._id}/keys`);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-green-400" />
                                  View Keys
                                </button>
                                {(user.role === "admin" ||
                                  user.role === "superadmin") && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleEditClick(project);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                    >
                                      <Edit className="w-4 h-4 text-blue-400" />
                                      Edit Project
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAssignData({
                                          ...assignData,
                                          projectId: project._id,
                                          userIds: [],
                                          assignedModules: [],
                                          assignedEnvironments: [],
                                        });
                                        fetchAllUsers();
                                        fetchAssignEnvironments(project._id);
                                        setShowAssignModal(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                    >
                                      <UserPlus className="w-4 h-4 text-purple-400" />
                                      Assign User
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteProject(project._id);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-slate-700/50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Project
                                    </button>
                                  </>
                                )}
                              </div>
                            </>,
                            document.body,
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="w-full p-2 rounded-lg bg-slate-900 border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter the project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg bg-slate-900 border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter the project description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      status: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg bg-slate-900 border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-4">
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
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  {editingProject ? "Update Project" : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-1">
              Assign Member to Project
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Select a user, environment, and module to assign access. Members
              will see all keys in their assigned modules.
            </p>

            {assignData.projectId && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Current Members
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {projects
                    .find((p) => p._id === assignData.projectId)
                    ?.members?.map((member) => (
                      <div
                        key={member.user?._id || member.user}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                            {member.user?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {member.user?.name || "Unknown User"}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">
                              {member.role} • {member.permissions?.join(", ")}
                            </p>
                          </div>
                        </div>
                        {(user.role === "superadmin" ||
                          user.role === "admin") && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const mId = member.user?._id || member.user;
                                setEditingMember(mId);
                                setAssignData({
                                  ...assignData,
                                  userIds: [mId],
                                  role: member.role || "developer",
                                  permissions: member.permissions || [
                                    "viewKeys",
                                  ],
                                  assignedModules: member.assignedModules || [],
                                  assignedEnvironments:
                                    member.assignedEnvironments || [],
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                              title="Edit Member"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `Remove ${member.user?.name || "this user"} from the project?`,
                                  )
                                ) {
                                  try {
                                    const response = await api.delete(
                                      `/projects/${assignData.projectId}/members/${member.user?._id || member.user}`,
                                    );
                                    setProjects(
                                      projects.map((p) =>
                                        p._id === assignData.projectId
                                          ? response.data
                                          : p,
                                      ),
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Error removing member:",
                                      error,
                                    );
                                    alert("Failed to remove member.");
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  {(!projects.find((p) => p._id === assignData.projectId)
                    ?.members ||
                    projects.find((p) => p._id === assignData.projectId)
                      ?.members.length === 0) && (
                    <p className="text-xs text-slate-500 italic py-2">
                      No members assigned yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-5">
              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    {editingMember ? "Edit Member" : "Select Users"}
                  </label>
                  {editingMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMember(null);
                        setAssignData({
                          ...assignData,
                          userIds: [],
                          role: "developer",
                          permissions: ["viewKeys"],
                          assignedModules: [],
                          assignedEnvironments: [],
                        });
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      + Add New Instead
                    </button>
                  )}
                </div>
                {editingMember ? (
                  <div className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white">
                    {allUsers.find((u) => u._id === editingMember)?.name ||
                      "Unknown User"}
                    <span className="text-slate-500 ml-2 text-sm">
                      ({allUsers.find((u) => u._id === editingMember)?.email})
                    </span>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {(allUsers || [])
                      .filter(
                        (u) =>
                          !projects
                            .find((p) => p._id === assignData.projectId)
                            ?.members?.some(
                              (m) => (m.user?._id || m.user) === u._id,
                            ),
                      )
                      .map((u) => (
                        <label
                          key={u._id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={assignData.userIds.includes(u._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignData({
                                  ...assignData,
                                  userIds: [...assignData.userIds, u._id],
                                });
                              } else {
                                setAssignData({
                                  ...assignData,
                                  userIds: assignData.userIds.filter(
                                    (id) => id !== u._id,
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm font-medium text-white">
                            {u.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({u.email})
                          </span>
                        </label>
                      ))}
                    {(!allUsers || allUsers.length === 0) && (
                      <p className="p-2 text-xs text-amber-500/80">
                        No users found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Environments & Modules
                  </label>
                  <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {assignEnvironments.map((env) => {
                      const isEnvAssigned =
                        assignData.assignedEnvironments.includes(env.name);
                      return (
                        <div key={env._id} className="mb-2">
                          <label className="flex items-center gap-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isEnvAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignData({
                                    ...assignData,
                                    assignedEnvironments: [
                                      ...assignData.assignedEnvironments,
                                      env.name,
                                    ],
                                  });
                                } else {
                                  setAssignData({
                                    ...assignData,
                                    assignedEnvironments:
                                      assignData.assignedEnvironments.filter(
                                        (n) => n !== env.name,
                                      ),
                                    assignedModules:
                                      assignData.assignedModules.filter(
                                        (m) => !m.startsWith(`${env.name}::`),
                                      ),
                                  });
                                }
                              }}
                              className="w-4 h-4 accent-green-600"
                            />
                            <span className="text-sm font-semibold text-slate-200">
                              {env.name}
                            </span>
                          </label>

                          {isEnvAssigned && (
                            <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-800 pl-3">
                              {keyTypes.map((kt) => {
                                const moduleKey = `${env.name}::${kt.name}`;
                                const isModuleAssigned =
                                  assignData.assignedModules.includes(
                                    moduleKey,
                                  );
                                return (
                                  <label
                                    key={kt._id}
                                    className="flex items-center gap-2 p-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isModuleAssigned}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setAssignData({
                                            ...assignData,
                                            assignedModules: [
                                              ...assignData.assignedModules,
                                              moduleKey,
                                            ],
                                          });
                                        } else {
                                          setAssignData({
                                            ...assignData,
                                            assignedModules:
                                              assignData.assignedModules.filter(
                                                (m) => m !== moduleKey,
                                              ),
                                          });
                                        }
                                      }}
                                      className="w-3.5 h-3.5 accent-blue-600"
                                    />
                                    <span className="text-xs text-slate-400">
                                      {kt.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={assignData.role}
                    onChange={(e) =>
                      setAssignData({ ...assignData, role: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                  >
                    <option value="developer">Developer</option>
                    <option value="devops">DevOps</option>
                    <option value="tester">Tester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Permissions
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {[
                        { id: "viewKeys", label: "View" },
                        { id: "createKeys", label: "Create" },
                        { id: "editKeys", label: "Edit" },
                        { id: "deleteKeys", label: "Delete" },
                      ].map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-1.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-600"
                            checked={assignData.permissions.includes(perm.id)}
                            onChange={(e) => {
                              const newPerms = e.target.checked
                                ? [...assignData.permissions, perm.id]
                                : assignData.permissions.filter(
                                    (p) => p !== perm.id,
                                  );
                              setAssignData({
                                ...assignData,
                                permissions: newPerms,
                              });
                            }}
                          />
                          <span className="text-xs text-slate-300 group-hover:text-white">
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition"
                >
                  {editingMember ? "Update Member" : "Assign Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
