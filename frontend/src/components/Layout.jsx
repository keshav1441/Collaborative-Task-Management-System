import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as ProjectIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

const Layout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Projects", icon: <ProjectIcon />, path: "/projects" },
    { text: "Profile", icon: <ProfileIcon />, path: "/profile" },
  ];

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#ffffff',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,252,255,1) 100%)'
    }}>
      <Toolbar sx={{ 
        px: 2,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            py: 1
          }}
        >
          <ProjectIcon sx={{ mr: 1.5, fontSize: 28 }} />
          Task Master
        </Typography>
      </Toolbar>
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = window.location.pathname === item.path;
          return (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor: isActive ? 'rgba(58, 123, 213, 0.08)' : 'transparent',
                color: isActive ? 'primary.main' : 'text.primary',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(58, 123, 213, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                },
                py: 1.2,
                px: 1.5
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: isActive ? 'primary.main' : 'text.secondary' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.95rem'  
                }}
              />
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(244, 67, 54, 0.08)',
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(244, 67, 54, 0.12)',
            },
            py: 1.2,
            px: 1.5
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ 
              fontWeight: 600,
              fontSize: '0.95rem'  
            }}
          />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {menuItems.find((item) => item.path === window.location.pathname)
              ?.text || "Task Manager"}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: "64px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 