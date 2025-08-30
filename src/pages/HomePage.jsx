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
  Alert,
  CardActions
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  QrCode as QrCodeIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header de bienvenida */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}>
        <Box textAlign="center">
          <AgricultureIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            Bienvenido a Agro-Track v2.0
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
            Sistema de gestión jerárquica de viveros y tracking dinámico de cultivos
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

      {/* Funcionalidades principales */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Acceso Rápido
        </Typography>

        <Grid container spacing={3}>
          {/* Gestión de Viveros */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <AgricultureIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Gestión de Viveros
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Administra viveros, camas de cultivo y realiza tracking dinámico
                  de esquejes con geolocalización GPS integrada.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleNavigation('/viveros')}
                  startIcon={<AgricultureIcon />}
                  fullWidth
                >
                  Ir a Viveros
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Panel de Admin - Solo para administradores */}
          {isAdmin && (
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AdminIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h6">
                      Panel de Administración
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Gestiona usuarios, configura el sistema, administra permisos
                    y supervisa todas las operaciones del sistema.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleNavigation('/admin')}
                    startIcon={<AdminIcon />}
                    fullWidth
                  >
                    Panel Admin
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}

          {/* Dashboard - Próximamente */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', opacity: 0.7, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <DashboardIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Dashboard Analytics
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Visualización de datos con gráficos interactivos, estadísticas
                  de productividad y reportes temporales de cultivos.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<DashboardIcon />}
                  fullWidth
                >
                  Próximamente
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Sistema QR - Próximamente */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', opacity: 0.7, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <QrCodeIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Sistema QR
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Genera códigos QR únicos para viveros y camas, comparte información
                  y permite acceso público desde dispositivos móviles.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<QrCodeIcon />}
                  fullWidth
                >
                  Próximamente
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Reportes - Próximamente */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', opacity: 0.7, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Reportes y Exportación
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Genera reportes personalizados, exporta datos en múltiples formatos
                  y crea informes de productividad detallados.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<AssignmentIcon />}
                  fullWidth
                >
                  Próximamente
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Analytics Avanzados - Próximamente */}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', opacity: 0.7, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">
                    Analytics Predictivo
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Análisis predictivo de tendencias, optimización de producción
                  y recomendaciones inteligentes basadas en datos históricos.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<TrendingUpIcon />}
                  fullWidth
                >
                  Próximamente
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Información del sistema */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estado del Sistema v2.0
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Versión Actual:</strong> Agro-Track v2.0 - Arquitectura Jerárquica
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Funcionalidades Activas:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ ml: 2 }}>
              • Sistema de autenticación con Google<br />
              • Gestión de usuarios y permisos<br />
              • Hooks React avanzados (useViveros, useCamas)<br />
              • Servicios Firebase v2.0 modularizados<br />
              • Arquitectura jerárquica: Viveros → Camas → Cortes<br />
              • Sistema GPS y geolocalización integrado
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Próximas Implementaciones:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ ml: 2 }}>
              • Formularios de gestión de viveros y camas<br />
              • Sistema QR completo con descarga/impresión<br />
              • Vistas públicas QR responsive mobile-first<br />
              • Dashboard con gráficos de Recharts<br />
              • Analytics y reportes temporales<br />
              • Tracking dinámico de esquejes avanzado
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default HomePage;