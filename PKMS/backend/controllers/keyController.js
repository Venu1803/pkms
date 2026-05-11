const Key = require("../models/keys");
const Project = require("../models/projects");
const Environment = require("../models/environment");
const KeyType = require("../models/keyType");
const AuditLog = require("../models/AuditLog");
const { encrypt, decrypt } = require("../utils/encryption");
const { validateString } = require("../utils/validation");

exports.getKeys = async (req, res) => {
  try {
    const { slug } = req.params;
    const { projectId, env } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const filter = { projectId };
    if (env) filter.environment = env;
    if (slug) filter.keyType = slug;

    let keys = await Key.find(filter);

    // If user is not admin/creator, filter based on assigned modules/keys
    const project = await Project.findById(projectId).populate("members.user");
    const isAdmin = ["superadmin", "admin", "devops"].includes(req.user.role);
    const isCreator = project && project.createdBy.toString() === req.user.id;
    const member =
      project &&
      project.members.find(
        (m) => m.user && m.user._id.toString() === req.user.id,
      );

    // If member has assigned modules, show only keys in those modules. Otherwise, show nothing.
    if (!isAdmin && !isCreator && member) {
      const hasExplicitAssignments = member.assignedModules?.length > 0;

      if (hasExplicitAssignments) {
        // Resolve environment name for the current env filter
        const Environment = require("../models/environment");
        let envName = null;
        if (env) {
          const envRecord = await Environment.findById(env);
          envName = envRecord?.name;
        }

        keys = keys.filter((key) => {
          // assignedModules are stored as "EnvName::ModuleName"
          // Check if any assigned module matches the key's module
          return member.assignedModules.some((am) => {
            const [amEnv, amModule] = am.split("::");
            // If filtering by env, check both env and module match
            if (envName) {
              return amEnv === envName && amModule === key.keyType;
            }
            // If no env filter, just check module matches
            return amModule === key.keyType;
          });
        });
      } else {
        // No explicit assignments = no access to any keys
        keys = [];
      }
    }

    // Decrypt keys before sending to client
    const decryptedKeys = keys.map((k) => {
      const obj = k.toObject();
      obj.key = decrypt(obj.key);
      return obj;
    });
    res.json(decryptedKeys);
  } catch (error) {
    console.error("Error fetching keys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addKey = async (req, res) => {
  try {
    const {
      name,
      key,
      keyType,
      data,
      environment,
      projectId,
      expiryDate,
      isOverride,
      overrideFor,
    } = req.body;

    // Validate required fields
    const nameValidation = validateString(name, "Key name");
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    const keyValidation = validateString(key, "Key value");
    if (!keyValidation.valid) {
      return res.status(400).json({ message: keyValidation.message });
    }

    if (!environment) {
      return res.status(400).json({ message: "Environment is required" });
    }

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const project = req.project || (await Project.findById(projectId));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const envRecord = await Environment.findById(environment);
    if (!envRecord) {
      return res.status(404).json({ message: "Environment not found" });
    }
    if (envRecord.projectId.toString() !== projectId.toString()) {
      return res.status(400).json({
        message: "Environment does not belong to the provided project",
      });
    }

    if (keyType) {
      const keyTypeRecord = await KeyType.findOne({ slug: keyType });
      if (!keyTypeRecord) {
        return res.status(400).json({ message: "Invalid key type" });
      }
    }

    const newKey = await Key.create({
      name,
      key: encrypt(key),
      keyType: keyType || null,
      data,
      environment,
      projectId,
      expiryDate,
      createdBy: req.user ? req.user.name : "System",
      isOverride: !!isOverride,
      overrideFor: overrideFor || null,
    });

    // Audit Log
    await AuditLog.create({
      action: "CREATE",
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : "System",
      projectId,
      targetId: newKey._id,
      targetName: name,
      newValue: "SECRET_CREATED", // Don't log actual secret in audit detail
      details: `Created key ${name} in environment ${environment}`,
    });

    const decryptedKey = newKey.toObject();
    decryptedKey.key = key; // Return original plain text
    res.status(201).json(decryptedKey);
  } catch (error) {
    console.error("Error adding key:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const {
      name,
      key,
      keyType,
      data,
      environment,
      expiryDate,
      isOverride,
      overrideFor,
    } = req.body;

    const existingKey = await Key.findById(keyId);
    if (!existingKey) return res.status(404).json({ message: "Key not found" });

    const project =
      req.project || (await Project.findById(existingKey.projectId));
    if (!project) {
      return res.status(404).json({ message: "Associated project not found" });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (key !== undefined) updateFields.key = encrypt(key);
    if (keyType !== undefined) updateFields.keyType = keyType || null;
    if (data !== undefined) updateFields.data = data;
    if (environment !== undefined) updateFields.environment = environment;
    if (expiryDate !== undefined) updateFields.expiryDate = expiryDate;
    if (isOverride !== undefined) updateFields.isOverride = !!isOverride;
    if (overrideFor !== undefined) updateFields.overrideFor = overrideFor;

    if (environment !== undefined) {
      const envRecord = await Environment.findById(environment);
      if (!envRecord) {
        return res.status(404).json({ message: "Environment not found" });
      }
      if (envRecord.projectId.toString() !== existingKey.projectId.toString()) {
        return res.status(400).json({
          message: "Environment does not belong to the key's project",
        });
      }
    }

    if (keyType !== undefined && keyType) {
      const keyTypeRecord = await KeyType.findOne({ slug: keyType });
      if (!keyTypeRecord) {
        return res.status(400).json({ message: "Invalid key type" });
      }
    }

    const updatedKey = await Key.findByIdAndUpdate(keyId, updateFields, {
      new: true,
    });

    // Audit Log
    await AuditLog.create({
      action: "UPDATE",
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : "System",
      projectId: project._id,
      targetId: keyId,
      targetName: name || existingKey.name,
      details: `Updated key ${name || existingKey.name}`,
    });

    const decryptedKey = updatedKey.toObject();
    decryptedKey.key = key || decrypt(updatedKey.key);
    res.json(decryptedKey);
  } catch (error) {
    console.error("Error updating key:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const keyToLog = await Key.findById(keyId);
    const deleted = await Key.findByIdAndDelete(keyId);
    if (!deleted) return res.status(404).json({ message: "Key not found" });

    // Audit Log
    await AuditLog.create({
      action: "DELETE",
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : "System",
      projectId: keyToLog?.projectId,
      targetId: keyId,
      targetName: keyToLog?.name,
      details: `Deleted key ${keyToLog?.name}`,
    });

    res.json({ message: "Key deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetOverride = async (req, res) => {
  try {
    const { keyId } = req.params;
    const key = await Key.findById(keyId);
    if (!key) return res.status(404).json({ message: "Key not found" });
    if (!key.isOverride)
      return res.status(400).json({
        message: "This key is not an override and cannot be reset.",
      });
    const keyToLog = await Key.findById(keyId);
    await Key.findByIdAndDelete(keyId);

    // Audit Log
    await AuditLog.create({
      action: "DELETE",
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : "System",
      projectId: keyToLog?.projectId,
      targetId: keyId,
      targetName: keyToLog?.name,
      details: `Removed override for key ${keyToLog?.name}. Reverted to base value.`,
    });

    res.json({ message: "Override removed. Key reverts to base value." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkSyncKeys = async (req, res) => {
  try {
    const { environmentId, moduleName, strategy } = req.body;
    const projectId = req.project._id;

    if (!environmentId || !moduleName || !strategy) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const Environment = require("../models/environment");
    const env = await Environment.findById(environmentId);
    if (!env) return res.status(404).json({ message: "Environment not found" });

    const baseKeys = await Key.find({
      projectId,
      environment: environmentId,
      $or: [{ keyType: null }, { isOverride: false }],
    });

    const existingOverrides = await Key.find({
      projectId,
      environment: environmentId,
      keyType: moduleName,
      isOverride: true,
    });

    if (strategy === "replace") {
      await Key.deleteMany({
        projectId,
        environment: environmentId,
        keyType: moduleName,
        isOverride: true,
      });

      const newOverrides = baseKeys.map((bk) => ({
        name: bk.name,
        key: bk.key, // Already encrypted if it comes from baseKey in DB, but wait...
        // Actually, bk.key from `Key.find` is encrypted. Syncing it as is works.
        keyType: moduleName,
        environment: environmentId,
        projectId,
        isOverride: true,
        overrideFor: bk._id,
        createdBy: req.user ? req.user.name : "System",
      }));
      await Key.insertMany(newOverrides);
    } else if (strategy === "merge" || strategy === "safe") {
      for (const bk of baseKeys) {
        const existing = existingOverrides.find(
          (o) =>
            o.overrideFor?.toString() === bk._id.toString() ||
            o.name === bk.name,
        );

        if (existing) {
          if (strategy === "merge" && existing.key !== bk.key) {
            existing.key = bk.key;
            await existing.save();
          }
        } else {
          await Key.create({
            name: bk.name,
            key: bk.key, // bk.key is already encrypted in DB
            keyType: moduleName,
            environment: environmentId,
            projectId,
            isOverride: true,
            overrideFor: bk._id,
            createdBy: req.user ? req.user.name : "System",
          });
        }
      }
    }

    // Audit Log
    await AuditLog.create({
      action: "SYNC",
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : "System",
      projectId,
      details: `Bulk synced module ${moduleName} using ${strategy} strategy.`,
    });

    const metaIndex = env.syncMetadata.findIndex(
      (m) => m.moduleName === moduleName,
    );
    if (metaIndex !== -1) {
      env.syncMetadata[metaIndex].lastSyncedAt = new Date();
    } else {
      env.syncMetadata.push({ moduleName, lastSyncedAt: new Date() });
    }
    await env.save();

    res.json({
      message: `Successfully synced ${moduleName} using ${strategy} strategy.`,
    });
  } catch (error) {
    console.error("Error in bulkSyncKeys:", error);
    res.status(500).json({ message: "Server error during sync" });
  }
};

exports.bulkUpsertKeys = async (req, res) => {
  try {
    const { keys } = req.body;
    const projectId = req.body.projectId || (req.project && req.project._id);

    if (!projectId) {
      return res.status(400).json({ message: "ProjectId is required" });
    }

    if (!Array.isArray(keys)) {
      return res.status(400).json({ message: "Keys array is required" });
    }

    if (keys.length === 0) {
      return res.json({ message: "No keys to upsert", keys: [] });
    }

    const results = [];
    for (const keyData of keys) {
      const { name, key, keyType, environment, isOverride, overrideFor } =
        keyData;

      // Validate required fields
      if (!name || key === undefined || key === null || !environment) {
        console.warn("Skipping invalid key:", { name, environment });
        continue;
      }

      try {
        let existingKey;
        if (isOverride && overrideFor) {
          existingKey = await Key.findOne({
            projectId,
            environment,
            isOverride: true,
            overrideFor,
          });
        } else {
          existingKey = await Key.findOne({
            projectId,
            environment,
            name,
            keyType: keyType || null,
            isOverride: !!isOverride,
          });
        }

        if (existingKey) {
          existingKey.key = encrypt(key);
          await existingKey.save();
          const obj = existingKey.toObject();
          obj.key = decrypt(obj.key);
          results.push(obj);
        } else {
          const newKey = await Key.create({
            name,
            key: encrypt(key),
            keyType: keyType || null,
            environment,
            projectId,
            isOverride: !!isOverride,
            overrideFor: overrideFor || null,
            createdBy: req.user ? req.user.name : "System",
          });
          const obj = newKey.toObject();
          obj.key = decrypt(obj.key);
          results.push(obj);
        }
      } catch (keyError) {
        console.error(`Error processing key ${name}:`, keyError.message);
        continue;
      }
    }

    // Audit Log
    if (results.length > 0) {
      await AuditLog.create({
        action: "BULK_UPSERT",
        performedBy: req.user ? req.user.id : null,
        performedByName: req.user ? req.user.name : "System",
        projectId,
        details: `Bulk upserted ${results.length} keys.`,
      });
    }

    res.json({
      message: `Successfully upserted ${results.length} keys`,
      keys: results,
    });
  } catch (error) {
    console.error("Error in bulkUpsertKeys:", error);
    const errorMessage =
      error && error.message
        ? error.message
        : "Server error during bulk upsert";
    res.status(500).json({
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
