const Task = require("../models/Task");
const Project = require("../models/Project");
const fs = require("fs");
const path = require("path");

// Create new task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assigneeId,
      dueDate,
      priority,
      estimatedHours,
    } = req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignee: assigneeId,
      reporter: req.user._id,
      dueDate,
      priority,
      estimatedHours,
    });

    await task.save();

    // Add task to project's tasks array
    project.tasks.push(task._id);
    await project.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member of the project
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only return tasks assigned to the current user or created by them
    const tasks = await Task.find({
      project: req.params.projectId,
      $or: [
        { assignee: req.user._id },
        { reporter: req.user._id }
      ]
    })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get tasks assigned to user
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate("project", "name")
      .populate("reporter", "name email")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("project", "name")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("comments.author", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is assigned to the task or is the reporter
    if (task.assignee._id.toString() !== req.user._id.toString() && 
        task.reporter._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only view tasks assigned to you or created by you." });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    console.log("Update task request:", {
      taskId: req.params.taskId,
      updates: req.body,
      user: req.user._id,
    });

    const task = await Task.findById(req.params.taskId)
      .populate({
        path: 'project',
        populate: {
          path: 'members.user',
          select: 'name email'
        }
      });
      
    if (!task) {
      console.log("Task not found:", req.params.taskId);
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is a project manager
    const isProjectManager = task.project.members.some(member => 
      member.user._id.toString() === req.user._id.toString() && 
      (member.role === 'Manager' || task.project.owner.toString() === req.user._id.toString())
    );

    console.log('Permission check:', {
      userId: req.user._id,
      isProjectManager,
      projectMembers: task.project.members.map(m => ({
        userId: m.user._id,
        role: m.role
      }))
    });

    // Check permissions
    const isAssignee = task.assignee?.toString() === req.user._id.toString();
    const isReporter = task.reporter?.toString() === req.user._id.toString();

    if (!isProjectManager && !isAssignee && !isReporter) {
      console.log("Access denied for user:", req.user._id);
      return res.status(403).json({ 
        message: "Access denied. Only project managers, task assignees, or task creators can update tasks." 
      });
    }

    // If not a project manager, restrict what can be updated
    if (!isProjectManager) {
      // Non-managers can only update status, actualHours, and description
      const allowedUpdatesForNonManager = ["status", "actualHours", "description"];
      const attemptedUpdates = Object.keys(req.body);
      const unauthorizedUpdates = attemptedUpdates.filter(
        update => !allowedUpdatesForNonManager.includes(update)
      );

      if (unauthorizedUpdates.length > 0) {
        return res.status(403).json({
          message: "You don't have permission to update these fields",
          unauthorizedFields: unauthorizedUpdates,
          allowedFields: allowedUpdatesForNonManager
        });
      }
    }

    // Handle status update
    if (req.body.status !== undefined) {
      if (!["To-Do", "In Progress", "Review", "Done"].includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid status value",
          allowedValues: ["To-Do", "In Progress", "Review", "Done"],
        });
      }
      task.status = req.body.status;
    }

    // Handle other updates
    const allowedUpdates = [
      "title",
      "description",
      "priority",
      "dueDate",
      "assignee",
      "estimatedHours",
      "actualHours",
    ];

    Object.keys(req.body).forEach((field) => {
      if (allowedUpdates.includes(field)) {
        // Special handling for assignee field
        if (field === 'assignee') {
          // If assignee is null or empty string, allow it (unassign)
          if (!req.body.assignee) {
            task.assignee = null;
          } else {
            // Verify the new assignee is a project member
            const isValidAssignee = task.project.members.some(
              member => member.user._id.toString() === req.body.assignee
            );
            if (!isValidAssignee) {
              throw new Error('Invalid assignee: must be a project member');
            }
            task.assignee = req.body.assignee;
          }
        } else {
          task[field] = req.body[field];
        }
      }
    });

    await task.save();
    console.log("Task updated successfully:", task._id);

    // Return populated task
    const updatedTask = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("project", "name");

    res.json(updatedTask);
  } catch (error) {
    console.error("Error in updateTask:", error);
    res.status(400).json({ message: error.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    task.comments.push({
      content,
      author: req.user._id,
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add attachment to task
exports.addAttachment = async (req, res) => {
  try {
    // Log the request details
    console.log("File upload request received:", {
      taskId: req.params.taskId,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : "No file",
      userId: req.user._id,
    });

    // Validate request
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find and validate task
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      // Clean up uploaded file if task not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(404).json({ message: "Task not found" });
    }

    // Check project access
    const project = await Project.findById(task.project);
    if (!project) {
      // Clean up uploaded file if project not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      // Clean up uploaded file if access denied
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(403).json({ message: "Access denied" });
    }

    // Create attachment object
    const attachment = {
      filename: req.file.originalname,
      path: path.basename(req.file.path), // Only store the filename
      url: path.basename(req.file.path), // Store just the filename without any slashes
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    // Add attachment to task
    task.attachments.push(attachment);
    await task.save();

    console.log("Attachment saved successfully:", {
      taskId: task._id,
      filename: attachment.filename,
      path: attachment.path,
      url: attachment.url,
    });

    // Return updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("attachments.uploadedBy", "name email");

    res.json(updatedTask);
  } catch (error) {
    console.error("Error in addAttachment:", error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the task reporter (creator) can delete the task
    if (task.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Only the task creator can delete it." });
    }

    // Remove task from project's tasks array
    const project = await Project.findById(task.project);
    if (project) {
      project.tasks = project.tasks.filter(
        (taskId) => taskId.toString() !== task._id.toString()
      );
      await project.save();
    }

    // Delete the task using deleteOne
    await Task.deleteOne({ _id: task._id });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only include tasks assigned to current user or reported by them
    const tasks = await Task.find({ 
      project: req.params.projectId,
      $or: [
        { assignee: req.user._id },
        { reporter: req.user._id }
      ]
    });

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === "Completed")
        .length,
      inProgressTasks: tasks.filter((task) => task.status === "In Progress")
        .length,
      todoTasks: tasks.filter((task) => task.status === "To-Do").length,
      highPriorityTasks: tasks.filter((task) => task.priority === "High")
        .length,
      mediumPriorityTasks: tasks.filter((task) => task.priority === "Medium")
        .length,
      lowPriorityTasks: tasks.filter((task) => task.priority === "Low").length,
      overdueTasks: tasks.filter((task) => task.isOverdue()).length,
      totalEstimatedHours: tasks.reduce(
        (sum, task) => sum + (task.estimatedHours || 0),
        0
      ),
      totalActualHours: tasks.reduce(
        (sum, task) => sum + (task.actualHours || 0),
        0
      ),
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
