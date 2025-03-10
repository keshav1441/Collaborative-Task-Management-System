import React, { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

const Dashboard = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/tasks/assigned'),
        ])
        setProjects(projectsRes.data)
        setTasks(tasksRes.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
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

  const getProjectProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0
    const completed = project.tasks.filter((task) => task.status === 'Completed').length
    return (completed / project.tasks.length) * 100
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.name}!
        </Typography>
        <Button
          component={RouterLink}
          to="/projects/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Active Projects
          </Typography>
          <Grid container spacing={2}>
            {projects.slice(0, 3).map((project) => (
              <Grid item xs={12} md={4} key={project._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {project.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {project.description}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProjectProgress(project)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.875rem' } }}>
                        {project.members?.map((member) => (
                          <Tooltip key={member._id} title={member.name}>
                            <Avatar alt={member.name}>{member.name.charAt(0)}</Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                      <IconButton
                        component={RouterLink}
                        to={`/projects/${project._id}`}
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
                  </CardContent>
                </Card>
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