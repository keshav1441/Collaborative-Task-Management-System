import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const TaskEditDialog = ({ open, onClose, task, projectId, onTaskUpdated, isProjectManager }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium',
    status: 'To-Do',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const isNewTask = !task;

  // Check if the current user can edit this task
  const canEditTask = useCallback(() => {
    console.log('Checking edit permissions:', {
      isNewTask,
      isProjectOwner,
      isProjectManager,
      taskAssignee: task?.assignee?._id,
      userId: user?._id,
      taskReporter: task?.reporter?._id
    });

    if (isNewTask) return true; // Anyone can create a new task
    if (isProjectManager) return true; // Managers can edit any task
    if (isProjectOwner) return true; // Owners can edit any task
    
    // Users can edit tasks they're assigned to or reported
    return task?.assignee?._id === user?._id || task?.reporter?._id === user?._id;
  }, [isNewTask, isProjectOwner, isProjectManager, task, user?._id]);

  const fetchProjectMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      console.log('Starting to fetch project members for project:', projectId);
      
      if (!projectId) {
        console.error('No projectId provided for fetching members');
        setProjectMembers([]);
        return;
      }
      
      const response = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data received:', response.data);
      
      if (!response.data) {
        console.error('No project data received');
        setProjectMembers([]);
        return;
      }

      // Set project owner state
      setIsProjectOwner(response.data.owner === user?._id);
      
      // Create a members array with only team members
      let members = [];
      
      // Add team members if available
      if (response.data.members && Array.isArray(response.data.members)) {
        members = response.data.members.map(member => {
          const userData = member.user || member;
          return {
            user: {
              _id: userData._id,
              name: userData.name || userData.email,
              email: userData.email
            },
            role: member.role || 'Member'
          };
        });
      }
      
      // Remove duplicates
      members = members.filter((member, index, self) =>
        index === self.findIndex((m) => m.user._id === member.user._id)
      );
      
      console.log('Final members to display:', members);
      setProjectMembers(members);

    } catch (err) {
      console.error('Error fetching project members:', err);
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, user?._id]);

  // Fetch project members when the dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectMembers();
      
      // Add retry mechanism
      const retryTimeout = setTimeout(() => {
        if (projectMembers.length === 0) {
          console.log('No members found, retrying fetch...');
          fetchProjectMembers();
        }
      }, 1000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [open, projectId, fetchProjectMembers, projectMembers.length]);

  useEffect(() => {
    if (open) {
      if (task) {
        // Edit existing task
        console.log('Setting form data for existing task:', task);
        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignee: task.assignee?._id || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          priority: task.priority || 'Medium',
          status: ['To-Do', 'In Progress', 'Completed'].includes(task.status) ? task.status : 'To-Do',
        });
      } else {
        // Create new task
        console.log('Setting form data for new task');
        setFormData({
          title: '',
          description: '',
          assignee: user?._id || '', // Default to current user
          dueDate: new Date().toISOString().split('T')[0], // Only set default date for new tasks
          priority: 'Medium',
          status: 'To-Do',
        });
      }
      setError('');
      setSuccess(false);
    }
  }, [task, open, user?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value, isProjectManager });
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEditTask()) {
      setError('Permission denied: You can only edit your own tasks');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let response;
      
      // Prepare the task data - ensure all fields are in the correct format
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignee: formData.assignee || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        priority: formData.priority || 'Medium',
        status: ['To-Do', 'In Progress', 'Completed'].includes(formData.status) ? formData.status : 'To-Do',
        projectId: projectId
      };

      // Remove any undefined or null values except assignee which can be null
      const cleanTaskData = Object.entries(taskData).reduce((acc, [key, value]) => {
        if (key === 'assignee' || (value !== null && value !== undefined)) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('Submitting task with data:', {
        taskData: cleanTaskData,
        isNewTask,
        taskId: task?._id,
        permissions: {
          isProjectManager,
          isProjectOwner,
          canEdit: canEditTask()
        }
      });
      
      if (isNewTask) {
        response = await axios.post('/api/tasks', cleanTaskData);
        console.log('Created new task:', response.data);
      } else {
        response = await axios.patch(`/api/tasks/${task._id}`, cleanTaskData);
        console.log('Updated task:', response.data);
      }
      
      setSuccess(true);
      onTaskUpdated(response.data);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Task operation failed:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        data: err.response?.data
      });
      
      const errorMessage = err.response?.data?.message || 
                          `Failed to ${isNewTask ? 'create' : 'update'} task. ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If the user doesn't have permission to edit this task, show a message
  if (!isNewTask && !canEditTask() && open) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'error.main',
          color: 'white',
          py: 1.5
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Permission Denied
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            You don't have permission to edit this task.
          </Alert>
          <Typography variant="body1" paragraph>
            You can only edit tasks that:
          </Typography>
          <ul>
            <li>Are assigned to you</li>
            <li>Were created by you</li>
            <li>Are in a project where you are the owner or a manager</li>
          </ul>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isNewTask ? 'Create New Task' : 'Edit Task'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Task {isNewTask ? 'created' : 'updated'} successfully!
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Assignee</InputLabel>
            <Select
              name="assignee"
              value={formData.assignee}
              onChange={handleInputChange}
              label="Assignee"
              disabled={loadingMembers}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {projectMembers.map((member) => (
                <MenuItem 
                  key={member.user._id} 
                  value={member.user._id}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: member.role === 'Manager' ? 'primary.dark' : 'primary.main' 
                    }}>
                      {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography>{member.user.name || member.user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              label="Priority"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              label="Status"
            >
              <MenuItem value="To-Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !canEditTask()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskEditDialog; 