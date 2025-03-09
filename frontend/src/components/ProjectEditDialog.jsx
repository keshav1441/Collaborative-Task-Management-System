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
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axiosInstance from '../config/axios';

const ProjectEditDialog = ({ open, onClose, project, onProjectUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isNewProject = !project;

  useEffect(() => {
    if (open) {
      if (project) {
        // Edit existing project
        console.log('Loading project data for editing:', project);
        console.log('Project end date:', project.endDate);
        
        setFormData({
          name: project.name || '',
          description: project.description || '',
          status: project.status || 'Active',
          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        });
      } else {
        // Create new project
        setFormData({
          name: '',
          description: '',
          status: 'Active',
          endDate: '', // Initialize as empty string
        });
      }
      setError('');
      setSuccess(false);
    }
  }, [project, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value });
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

    // Validate the endDate
    if (!formData.endDate) {
      setError('End date is required');
      setLoading(false);
      return;
    }

    try {
      // Format the end date properly
      const formDataToSubmit = {
        ...formData,
        endDate: formData.endDate ? new Date(formData.endDate + 'T00:00:00.000Z').toISOString() : null
      };
      
      console.log('Submitting project data:', formDataToSubmit);
      
      let response;
      
      if (isNewProject) {
        response = await axiosInstance.post('/projects', formDataToSubmit);
        console.log('Created new project:', response.data);
      } else {
        response = await axiosInstance.patch(`/projects/${project._id}`, formDataToSubmit);
        console.log('Updated project:', response.data);
      }
      
      setSuccess(true);
      onProjectUpdated(response.data);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(`Error ${isNewProject ? 'creating' : 'updating'} project:`, err);
      const errorMessage = err.response?.data?.message || 
                          `Failed to ${isNewProject ? 'create' : 'update'} project. ${err.message}`;
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
        bgcolor: isNewProject ? 'success.main' : 'primary.main',
        color: 'white',
        py: 1.5
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          {isNewProject ? <AddIcon sx={{ mr: 1 }} /> : <EditIcon sx={{ mr: 1 }} />}
          {isNewProject ? 'Create New Project' : 'Edit Project'}
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
              Project {isNewProject ? 'created' : 'updated'} successfully!
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
              Project Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Project Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
              error={!formData.name}
              helperText={!formData.name ? 'Project name is required' : ''}
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
              placeholder="Enter project description..."
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              Project Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Status"
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="endDate"
              label="End Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleInputChange}
              error={!formData.endDate}
              helperText={!formData.endDate ? 'End date is required' : ''}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 },
                startAdornment: (
                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
            />
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
            color={isNewProject ? 'success' : 'primary'}
            disabled={loading || !formData.name}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 1 }}
          >
            {loading ? 'Saving...' : isNewProject ? 'Create Project' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectEditDialog; 