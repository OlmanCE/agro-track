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
  Chip
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo y título */}
        <Box display="flex" alignItems="center" flexGrow={1}>
          <AgricultureIcon sx={{ fontSize: 30, mr: 1 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation('/')}
          >
            Agro-Track
          </Typography>
          
          {/* Indicador de versión */}
          <Chip 
            label="v1.0" 
            size="small" 
            sx={{ 
              ml: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.7rem'
            }} 
          />
        </Box>

        {/* Navegación principal */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* Botón Home */}
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => handleNavigation('/')}
            sx={{
              backgroundColor: isCurrentPath('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Inicio
          </Button>

          {/* Botón Admin (solo para administradores) */}
          {isAdmin && (
            <Button
              color="inherit"
              startIcon={<AdminIcon />}
              onClick={() => handleNavigation('/admin')}
              sx={{
                backgroundColor: isCurrentPath('/admin') ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              Admin
            </Button>
          )}

          {/* Menú de usuario */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar 
              src={user?.photoURL} 
              sx={{ width: 32, height: 32 }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
          </IconButton>

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
                  src={user?.photoURL} 
                  sx={{ width: 40, height: 40, mr: 2 }}
                >
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
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

            {/* Opciones de navegación */}
            <MenuItem 
              onClick={() => handleNavigation('/')}
              disabled={isCurrentPath('/')}
            >
              <HomeIcon sx={{ mr: 2 }} />
              Inicio
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;