import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CircularProgress, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchProjects } from './ProjectList';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    activeProjects: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New Project Dialog State
  const [openNewProjectDialog, setOpenNewProjectDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch assigned tasks
  const fetchTasks = useCallback(async () => {
    try {
      // Get tasks assigned to the current user
      const response = await axios.get('/api/tasks/user');
      setTasks(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
      return [];
    }
  }, []);

  // Calculate dashboard statistics
const calculateStats = (tasks, projects) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length; // Update to count pending tasks directly
    const activeProjects = projects.length;

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeProjects
    };
};



  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setRefreshing(true);
  };

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!refreshing) setLoading(true);
      try {
        // Fetch tasks
        const tasksData = await fetchTasks();
        
        // Fetch projects using the imported function
        await fetchProjects(setProjects, setError, () => {});
        
        // Calculate stats from the fetched data
        const calculatedStats = calculateStats(tasksData, projects);
        setStats(calculatedStats);       
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadDashboardData();

    // Set up an interval to refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchTasks, refreshTrigger, refreshing, projects]);

  // Update stats whenever tasks or projects change
  useEffect(() => {
const updatedStats = calculateStats(tasks, projects); // Ensure stats are updated after task status change

    setStats(updatedStats);
  }, [tasks, projects]);

  // Handle new project dialog open
  const handleOpenNewProjectDialog = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
    });
    setOpenNewProjectDialog(true);
  };

  // Handle new project dialog close
  const handleCloseNewProjectDialog = () => {
    setOpenNewProjectDialog(false);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
    });
  };

  // Handle new project input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle new project submit
  const handleSubmitNewProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/projects', formData);
      
      // Fetch updated projects
      await fetchProjects(setProjects, setError, () => {});
      
      // Show success message
      setSuccessMessage('Project created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close dialog
      handleCloseNewProjectDialog();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      // Make the API call to update the task
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
      
      // Update the local tasks state with the updated task
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      );
      
      // Update tasks state
      setTasks(updatedTasks);
      
      // Show success message
      setError(null);
      setSuccessMessage(`Task ${newStatus === 'completed' ? 'completed' : 'marked as pending'} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.warning.main;
      case 'pending':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Calculate completion percentage for a project
  const calculateCompletion = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  // if (loading && !refreshing) {
  //   return (
  //     <Box sx={{ 
  //       display: 'flex', 
  //       flexDirection: 'column',
  //       justifyContent: 'center', 
  //       alignItems: 'center', 
  //       height: '80vh' 
  //     }}>
  //       <CircularProgress size={60} thickness={4} />
  //       <Typography variant="h6" sx={{ mt: 2 }}>
  //         Loading your dashboard...
  //       </Typography>
  //     </Box>
  //   );
  // }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{ 
            borderBottom: `3px solid ${theme.palette.primary.main}`,
            paddingBottom: 1
          }}
        >
          My Dashboard
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FolderIcon />}
            onClick={handleOpenNewProjectDialog}
          >
            New Project
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            border: `1px solid ${theme.palette.error.main}`,
            borderRadius: 1
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {successMessage && (
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            border: `1px solid ${theme.palette.success.main}`,
            borderRadius: 1
          }}
        >
          <Typography color="success.main">{successMessage}</Typography>
        </Paper>
      )}

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                width: 56, 
                height: 56,
                mb: 2
              }}
            >
              <AssignmentIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {stats.totalTasks}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Total Tasks
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.success.main, 
                width: 56, 
                height: 56,
                mb: 2
              }}
            >
              <CheckCircleIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {stats.completedTasks}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Completed Tasks
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.warning.main, 
                width: 56, 
                height: 56,
                mb: 2
              }}
            >
              <ScheduleIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {stats.pendingTasks}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Pending Tasks
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.info.main, 
                width: 56, 
                height: 56,
                mb: 2
              }}
            >
              <FolderIcon />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {stats.activeProjects}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Active Projects
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%', 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                py: 2, 
                px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  My Tasks
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {tasks.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No tasks assigned to you
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {tasks.slice(0, 5).map((task, index) => (
                    <React.Fragment key={task._id || index}>
                      <ListItem                   
                        sx={{ 
                          px: 3,
                          py: 2,
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'translateX(5px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getStatusColor(task.status),
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {task.title?.charAt(0).toUpperCase() || 'T'}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {task.title}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={task.priority?.toUpperCase() || 'MEDIUM'} 
                                sx={{ 
                                  bgcolor: alpha(getPriorityColor(task.priority), 0.1),
                                  color: getPriorityColor(task.priority),
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }}
                                icon={<FlagIcon style={{ fontSize: '0.9rem' }} />}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Chip 
                                size="small" 
                                label={task.status?.replace('_', ' ').toUpperCase() || 'PENDING'} 
                                sx={{ 
                                  bgcolor: alpha(getStatusColor(task.status), 0.1),
                                  color: getStatusColor(task.status),
                                  fontWeight: 'medium',
                                  fontSize: '0.7rem'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                  handleUpdateTaskStatus(task._id, newStatus);
                                }}
                              />
                              {task.dueDate && (
                                <Typography variant="caption" color="text.secondary">
                                  Due: {formatDate(task.dueDate)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < Math.min(tasks.length, 5) - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%', 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                bgcolor: theme.palette.info.main, 
                py: 2, 
                px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  My Projects
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/projects')}
                sx={{ 
                  bgcolor: 'white', 
                  color: theme.palette.info.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.contrastText, 0.9)
                  }
                }}
              >
                View All
              </Button>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {projects.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    You don't have any projects yet
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={handleOpenNewProjectDialog}
                  >
                    Create a project
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {projects.slice(0, 3).map((project, index) => (
                    <React.Fragment key={project._id || index}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/projects/${project._id}`)}
                        sx={{ 
                          px: 3,
                          py: 2,
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            transform: 'translateX(5px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.info.main,
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {project.name?.charAt(0).toUpperCase() || 'P'}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {project.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {project.description?.substring(0, 60)}
                              {project.description?.length > 60 ? '...' : ''}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ flexGrow: 1, mr: 2 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={calculateCompletion(project)} 
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.info.main, 0.1)
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight="bold">
                                {calculateCompletion(project)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < Math.min(projects.length, 3) - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Project Dialog - Updated to match ProjectList */}
      <Dialog 
        open={openNewProjectDialog} 
        onClose={handleCloseNewProjectDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Project</DialogTitle>
        <form onSubmit={handleSubmitNewProject}>
          <DialogContent>
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
            />
            <TextField
              margin="dense"
              name="startDate"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="endDate"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNewProjectDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Refresh FAB */}
      <Tooltip title="Refresh Dashboard">
        <Fab 
          color="primary" 
          aria-label="refresh" 
          onClick={handleRefresh}
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20,
            opacity: refreshing ? 0.7 : 1
          }}
          disabled={refreshing}
        >
          <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default Dashboard;
