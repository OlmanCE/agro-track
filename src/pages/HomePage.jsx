// src/pages/HomePage.jsx
import { useAuth } from '../hooks/useAuth.jsx';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  QrCode as QrCodeIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header de bienvenida */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}>
        <Box textAlign="center">
          <AgricultureIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            Bienvenido a Agro-Track
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
            Sistema de gestión de viveros y tracking de cultivos
          </Typography>
        </Box>
      </Paper>

      {/* Información del usuario */}
      <Box mb={4}>
        <Alert 
          severity={isAdmin ? "success" : "info"} 
          sx={{ mb: 2 }}
        >
          <Typography variant="body1">
            <strong>Usuario:</strong> {user?.name || 'Usuario'} ({user?.email})
            <br />
            <strong>Rol:</strong> {isAdmin ? 'Administrador' : 'Usuario Estándar'}
          </Typography>
        </Alert>
      </Box>

      {/* Funcionalidades disponibles */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Funcionalidades Disponibles
        </Typography>
        
        <Grid container spacing={3}>
          {/* Panel de Admin - Solo para administradores */}
          {isAdmin && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AdminIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h6">
                      Panel de Administración
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Accede al panel de administración para gestionar usuarios, 
                    viveros, camas de cultivo y configuraciones del sistema.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={() => navigate('/admin')}
                    startIcon={<DashboardIcon />}
                  >
                    Ir al Panel Admin
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Próximamente - Gestión de Viveros */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', opacity: 0.7 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AgricultureIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Gestión de Viveros
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Próximamente: Crear y administrar viveros, gestionar camas de cultivo 
                  y hacer tracking dinámico de esquejes.
                </Typography>
                <Button 
                  variant="outlined" 
                  disabled
                  startIcon={<AgricultureIcon />}
                >
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Próximamente - Códigos QR */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', opacity: 0.7 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <QrCodeIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Códigos QR
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Próximamente: Generar códigos QR únicos para viveros y camas, 
                  compartir información y acceder a datos desde dispositivos móviles.
                </Typography>
                <Button 
                  variant="outlined" 
                  disabled
                  startIcon={<QrCodeIcon />}
                >
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Próximamente - Dashboard */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', opacity: 0.7 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DashboardIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Dashboard y Analytics
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Próximamente: Visualización de datos con gráficos, estadísticas de 
                  productividad y reportes temporales de cultivos.
                </Typography>
                <Button 
                  variant="outlined" 
                  disabled
                  startIcon={<DashboardIcon />}
                >
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Información del sistema */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estado del Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Versión:</strong> Agro-Track v1.0 - MVP
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Funcionalidades activas:</strong> Sistema de autenticación con Google, 
          gestión de usuarios, panel de administración básico.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Próximamente:</strong> Gestión de viveros jerárquicos, tracking dinámico 
          de esquejes, códigos QR únicos, dashboard con gráficos y geolocalización GPS.
        </Typography>
      </Paper>
    </Container>
  );
};

export default HomePage;