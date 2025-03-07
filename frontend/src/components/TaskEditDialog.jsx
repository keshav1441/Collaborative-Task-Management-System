import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import axios from 'axios';

const TaskEditDialog = ({ open, onClose, task, projectId, onTaskUpdated }) => {
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
  const isNewTask = !task;

  // Fetch project members when the dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectMembers();
    }
  }, [open, projectId]);

  const fetchProjectMembers = async () => {
    try {
      setLoadingMembers(true);
      console.log('Fetching project details for ID:', projectId);
      
      // Get all available users first as a fallback
      const usersResponse = await axios.get('/api/users/available');
      console.log('Available users:', usersResponse.data);
      
      // Then get project members
      const projectResponse = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data:', projectResponse.data);
      
      let allMembers = [];
      
      // First try to get members from project
      if (projectResponse.data && projectResponse.data.members) {
        // Add owner if available
        if (projectResponse.data.owner && projectResponse.data.owner._id) {
          allMembers.push({
            _id: projectResponse.data.owner._id,
            name: projectResponse.data.owner.name || 'Project Owner',
            email: projectResponse.data.owner.email || '',
            role: 'Manager'
          });
        }
        
        // Add members
        if (Array.isArray(projectResponse.data.members)) {
          projectResponse.data.members.forEach(member => {
            if (member.user && member.user._id) {
              allMembers.push({
                _id: member.user._id,
                name: member.user.name || 'Team Member',
                email: member.user.email || '',
                role: member.role || 'Member'
              });
            }
          });
        }
      }
      
      // If no project members found, use all available users
      if (allMembers.length === 0 && usersResponse.data && Array.isArray(usersResponse.data)) {
        allMembers = usersResponse.data.map(user => ({
          _id: user._id,
          name: user.name || user.email || 'User',
          email: user.email || '',
          role: 'Member'
        }));
      }
      
      // Show all project members as potential assignees
      console.log('Final processed members list:', allMembers);
      setProjectMembers(allMembers);
    } catch (err) {
      console.error('Error fetching project members:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (task) {
        // Edit existing task
        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignee: task.assignee?._id || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          priority: task.priority || 'Medium',
          status: task.status || 'To-Do',
        });
      } else {
        // Create new task
        setFormData({
          title: '',
          description: '',
          assignee: '',
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'Medium',
          status: 'To-Do',
        });
      }
      setError('');
      setSuccess(false);
    }
  }, [task, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let response;
      
      if (isNewTask) {
        // Create new task
        const taskData = {
          ...formData,
          projectId: projectId,
        };
        
        console.log('Creating new task with data:', taskData);
        
        response = await axios.post('/api/tasks', taskData);
        setSuccess(true);
        onTaskUpdated(response.data);
      } else {
        // Update existing task - use the same approach as creating
        const taskData = {
          ...formData,
          projectId: projectId,
        };
        
        console.log('Updating task with ID:', task._id, 'Data:', taskData);
        
        response = await axios.patch(`/api/tasks/${task._id}`, taskData);
        setSuccess(true);
        onTaskUpdated(response.data);
      }
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(`Error ${isNewTask ? 'creating' : 'updating'} task:`, err);
      const errorMessage = err.response?.data?.message || 
                          `Failed to ${isNewTask ? 'create' : 'update'} task. ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        bgcolor: isNewTask ? 'success.main' : 'primary.main',
        color: 'white',
        py: 1.5
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          {isNewTask ? <AddIcon sx={{ mr: 1 }} /> : null}
          {isNewTask ? 'Create New Task' : 'Edit Task'}
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
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
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
              Task Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              required
              value={formData.title}
              onChange={handleInputChange}
              error={!formData.title}
              helperText={!formData.title ? 'Title is required' : ''}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="Enter task description..."
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Assignee</InputLabel>
              <Select
                name="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                label="Assignee"
                required
                sx={{ borderRadius: 2 }}
                MenuProps={{
                  PaperProps: {
                    sx: { borderRadius: 2, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
                  }
                }}
                renderValue={(selected) => {
                  const member = projectMembers.find(m => m._id === selected);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          mr: 1.5, 
                          bgcolor: 'primary.main', 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {member?.name?.charAt(0) || <PersonIcon fontSize="small" />}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{member?.name || 'Select Assignee'}</Typography>
                    </Box>
                  );
                }}
              >
                {loadingMembers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1.5 }} />
                    <Typography>Loading members...</Typography>
                  </MenuItem>
                ) : projectMembers.length === 0 ? (
                  <MenuItem disabled>
                    <Typography color="error">
                      No members found. Please check project settings.
                    </Typography>
                  </MenuItem>
                ) : (
                  projectMembers.map(member => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            mr: 1.5, 
                            bgcolor: 'primary.main', 
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500 }}>{member.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="dueDate"
              label="Due Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 },
                startAdornment: (
                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FlagIcon fontSize="small" sx={{ mr: 1 }} />
              Status & Priority
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label="Priority"
                  sx={{ borderRadius: 1 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 1, mt: 0.5 }
                    }
                  }}
                >
                  <MenuItem value="Low">
                    <Chip 
                      size="small" 
                      label="Low" 
                      color="success" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="Medium">
                    <Chip 
                      size="small" 
                      label="Medium" 
                      color="warning" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="High">
                    <Chip 
                      size="small" 
                      label="High" 
                      color="error" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                  sx={{ borderRadius: 1 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 1, mt: 0.5 }
                    }
                  }}
                >
                  <MenuItem value="To-Do">
                    <Chip 
                      size="small" 
                      label="To-Do" 
                      color="default" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Chip 
                      size="small" 
                      label="In Progress" 
                      color="primary" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Chip 
                      size="small" 
                      label="Completed" 
                      color="success" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color={isNewTask ? 'success' : 'primary'}
            disabled={loading || !formData.title}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 1 }}
          >
            {loading ? 'Saving...' : isNewTask ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskEditDialog; 