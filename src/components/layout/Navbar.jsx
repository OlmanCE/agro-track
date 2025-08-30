// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados para menús
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      setMobileDrawerOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
    setMobileDrawerOpen(false);
  };

  const isCurrentPath = (path) => location.pathname === path;

  // Rutas de navegación principal
  const navigationItems = [
    {
      label: 'Inicio',
      path: '/',
      icon: <HomeIcon />,
      show: true
    },
    {
      label: 'Viveros',
      path: '/viveros',
      icon: <AgricultureIcon />,
      show: true
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      show: true,
      disabled: true, // Próximamente
      tooltip: 'Próximamente'
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: <AdminIcon />,
      show: isAdmin
    }
  ];

  // ============================================================================
  // 📱 DRAWER MÓVIL
  // ============================================================================

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box'
        }
      }}
    >
      {/* Header del drawer */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <AgricultureIcon sx={{ fontSize: 24, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Agro-Track
          </Typography>
          <Chip 
            label="v2.0" 
            size="small" 
            sx={{ 
              ml: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.7rem'
            }} 
          />
        </Box>
        
        {/* Info del usuario */}
        <Box display="flex" alignItems="center">
          <Avatar 
            sx={{ width: 32, height: 32, mr: 2, bgcolor: 'secondary.main' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.name || 'Usuario'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {isAdmin ? 'Administrador' : 'Usuario'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navegación */}
      <List sx={{ pt: 1 }}>
        {navigationItems
          .filter(item => item.show)
          .map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                disabled={item.disabled}
                sx={{
                  backgroundColor: isCurrentPath(item.path) 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.05)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: isCurrentPath(item.path) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{ 
                    '& .MuiListItemText-primary': {
                      fontWeight: isCurrentPath(item.path) ? 600 : 400,
                      color: isCurrentPath(item.path) ? 'primary.main' : 'inherit'
                    }
                  }}
                />
                {item.disabled && (
                  <Chip 
                    label="Próximo" 
                    size="small" 
                    color="default"
                    sx={{ fontSize: '0.6rem' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))
        }
      </List>

      <Divider />

      {/* Cerrar sesión */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  // ============================================================================
  // 💻 NAVBAR DESKTOP
  // ============================================================================

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {/* Menú móvil */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo y título */}
          <Box 
            display="flex" 
            alignItems="center" 
            flexGrow={1}
            sx={{ cursor: 'pointer' }}
            onClick={() => handleNavigation('/')}
          >
            <AgricultureIcon sx={{ fontSize: 30, mr: 1 }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ fontWeight: 'bold' }}
            >
              Agro-Track
            </Typography>
            
            {/* Indicador de versión */}
            <Chip 
              label="v2.0" 
              size="small" 
              sx={{ 
                ml: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
          </Box>

          {/* Navegación desktop */}
          {!isMobile && (
            <Box display="flex" alignItems="center" gap={1}>
              {navigationItems
                .filter(item => item.show)
                .map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => handleNavigation(item.path)}
                    disabled={item.disabled}
                    sx={{
                      backgroundColor: isCurrentPath(item.path) 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      },
                      position: 'relative'
                    }}
                  >
                    {item.label}
                    {item.disabled && (
                      <Chip 
                        label="Próximo" 
                        size="small" 
                        sx={{ 
                          ml: 1,
                          fontSize: '0.6rem',
                          height: '16px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }}
                      />
                    )}
                  </Button>
                ))
              }
            </Box>
          )}

          {/* Menú de usuario desktop */}
          {!isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ ml: 2 }}
            >
              <Avatar 
                sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          )}

          {/* Menú desplegable de usuario (desktop) */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { minWidth: 250 }
            }}
          >
            {/* Información del usuario */}
            <Box px={2} py={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar 
                  sx={{ width: 40, height: 40, mr: 2, bgcolor: 'secondary.main' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.name || 'Usuario'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              
              {/* Chip de rol */}
              <Box display="flex" justifyContent="center">
                <Chip
                  label={isAdmin ? 'Administrador' : 'Usuario Estándar'}
                  color={isAdmin ? 'secondary' : 'default'}
                  size="small"
                  icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
                />
              </Box>
            </Box>

            <Divider />

            {/* Navegación rápida */}
            <MenuItem 
              onClick={() => handleNavigation('/')}
              disabled={isCurrentPath('/')}
            >
              <HomeIcon sx={{ mr: 2 }} />
              Inicio
            </MenuItem>

            <MenuItem 
              onClick={() => handleNavigation('/viveros')}
              disabled={isCurrentPath('/viveros')}
            >
              <AgricultureIcon sx={{ mr: 2 }} />
              Viveros
            </MenuItem>

            {isAdmin && (
              <MenuItem 
                onClick={() => handleNavigation('/admin')}
                disabled={isCurrentPath('/admin')}
              >
                <AdminIcon sx={{ mr: 2 }} />
                Panel de Admin
              </MenuItem>
            )}

            <Divider />

            {/* Cerrar sesión */}
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer móvil */}
      <MobileDrawer />
    </>
  );
};

export default Navbar;