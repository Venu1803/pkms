import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  Users,
  Package,
  Copy,
  Check,
  Upload,
  Download,
  X,
  RefreshCw,
  Info,
  AlertCircle,
  Bell,
} from "lucide-react";

function ProjectKeys() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [keys, setKeys] = useState([]);
  const [showEnvInput, setShowEnvInput] = useState(false);
  const [newEnv, setNewEnv] = useState("");
  const [keyTypes, setKeyTypes] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    value: "",
    keyType: "",
    environment: "",
    expiryDate: "",
    data: {},
  });
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [renameModal, setRenameModal] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [showModuleInput, setShowModuleInput] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importedKeyNames, setImportedKeyNames] = useState(new Set());
  const [baseKeys, setBaseKeys] = useState([]);
  const [overrideKeys, setOverrideKeys] = useState([]);
  const [_syncedModules, _setSyncedModules] = useState(new Set());
  const [_isFetching, _setIsFetching] = useState(false);
  const [_syncLoading, _setSyncLoading] = useState(false);
  const [_syncSuccess, _setSyncSuccess] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareEnvs, setCompareEnvs] = useState([]);

  const MODULE_ALIAS_MAP = {
    DB: "database",
    AUTH: "auth",
    EMAIL: "email",
    PAYMENT: "payment",
    S3: "storage",
    REFRESH: "auth service",
    MASTER: "auth service",
    PORT: "config",
    MONG0: "database",
    JWT: "auth service",
    DATABASE: "database",
    CACHE: "cache",
    REDIS: "cache",
  };

  // Extract prefix from key name and detect the module
  const detectModuleFromKeyName = (keyName) => {
    if (!keyName) return "other";
    // Match prefix before first underscore or entire name if no underscore
    const match = keyName.match(/^([A-Z]+[A-Z0-9]*)(?=_|$)/);
    const prefix = match ? match[1] : "OTHER";
    const prefixUpper = prefix.toUpperCase();
    // Return alias if found, otherwise use the prefix in lowercase
    return MODULE_ALIAS_MAP[prefixUpper] || prefix.toLowerCase();
  };

  // Normalize module name via alias map and lowercase fallback
  const _normalizeModule = (moduleName) => {
    if (!moduleName) return "other";
    const normalized = moduleName.trim().toUpperCase();
    return MODULE_ALIAS_MAP[normalized] || moduleName.trim().toLowerCase();
  };

  // Check if module exists in keyTypes (case-insensitive)
  const moduleExists = (moduleName) => {
    if (!moduleName) return false;
    return keyTypes.some(
      (kt) => kt.name.toLowerCase() === moduleName.toLowerCase(),
    );
  };

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Auto-create missing modules and refetch keyTypes
  const autoCreateMissingModules = async (availableKeyTypes, moduleNames) => {
    const created = [];
    const failedModules = [];

    for (const moduleName of moduleNames) {
      // Check if already exists in available list
      const exists = availableKeyTypes.some(
        (kt) => kt.name.toLowerCase() === moduleName.toLowerCase(),
      );
      if (exists) continue;

      try {
        await api.post("/keyTypes", {
          name: moduleName,
          slug: moduleName.toLowerCase().replace(/\s+/g, "-"),
        });
        created.push(moduleName);
      } catch (err) {
        console.error(`Failed to create module ${moduleName}:`, err);
        failedModules.push(moduleName);
      }
    }

    // Refetch keyTypes after creation to get fresh data
    if (created.length > 0) {
      try {
        const res = await api.get("/keyTypes", { params: { projectId } });
        setKeyTypes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to refetch keyTypes:", err);
      }
    }

    return { created, failedModules };
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) return;
    try {
      const res = await api.post("/keyTypes", {
        name: newModuleName,
        slug: newModuleName.toLowerCase().replace(/\s+/g, "-"),
      });
      setKeyTypes([...keyTypes, res.data]);
      setNewModuleName("");
      setShowModuleInput(false);
    } catch (err) {
      console.error(err);
      addToast("Failed to create module");
    }
  };

  const handleRename = async () => {
    if (!renameInput.trim()) return;
    try {
      if (renameModal.type === "env") {
        await api.put(`/environments/${renameModal.id}`, {
          name: renameInput,
        });
        setEnvironments(
          environments.map((e) =>
            e._id === renameModal.id ? { ...e, name: renameInput } : e,
          ),
        );
      } else {
        await api.put(`/keyTypes/rename/${renameModal.originalValue}`, {
          newName: renameInput,
        });

        setKeyTypes(
          keyTypes.map((t) =>
            t.name === renameModal.originalValue
              ? {
                  ...t,
                  name: renameInput,
                  slug: renameInput.toLowerCase().replace(/\s+/g, "-"),
                }
              : t,
          ),
        );
        setKeys(
          keys.map((k) =>
            k.keyType === renameModal.originalValue
              ? { ...k, keyType: renameInput }
              : k,
          ),
        );
        if (selectedModule === renameModal.originalValue)
          setSelectedModule(renameInput);
      }
      setRenameModal(null);
      setRenameInput("");
    } catch (err) {
      console.error(err);
      addToast("Failed to rename");
    }
  };

  const handleDeleteItem = async (type, identifier) => {
    const itemName =
      type === "env"
        ? environments.find((e) => e._id === identifier)?.name
        : identifier;
    if (
      !window.confirm(
        `Are you sure you want to delete ${itemName}? All associated keys will be affected.`,
      )
    )
      return;
    try {
      if (type === "env") {
        await api.delete(`/environments/${identifier}`);
        setEnvironments(environments.filter((e) => e._id !== identifier));
        if (selectedEnv === identifier) setSelectedEnv("");
      } else {
        await api.delete(`/keyTypes/${identifier}`);
        setKeyTypes(keyTypes.filter((t) => t.name !== identifier));
        setKeys(keys.filter((k) => k.keyType !== identifier));
        if (selectedModule === identifier) setSelectedModule("");
      }
      setActiveMenu(null);
      addToast(
        `${type === "env" ? "Environment" : "Module"} deleted successfully`,
        "success",
      );
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }

    const init = async () => {
      await Promise.all([fetchProject(), fetchEnvironments(), fetchKeyTypes()]);
    };
    if (projectId) init();
  }, [projectId]);

  const fetchKeyTypes = async () => {
    try {
      const res = await api.get("/keyTypes", { params: { projectId } });
      setKeyTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching key types:", err);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await api.get(`/environments?projectId=${projectId}`);
      setEnvironments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching environments:", err);
      setEnvironments([]);
    }
  };

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await api.get(`/keys`, {
          params: { projectId, env: selectedEnv },
        });
        const all = Array.isArray(res?.data) ? res.data : [];
        setKeys(all);
      } catch (err) {
        console.error("Error fetching keys:", err);
        setKeys([]);
      }
    };
    if (projectId && selectedEnv) fetchKeys();
  }, [selectedEnv, projectId]);

  useEffect(() => {
    setBaseKeys(keys.filter((k) => !k.isOverride));
    setOverrideKeys(
      selectedModule
        ? keys.filter((k) => k.isOverride && k.keyType === selectedModule)
        : [],
    );
  }, [keys, selectedModule]);

  const handleAddEnvironment = async () => {
    if (!newEnv.trim()) return;
    try {
      const res = await api.post("/environments", {
        name: newEnv,
        projectId: projectId,
      });
      setEnvironments([...environments, res.data]);
      setSelectedEnv(res.data._id);
      setNewEnv("");
      setShowEnvInput(false);
    } catch (err) {
      console.error("Error adding environment:", err);
    }
  };

  const _handleBulkSync = async () => {
    if (!selectedEnv || !selectedModule) return;
    _setSyncLoading(true);
    try {
      await api.post("/keys/bulk-sync", {
        projectId,
        environmentId: selectedEnv,
        moduleName: selectedModule,
        strategy: "merge", // Default to merge for simplicity
      });
      fetchEnvironments();
      const res = await api.get(`/keys`, {
        params: { projectId, env: selectedEnv },
      });
      setKeys(Array.isArray(res.data) ? res.data : []);
      _setSyncSuccess(true);
      setTimeout(() => _setSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Sync failed:", err);
      addToast("Sync failed. Please try again.");
    } finally {
      _setSyncLoading(false);
    }
  };

  const currentEnvSyncStatus = (() => {
    if (!selectedEnv || !selectedModule) return { type: "none" };
    const env = environments.find((e) => e._id === selectedEnv);
    if (!env || !env.syncMetadata) return { type: "none" };
    const meta = env.syncMetadata.find((m) => m.moduleName === selectedModule);
    if (!meta) return { type: "none" };

    const lastSynced = new Date(meta.lastSyncedAt);
    const isOutdated = baseKeys.some(
      (bk) => new Date(bk.updatedAt) > lastSynced,
    );
    return {
      type: isOutdated ? "outdated" : "synced",
      timestamp: lastSynced.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  })();

  /* syncPreview removed for simplicity */

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;
    try {
      await api.delete(`/keys/${keyId}`);
      setKeys(keys.filter((k) => k._id !== keyId));
    } catch (err) {
      console.error("Error deleting key:", err);
      addToast("Failed to delete key");
    }
  };

  const handleEditKey = (mergedRow) => {
    if (mergedRow.label === "Inherited") {
      setEditingKey(null);
      setNewKeyData({
        name: mergedRow.name,
        value: "",
        keyType: selectedModule,
        environment: mergedRow.environment,
        expiryDate: "",
        data: {},

        _isOverride: true,
        _overrideFor: mergedRow._id,
      });
    } else {
      setEditingKey(mergedRow);
      setNewKeyData({
        name: mergedRow.name,
        value: mergedRow.key || mergedRow.value,
        keyType: mergedRow.keyType || "",
        environment: mergedRow.environment,
        expiryDate: mergedRow.expiryDate
          ? new Date(mergedRow.expiryDate).toISOString().split("T")[0]
          : "",
        data: mergedRow.data ? JSON.parse(mergedRow.data) : {},
        _isOverride: mergedRow.isOverride || false,
        _overrideFor: mergedRow.overrideFor || null,
      });
    }
    setShowAddKeyModal(true);
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isOverrideSave = !!newKeyData._isOverride;
      const overrideForId = newKeyData._overrideFor || null;

      const payload = {
        name: newKeyData.name,
        key: newKeyData.value,

        keyType: newKeyData.keyType || selectedModule || null,
        environment: newKeyData.environment || selectedEnv,
        projectId,
        data: JSON.stringify(newKeyData.data || {}),
        expiryDate: newKeyData.expiryDate || null,
        isOverride: isOverrideSave,
        overrideFor: overrideForId,
      };

      if (editingKey) {
        const res = await api.put(`/keys/${editingKey._id}`, payload);
        setKeys((prev) =>
          prev.map((k) => (k._id === editingKey._id ? res.data : k)),
        );
        setOverrideKeys((prev) =>
          prev.map((k) => (k._id === editingKey._id ? res.data : k)),
        );
        if (!isOverrideSave)
          setBaseKeys((prev) =>
            prev.map((k) => (k._id === editingKey._id ? res.data : k)),
          );
      } else {
        const res = await api.post(`/keys`, payload);
        setKeys((prev) => [...prev, res.data]);
        if (isOverrideSave) {
          setOverrideKeys((prev) => [...prev, res.data]);
        } else {
          setBaseKeys((prev) => [...prev, res.data]);
        }
      }

      setShowAddKeyModal(false);
      setEditingKey(null);
      setNewKeyData({
        name: "",
        value: "",
        keyType: "",
        environment: "",
        expiryDate: "",
        data: {},
        _isOverride: false,
        _overrideFor: null,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save key.");
    } finally {
      setLoading(false);
    }
  };

  const userAssignedModules = (() => {
    if (user?.role === "admin" || user?.role === "superadmin") return null;
    if (!project?.members || !user) return [];
    const membership = project.members.find(
      (m) =>
        (m.user?._id || m.user) === user.id ||
        (m.user?._id || m.user) === user._id,
    );
    const modules = membership?.assignedModules || [];
    if (!selectedEnv) return [];

    const envName = environments.find((e) => e._id === selectedEnv)?.name || "";

    // Extract just the module name from the `envName::moduleName` strings
    const filteredModules = modules
      .filter((m) => m.startsWith(`${envName}::`))
      .map((m) => m.split("::")[1]);

    // If no explicit modules assigned for this environment, return null (show all)
    return filteredModules.length === 0 ? null : filteredModules;
  })();

  const filteredKeyTypes =
    userAssignedModules === null
      ? keyTypes
      : keyTypes.filter((kt) => userAssignedModules.includes(kt.name));

  const handleUpdateMemberModules = async (userId, moduleName, isAdding) => {
    try {
      const member = project.members.find(
        (m) => (m.user?._id || m.user) === userId,
      );
      const currentModules = member?.assignedModules || [];
      const newModules = isAdding
        ? [...currentModules, moduleName]
        : currentModules.filter((m) => m !== moduleName);

      const res = await api.patch(
        `/projects/${projectId}/members/${userId}/modules`,
        { assignedModules: newModules },
      );
      setProject(res.data);
    } catch (err) {
      console.error("Error updating member modules:", err);
      addToast("Failed to update modules.");
    }
  };

  const handleImportEnvFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("#");
      });

      // Parse all keys with auto-detected modules
      const parsed = lines
        .map((line) => {
          const eqIndex = line.indexOf("=");
          if (eqIndex === -1) return null;
          const name = line.substring(0, eqIndex).trim();
          const value = line
            .substring(eqIndex + 1)
            .trim()
            .replace(/^["']|["']$/g, "");

          // Auto-detect module from key name
          const detectedModule = detectModuleFromKeyName(name);

          return {
            _id: `dummy-${Date.now()}-${Math.random()}`,
            name,
            value,
            keyType: detectedModule,
          };
        })
        .filter(Boolean);

      // Set preview and show modal for manual review
      setImportPreview(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file);
  };

  // Update individual preview item
  const updatePreviewItem = (index, field, value) => {
    const updated = [...importPreview];
    updated[index] = { ...updated[index], [field]: value };
    setImportPreview(updated);
  };

  // Delete preview item
  const deletePreviewItem = (index) => {
    const updated = importPreview.filter((_, i) => i !== index);
    setImportPreview(updated);
  };

  const importKeysToDb = async (keysToImport) => {
    if (!selectedEnv) {
      addToast("Please select environment before importing .env file.");
      return;
    }

    if (!Array.isArray(keysToImport) || keysToImport.length === 0) {
      addToast("No keys to import.", "error");
      return;
    }

    setImportLoading(true);
    try {
      // Validate and auto-create modules if missing
      const missingModuleNames = [];
      const validatedKeys = keysToImport.map((item) => {
        const exists = moduleExists(item.keyType);
        if (!exists && !missingModuleNames.includes(item.keyType)) {
          missingModuleNames.push(item.keyType);
        }
        return {
          ...item,
          moduleExists: exists,
        };
      });

      if (missingModuleNames.length > 0) {
        const { created, failedModules } = await autoCreateMissingModules(
          keyTypes,
          missingModuleNames,
        );

        if (created.length > 0) {
          addToast(`Created module(s): ${created.join(", ")}`, "success");
        }

        if (failedModules.length > 0) {
          addToast(
            `Failed to create: ${failedModules.join(", ")}. Import cancelled.`,
            "error",
          );
          return;
        }
      }

      // Build upsert payload with actual env setting
      const payloadKeys = validatedKeys.map((item) => ({
        name: item.name,
        key: item.value,
        keyType: item.keyType,
        environment: selectedEnv,
        isOverride: false,
        overrideFor: null,
      }));

      await api.post("/keys/bulk-upsert", { projectId, keys: payloadKeys });
      setImportPreview([]);

      // Track imported key names
      const importedNames = new Set(validatedKeys.map((item) => item.name));
      setImportedKeyNames(importedNames);

      const res = await api.get(`/keys`, {
        params: { projectId, env: selectedEnv },
      });
      setKeys(Array.isArray(res.data) ? res.data : []);
      addToast("Keys imported and saved successfully!", "success");
      setShowImportModal(false);
    } catch (err) {
      console.error("Import failed:", err);
      addToast("Failed to import keys.", "error");
    } finally {
      setImportLoading(false);
    }
  };

  // --- Reset a module override back to the base value ---
  const handleResetOverride = async (overrideKeyId) => {
    if (
      !window.confirm(
        "Remove this override? The key will revert to the base value.",
      )
    )
      return;
    try {
      await api.delete(`/keys/${overrideKeyId}/override`);
      setKeys((prev) => prev.filter((k) => k._id !== overrideKeyId));
      setOverrideKeys((prev) => prev.filter((k) => k._id !== overrideKeyId));
      addToast("Override reset successfully", "success");
    } catch (err) {
      console.error("Error resetting override:", err);
      addToast(
        err.response?.data?.message || "Failed to reset override.",
        "error",
      );
    }
  };

  // --- Merge: base keys + overrides for current module view ---
  // In "All" view: show all non-override keys (backwards compatible with old data)
  // In module view: show all base keys, replacing value with override where it exists
  const mergedRows = (() => {
    if (!selectedModule) {
      // All view: show all non-override keys (backwards compatible with old data)
      return baseKeys
        .filter((k) => k.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(
          (k) =>
            userAssignedModules === null ||
            (userAssignedModules && userAssignedModules.includes(k.keyType)),
        )
        .map((k) => ({ ...k, label: "Base" }));
    }

    // Filter base keys that match selected module (keys with explicit keyType)
    const moduleBase = baseKeys.filter(
      (k) => k.keyType && k.keyType === selectedModule,
    );
    return moduleBase
      .filter((k) => k.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((base) => {
        const override = overrideKeys.find(
          (o) => o.overrideFor?.toString() === base._id.toString(),
        );
        if (override) {
          return {
            ...override,
            baseName: base.name,
            baseKey: base,
            label: "Overridden",
          };
        }
        return { ...base, label: "Inherited" };
      });
  })();

  const _fetchKeyHistory = async (keyId) => {
    try {
      setLoading(true);
      const res = await api.get(`/audit/key/${keyId}`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      addToast("Failed to fetch history.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredKeys = mergedRows;

  const handleExportEnv = () => {
    const keysToExport = filteredKeys.filter((k) =>
      importedKeyNames.has(k.name),
    );

    if (keysToExport.length === 0) {
      addToast("No imported keys to export");
      return;
    }
    const envText = keysToExport.map((k) => `${k.name}=${k.key}`).join("\n");
    const blob = new Blob([envText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    a.download = ".env";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            {project?.name || "Project Keys"}
          </h1>
          <p className="text-slate-400 text-sm">
            Manage configuration keys for this project
          </p>
        </div>
      </div>

      <div
        data-testid="project-toolbar"
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-lg"
      >
        <div className="relative w-full md:w-64 flex items-center gap-2">
          <div className="relative flex-1">
            <label htmlFor="env-select" className="sr-only">
              Environment
            </label>
            <select
              id="env-select"
              name="environment"
              role="combobox"
              aria-expanded="false"
              aria-label="Environment"
              value={selectedEnv}
              onChange={(e) => {
                if (e.target.value === "add_new") {
                  setShowEnvInput(true);
                } else {
                  setSelectedEnv(e.target.value);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-blue-500/50 outline-none pr-10"
            >
              <option value="">Select Environment</option>
              {environments.map((env) => (
                <option key={env._id} value={env._id}>
                  {env.name}
                </option>
              ))}
              {(user?.role === "admin" || user?.role === "superadmin") && (
                <option value="add_new">+ Add New Environment</option>
              )}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              size={16}
            />
          </div>

          {selectedEnv &&
            (user?.role === "admin" || user?.role === "superadmin") && (
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveMenu({
                    type: "env",
                    id: selectedEnv,
                    x: rect.left,
                    y: rect.bottom + 8,
                  });
                }}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 group relative"
              >
                <MoreVertical size={18} />
              </button>
            )}
        </div>

        {showEnvInput && (
          <div className="flex gap-2 w-full md:w-auto animate-in fade-in slide-in-from-left-2">
            <input
              type="text"
              value={newEnv}
              onChange={(e) => setNewEnv(e.target.value)}
              placeholder="Env name"
              className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={handleAddEnvironment}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Save
            </button>
          </div>
        )}

        <div className="flex-1"></div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Module Filter
            </label>
            <div className="relative mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  id="module-select-trigger"
                  onClick={() => setShowModuleDropdown(!showModuleDropdown)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between hover:border-slate-600 transition-colors focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                  <span className="truncate">
                    {selectedModule || "All Modules"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${
                      showModuleDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showModuleDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowModuleDropdown(false)}
                    />
                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-20 max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModule("");
                          setShowModuleDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${
                          !selectedModule
                            ? "text-blue-400 font-medium"
                            : "text-white"
                        }`}
                      >
                        All Modules
                      </button>
                      {filteredKeyTypes.map((type) => (
                        <button
                          key={type._id}
                          type="button"
                          onClick={() => {
                            setSelectedModule(type.name);
                            setShowModuleDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${
                            selectedModule === type.name
                              ? "text-blue-400 font-medium"
                              : "text-white"
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                      {[...new Set(keys.map((k) => k.keyType).filter(Boolean))]
                        .filter((name) => !keyTypes.find((t) => t.name === name))
                        .map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setSelectedModule(name);
                              setShowModuleDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${
                              selectedModule === name
                                ? "text-blue-400 font-medium"
                                : "text-white"
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {selectedModule &&
                (user?.role === "admin" || user?.role === "superadmin") && (
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setActiveMenu({
                        type: "module",
                        name: selectedModule,
                        x: rect.left,
                        y: rect.bottom + 8,
                      });
                    }}
                    className="p-3 hover:bg-slate-800 rounded-xl text-slate-400"
                  >
                    <MoreVertical size={18} />
                  </button>
                )}
            </div>

            {user?.role === "admin" || user?.role === "superadmin" ? (
              showModuleInput ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Module name"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateModule()}
                    className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowModuleInput(false)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateModule}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-900/20"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowModuleInput(true)}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Create Module
                </button>
              )
            ) : null}
          </div>

          {(user?.role === "admin" || user?.role === "superadmin") &&
            project?.members && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={14} /> Assign Modules
                </label>
                <div className="space-y-2">
                  {project.members.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No members in this project.
                    </p>
                  ) : (
                    project.members.map((member) => {
                      const memberId = member.user?._id || member.user;
                      const isExpanded = expandedMember === memberId;
                      return (
                        <div
                          key={memberId}
                          className="rounded-lg border border-slate-800 overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedMember(isExpanded ? null : memberId)
                            }
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                              {member.user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {member.user?.name || "Unknown"}
                              </p>
                              <p className="text-[10px] text-slate-500 capitalize">
                                {member.role}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                size={14}
                                className="text-slate-500 shrink-0"
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                                className="text-slate-500 shrink-0"
                              />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-slate-800/50 pt-2 animate-in fade-in slide-in-from-top-1">
                              {keyTypes.length === 0 || !selectedEnv ? (
                                <p className="text-xs text-slate-500 italic">
                                  {!selectedEnv
                                    ? "Please select an environment first."
                                    : "No modules available."}
                                </p>
                              ) : (
                                keyTypes.map((kt) => {
                                  const envName = environments.find(
                                    (e) => e._id === selectedEnv,
                                  )?.name;
                                  const moduleKey = `${envName}::${kt.name}`;
                                  const isAssigned = (
                                    member.assignedModules || []
                                  ).includes(moduleKey);
                                  return (
                                    <label
                                      key={kt._id}
                                      className="flex items-center gap-2 cursor-pointer group px-1 py-1 rounded hover:bg-slate-800/30 transition"
                                    >
                                      <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 accent-blue-600"
                                        checked={isAssigned}
                                        onChange={(e) =>
                                          handleUpdateMemberModules(
                                            memberId,
                                            moduleKey,
                                            e.target.checked,
                                          )
                                        }
                                      />
                                      <span className="text-xs text-slate-300 group-hover:text-white flex items-center gap-1.5">
                                        <Package
                                          size={11}
                                          className="text-blue-400"
                                        />
                                        {kt.name}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/10 shadow-inner">
                <Plus size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">
                  Configuration Keys
                </h3>
                <p className="text-slate-400 text-xs">
                  Manage environment variables and secrets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setImportPreview([]);
                  setShowImportModal(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 active:scale-95 text-sm"
              >
                <Upload size={16} /> Import .env
              </button>

              <button
                onClick={handleExportEnv}
                disabled={importedKeyNames.size === 0}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 active:scale-95 text-sm"
              >
                <Download size={16} /> Export .env
              </button>
              <button
                onClick={() => {
                  setEditingKey(null);
                  setShowAddKeyModal(true);
                  setNewKeyData({
                    name: "",
                    value: "",
                    keyType: selectedModule || "",
                    environment: selectedEnv,
                    expiryDate: "",
                    data: {},
                    _isOverride: false,
                    _overrideFor: null,
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 active:scale-95 text-sm"
              >
                <Plus size={18} /> Add New Key
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm min-h-[400px] flex flex-col">
            {selectedEnv ? (
              <>
                <div
                  className={`flex items-center justify-between px-5 py-3 border-b transition-colors ${
                    !selectedModule || currentEnvSyncStatus !== "none"
                      ? "border-slate-800 bg-slate-900/80"
                      : "border-amber-500/20 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package
                      size={13}
                      className={
                        !selectedModule || currentEnvSyncStatus !== "none"
                          ? "text-blue-400 shrink-0"
                          : "text-amber-400 shrink-0"
                      }
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-[0.1em] font-bold">
                      <tr>
                        <th className="p-5 border-b border-slate-800">Name</th>
                        <th className="p-5 border-b border-slate-800 w-[300px]">
                          Value
                        </th>
                        <th className="p-5 border-b border-slate-800 text-center">
                          Module
                        </th>
                        <th className="p-5 border-b border-slate-800 text-center">
                          Expiry Date
                        </th>
                        <th className="p-5 border-b border-slate-800 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800/50">
                      {mergedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-20 text-slate-500"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl text-slate-700 opacity-20 text-center w-full block">
                                No keys found
                              </span>
                              {!selectedModule && (
                                <p className="text-sm text-slate-600">
                                  Add base keys using the{" "}
                                  <strong className="text-slate-500">
                                    Add New Key
                                  </strong>{" "}
                                  button above.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        mergedRows.map((row) => (
                          <tr
                            key={row._id || row.name}
                            className={`group hover:bg-slate-800/20 ${
                              row.label === "Inherited" ? "opacity-80" : ""
                            }`}
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white transition-colors group-hover:text-blue-400">
                                  {row.name}
                                </span>
                                {row.label === "Overridden" && (
                                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                                    Override
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-5 w-[300px]">
                              <div className="flex items-center gap-2 group/val">
                                <code className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex-1 font-mono text-blue-300">
                                  {visibleKeys[row._id || row.name]
                                    ? row.key || row.value
                                    : "••••••••••••••••"}
                                </code>
                                <button
                                  onClick={() =>
                                    toggleKeyVisibility(row._id || row.name)
                                  }
                                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition"
                                >
                                  {visibleKeys[row._id || row.name] ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      row.key || row.value,
                                    );
                                    setCopiedKeyId(row._id || row.name);
                                    addToast("Copied to clipboard", "success");
                                    setTimeout(
                                      () => setCopiedKeyId(null),
                                      2000,
                                    );
                                  }}
                                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition"
                                >
                                  {copiedKeyId === (row._id || row.name) ? (
                                    <Check
                                      size={14}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-xs text-slate-400">
                                {row.keyType || "—"}
                              </span>
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-xs text-slate-400">
                                {row.expiryDate
                                  ? new Date(
                                      row.expiryDate,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </span>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleEditKey(row)}
                                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-400 transition"
                                  title="Edit"
                                  aria-label="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                {row.label === "Overridden" ? (
                                  <button
                                    onClick={() => handleResetOverride(row._id)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-400 transition"
                                    title="Reset Override"
                                    aria-label="Reset Override"
                                  >
                                    <RefreshCw size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleDeleteKey(row._id, row.isDummy)
                                    }
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition"
                                    title="Delete"
                                    aria-label="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                  <Search size={24} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Select an Environment
                </h3>
                <p className="text-slate-400 max-w-xs text-sm">
                  Choose an environment from the top bar to view and manage your
                  configuration keys.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[80]"
              onClick={() => setActiveMenu(null)}
            ></div>
            <div
              className="fixed z-[90] bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[120px] animate-in fade-in zoom-in duration-200"
              style={{ top: activeMenu.y, left: activeMenu.x }}
            >
              <button
                onClick={() => {
                  setRenameModal({
                    type: activeMenu.type,
                    originalValue:
                      activeMenu.type === "env"
                        ? environments.find((e) => e._id === activeMenu.id)
                            ?.name
                        : activeMenu.name,
                    id: activeMenu.id,
                  });
                  setRenameInput(
                    activeMenu.type === "env"
                      ? environments.find((e) => e._id === activeMenu.id)?.name
                      : activeMenu.name,
                  );
                  setActiveMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 text-white"
              >
                <Edit size={14} className="text-cyan-400" /> Rename
              </button>
              <button
                onClick={() =>
                  handleDeleteItem(
                    activeMenu.type,
                    activeMenu.type === "env" ? activeMenu.id : activeMenu.name,
                  )
                }
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors text-red-400 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>,
          document.body,
        )}

      {renameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in">
            <h3 className="text-lg font-bold mb-4">
              Rename {renameModal.type === "env" ? "Environment" : "Module"}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter new name..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRenameModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold transition"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <button
              onClick={() => {
                setShowAddKeyModal(false);
                setEditingKey(null);
              }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">
              {editingKey
                ? "Edit Key"
                : newKeyData._isOverride
                  ? "Create Module Override"
                  : "Create New Key"}
            </h2>

            <form onSubmit={handleAddKey} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">
                  Name <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Name "
                  value={newKeyData.name}
                  onChange={(e) =>
                    setNewKeyData({ ...newKeyData, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">
                  Value <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showValue ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={newKeyData.value}
                    onChange={(e) =>
                      setNewKeyData({ ...newKeyData, value: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                  >
                    {showValue ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">
                    Environment
                  </label>
                  <select
                    required
                    value={newKeyData.environment}
                    onChange={(e) =>
                      setNewKeyData({
                        ...newKeyData,
                        environment: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition appearance-none"
                  >
                    <option value="">Select</option>
                    {environments.map((env) => (
                      <option key={env._id} value={env._id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">
                    Module
                  </label>
                  <select
                    required
                    value={newKeyData.keyType}
                    onChange={(e) =>
                      setNewKeyData({
                        ...newKeyData,
                        keyType: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition appearance-none"
                  >
                    <option value="">Select</option>
                    {keyTypes.map((type) => (
                      <option key={type._id || type.name} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newKeyData.expiryDate}
                    onChange={(e) =>
                      setNewKeyData({
                        ...newKeyData,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddKeyModal(false);
                    setEditingKey(null);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition font-bold shadow-lg shadow-blue-900/40 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingKey
                      ? "Update Key"
                      : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportPreview([]);
              }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-1">
              Import .env File
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Upload a .env file to import environment variables. Review and
              edit the data before confirming the import.
              <br />
              Supported format: <span className="text-slate-300">.env</span>
            </p>

            {/* Upload Section */}
            {importPreview.length === 0 && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 cursor-pointer transition-colors mb-6 group">
                <Upload
                  size={24}
                  className="text-slate-500 group-hover:text-slate-300 mb-2 transition"
                />
                <span className="text-sm text-slate-400 group-hover:text-white transition">
                  Upload Environment File
                </span>
                <input
                  type="file"
                  accept=".env,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0])
                      handleImportEnvFile(e.target.files[0]);
                  }}
                />
              </label>
            )}

            {/* Preview Table */}
            {importPreview.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-6">
                <div className="mb-4 p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2 font-medium">
                    Detected Modules (Matching Status):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...new Set(importPreview.map((item) => item.keyType)),
                    ].map((module) => {
                      const count = importPreview.filter(
                        (item) => item.keyType === module,
                      ).length;
                      const moduleExists = keyTypes.some(
                        (kt) => kt.name.toUpperCase() === module.toUpperCase(),
                      );
                      return (
                        <span
                          key={module}
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${
                            moduleExists
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}
                          title={
                            moduleExists
                              ? "Module exists"
                              : "Module will be auto-created"
                          }
                        >
                          {module} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>

                <table className="w-full text-left text-sm bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                        Value
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                        Module
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {importPreview.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 group">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updatePreviewItem(index, "name", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              updatePreviewItem(index, "value", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.keyType}
                            onChange={(e) =>
                              updatePreviewItem(
                                index,
                                "keyType",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select Module</option>
                            {keyTypes.map((kt) => (
                              <option key={kt._id} value={kt.name}>
                                {kt.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deletePreviewItem(index)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition opacity-0 group-hover:opacity-100"
                            title="Delete this item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview([]);
                }}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
              >
                Cancel
              </button>
              {importPreview.length > 0 && (
                <button
                  onClick={() => {
                    setImportPreview([]);
                  }}
                  className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
                >
                  Upload New File
                </button>
              )}
              <button
                onClick={() => importKeysToDb(importPreview)}
                disabled={importPreview.length === 0 || importLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold shadow-lg shadow-blue-600/20 transition active:scale-95"
              >
                {importLoading
                  ? "Importing..."
                  : `Import ${importPreview.length} Keys`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => {
                setShowHistoryModal(null);
                setAuditLogs([]);
              }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <History size={24} className="text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Key History</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6 font-mono bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
              {showHistoryModal.name}
            </p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="py-20 text-center text-slate-500">
                  <RefreshCw
                    size={32}
                    className="animate-spin mx-auto mb-4 opacity-20"
                  />
                  <p className="text-sm font-medium">
                    Loading activity logs...
                  </p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                  <Info size={32} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">
                    No history found for this key.
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          log.action === "CREATE"
                            ? "bg-green-500/10 text-green-400"
                            : log.action === "DELETE"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold uppercase translate-y-[-1px]">
                        {log.performedByName?.[0] || "S"}
                      </div>
                      <span className="text-xs text-slate-400">
                        Performed by{" "}
                        <span className="text-slate-200 font-medium">
                          {log.performedByName || "System"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition font-bold"
              >
                Close
              </button>
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

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[130] p-6">
          <div className="w-full max-w-6xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 relative max-h-[90vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition p-2 hover:bg-slate-800 rounded-full"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/20">
                <RefreshCw size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Environment Comparison
                </h2>
                <p className="text-slate-400 text-sm">
                  Review configuration differences across your stages
                </p>
              </div>
            </div>

            <div className="flex gap-4 mb-6 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl overflow-x-auto">
              {environments.map((env) => (
                <button
                  key={env._id}
                  onClick={() => {
                    if (compareEnvs.includes(env._id)) {
                      setCompareEnvs((prev) =>
                        prev.filter((id) => id !== env._id),
                      );
                    } else if (compareEnvs.length < 3) {
                      setCompareEnvs((prev) => [...prev, env._id]);
                    } else {
                      addToast(
                        "Select up to 3 environments to compare",
                        "info",
                      );
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    compareEnvs.includes(env._id)
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {env.name}
                </button>
              ))}
              {compareEnvs.length === 0 && (
                <span className="text-sm text-slate-500 flex items-center px-4 italic">
                  Select environments to compare...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar border border-slate-800 rounded-2xl">
              {compareEnvs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr>
                      <th className="p-4 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-slate-950/80">
                        Key Name
                      </th>
                      {compareEnvs.map((envId) => (
                        <th
                          key={envId}
                          className="p-4 border-b border-slate-800 text-sm font-bold text-blue-400 bg-slate-950/80"
                        >
                          {environments.find((e) => e._id === envId)?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {[...new Set(keys.map((k) => k.name))]
                      .sort()
                      .map((keyName) => {
                        const values = compareEnvs.map(
                          (envId) =>
                            keys.find(
                              (k) =>
                                k.name === keyName && k.environment === envId,
                            )?.key || "—",
                        );
                        const isDifferent =
                          new Set(values.filter((v) => v !== "—")).size > 1;

                        return (
                          <tr
                            key={keyName}
                            className={`hover:bg-white/[0.02] transition-colors ${isDifferent ? "bg-amber-500/[0.02]" : ""}`}
                          >
                            <td className="p-4 py-3 font-mono text-xs text-slate-300 border-r border-slate-800/50">
                              <div className="flex items-center gap-2">
                                {keyName}
                                {isDifferent && (
                                  <AlertCircle
                                    size={12}
                                    className="text-amber-500"
                                    title="Values differ"
                                  />
                                )}
                              </div>
                            </td>
                            {values.map((val, idx) => (
                              <td key={idx} className="p-4 py-3 text-sm">
                                <code
                                  className={`text-xs px-2 py-1 rounded truncate block max-w-[200px] ${
                                    val === "—"
                                      ? "text-slate-600"
                                      : isDifferent
                                        ? "text-amber-400 bg-amber-400/5"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {val}
                                </code>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 opacity-50">
                    <RefreshCw size={24} />
                  </div>
                  <p className="text-lg font-medium text-slate-400">
                    Select at least one environment above to start comparing
                    configurations
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 transition active:scale-95"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectKeys;
