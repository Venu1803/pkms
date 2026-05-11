const Project = require("../models/projects");
const Environment = require("../models/environment");
const KeyType = require("../models/keyType");
const Key = require("../models/keys");
const { validateString } = require("../utils/validation");

exports.addProject = async (req, res) => {
  try {
    const { name, description, status, members } = req.body;

    // Validate required fields
    const nameValidation = validateString(name, "Project name", 2);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    if (description && description.trim().length > 500) {
      return res
        .status(400)
        .json({ message: "Description cannot exceed 500 characters" });
    }

    const validStatuses = ["active", "inactive", "archived"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Ensure members have proper defaults: no assigned modules/keys means no access
    let cleanMembers = [];
    if (members && Array.isArray(members)) {
      cleanMembers = members.map((member) => ({
        ...member,
        permissions: member.permissions || ["viewKeys"],
        assignedModules: member.assignedModules || [],
        assignedEnvironments: member.assignedEnvironments || [],
      }));
    }

    const newProject = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      status: status || "active",
      members: cleanMembers,
      createdBy: req.user.id,
    });

    const defaultEnvironments = ["Development", "Staging", "UAT", "Production"];
    await Promise.all(
      defaultEnvironments.map((envName) =>
        Environment.create({
          name: envName,
          projectId: newProject._id,
        }),
      ),
    );

    const defaultModules = [
      "Database",
      "Auth Service",
      "S3 Storage",
      "Payment Gateway",
      "Email Service",
    ];
    await Promise.all(
      defaultModules.map(async (modName) => {
        const slug = modName.toLowerCase().replace(/\s+/g, "-");
        try {
          await KeyType.updateOne(
            { slug },
            { $setOnInsert: { name: modName, slug } },
            { upsert: true },
          );
        } catch (err) {
          console.error(`Error creating default module ${modName}:`, err);
        }
      }),
    );

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProjects = async (req, res) => {
  try {
    let query = {};
    if (!["superadmin", "admin", "devops"].includes(req.user.role)) {
      query = {
        $or: [{ createdBy: req.user.id }, { "members.user": req.user.id }],
      };
    }

    const projects = await Project.find(query)
      .populate("members.user", "name email role")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, members } = req.body;

    // Ensure members have proper defaults: no assigned modules/keys means no access
    let cleanMembers = members;
    if (members && Array.isArray(members)) {
      cleanMembers = members.map((member) => ({
        ...member,
        permissions: member.permissions || ["viewKeys"],
        assignedModules: member.assignedModules || [],
        assignedEnvironments: member.assignedEnvironments || [],
      }));
    }

    // Project is already verified and attached by middleware
    const updatedProject = await Project.findByIdAndUpdate(
      req.project._id,
      {
        name,
        description,
        status,
        members: cleanMembers,
        updatedAt: Date.now(),
      },
      { new: true },
    ).populate("members.user", "name email role");

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProject = async (req, res) => {
  try {
    // Project is already verified and attached by middleware
    const project = await Project.findById(req.project._id).populate(
      "members.user",
      "name email role",
    );
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingKey = await Key.findOne({ projectId: id });
    if (existingKey) {
      return res.status(400).json({
        message:
          "Cannot delete project that contains keys. Please delete all keys first.",
      });
    }

    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userId,
      userIds,
      role,
      permissions,
      assignedModules,
      assignedEnvironments,
    } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const usersToAssign =
      userIds || (Array.isArray(userId) ? userId : [userId]);

    // Default permissions for members
    const defaultPermissions = ["viewProjects", "viewKeys"];
    const memberPermissions =
      permissions && permissions.length > 0 ? permissions : defaultPermissions;

    for (const uid of usersToAssign) {
      if (!uid) continue;
      const memberIndex = project.members.findIndex(
        (m) => m.user && m.user.toString() === uid.toString(),
      );

      if (memberIndex !== -1) {
        project.members[memberIndex].role = role;
        project.members[memberIndex].permissions = memberPermissions;
        project.members[memberIndex].assignedModules = assignedModules || [];
        project.members[memberIndex].assignedEnvironments =
          assignedEnvironments || [];
      } else {
        project.members.push({
          user: uid,
          role,
          permissions: memberPermissions,
          assignedModules: assignedModules || [],
          assignedEnvironments: assignedEnvironments || [],
        });
      }
    }

    await project.save();
    const updatedProject = await Project.findById(id).populate(
      "members.user",
      "name email role",
    );
    res.json(updatedProject);
  } catch (error) {
    console.error("Error assigning member:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error during member assignment",
      error: error.message,
    });
  }
};

exports.updateMemberModules = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { assignedModules } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const memberIndex = project.members.findIndex(
      (m) => m.user.toString() === userId,
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in project" });
    }

    project.members[memberIndex].assignedModules = assignedModules || [];
    await project.save();

    const updatedProject = await Project.findById(id).populate(
      "members.user",
      "name email role",
    );
    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating member modules:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== userId,
    );

    await project.save();

    const updatedProject = await Project.findById(id).populate(
      "members.user",
      "name email role",
    );

    res.json(updatedProject);
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Server error" });
  }
};
