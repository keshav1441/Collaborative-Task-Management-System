import React, { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { fetchProjects } from './ProjectList'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/tasks/assigned'),
      ])
      console.log('Projects fetched:', projectsRes.data)
      console.log('Tasks fetched:', tasksRes.data)
      setProjects(projectsRes.data)
      setTasks(tasksRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  useEffect(() => {
    fetchProjects(setProjects, console.error, () => {})
  }, [])

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': '#F59E0B',
      'In Progress': '#3B82F6',
      Completed: '#10B981',
      Blocked: '#EF4444',
    }
    return colors[status] || colors['Not Started']
  }

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/projects', formData)
      fetchDashboardData()
      handleCloseDialog()
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.name}!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
          onClick={handleOpenDialog}
        >
          New Project
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="startDate"
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
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
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={formData.endDate}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Active Projects
          </Typography>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => console.log('Open project menu')}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {project.description}
                  </Typography>

                  <Box mt="auto" pt={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {project.tasks.length} tasks
                        </Typography>
                      </Box>
                      <Chip
                        label={project.status}
                        color={project.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    View Details
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Your Tasks
          </Typography>
          <Grid container spacing={2}>
            {tasks.slice(0, 4).map((task) => (
              <Grid item xs={12} md={6} key={task._id}>
                <Card
                  sx={{
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {task.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {task.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ml: 2,
                          bgcolor: `${getStatusColor(task.status)}20`,
                          color: getStatusColor(task.status),
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={task.project?.name || 'No project'}>
                          <AssignmentIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {task.project?.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {task.dueDate && (
                          <Tooltip title="Due date">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        <IconButton
                          component={RouterLink}
                          to={`/projects/${task.project?._id}/tasks/${task._id}`}
                          size="small"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard 