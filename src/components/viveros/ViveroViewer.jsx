// src/components/viveros/ViveroViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  LocationOn as LocationIcon,
  GpsFixed as GpsIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Eco as EcoIcon,
  QrCode as QrCodeIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useViveros } from '../../hooks/useViveros.jsx';
import { useCamas } from '../../hooks/useCamas.js';

/**
 * ============================================================================
 * 📱 ViveroViewer Component
 * ============================================================================
 * Vista pública QR para viveros - Mobile-first responsive
 * - Acceso público sin autenticación
 * - Información completa del vivero
 * - Lista de camas con estadísticas
 * - Diseñada para escaneo QR móvil
 * ============================================================================
 */

const ViveroViewer = () => {
  const { viveroId } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Hooks con configuración para vista pública
  const { 
    selectedVivero, 
    loadVivero, 
    loading: loadingVivero, 
    error: viveroError 
  } = useViveros({ autoLoad: false, publicOnly: true });

  const {
    camas,
    loadCamas,
    loading: loadingCamas,
    error: camasError,
    totalCamas,
    camasActivas,
    totalPlantas,
    totalEsquejesHistorico
  } = useCamas(viveroId, { autoLoad: false, includeStats: true });

  // ============================================================================
  // 🔄 EFECTOS DE CARGA
  // ============================================================================

  useEffect(() => {
    if (viveroId) {
      loadVivero(viveroId, true); // Con estadísticas
      loadCamas();
    }
  }, [viveroId, loadVivero, loadCamas, refreshKey]);

  // ============================================================================
  // 🔧 HANDLERS
  // ============================================================================

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewCama = (camaId) => {
    navigate(`/v/${viveroId}/c/${camaId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatLocation = (ubicacion) => {
    if (!ubicacion || ubicacion.tipo === 'vacio') {
      return { text: 'Sin ubicación', icon: <LocationIcon />, color: 'default' };
    }

    if (ubicacion.tipo === 'gps') {
      return {
        text: ubicacion.direccion || 'Coordenadas GPS',
        icon: <GpsIcon />,
        color: 'success'
      };
    }

    return {
      text: ubicacion.direccion || 'Ubicación registrada',
      icon: <LocationIcon />,
      color: 'info'
    };
  };

  // ============================================================================
  // 🎨 RENDERIZADO DE COMPONENTES
  // ============================================================================

  const CamaCard = ({ cama }) => {
    const stats = cama.estadisticas || {};
    
    return (
      <Card 
        sx={{ 
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
        onClick={() => handleViewCama(cama.id)}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h3">
              Cama {cama.id}
            </Typography>
            <Chip 
              label={cama.estado || 'activa'} 
              color={cama.estado === 'activa' ? 'success' : 'default'}
              size="small"
            />
          </Box>

          {/* Planta */}
          <Box display="flex" alignItems="center" mb={1}>
            <EcoIcon sx={{ mr: 1, fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2">
              <strong>{cama.nombrePlanta || 'Planta'}</strong>
            </Typography>
          </Box>

          {/* Cantidad de plantas */}
          <Typography variant="body2" color="text.secondary" mb={2}>
            {cama.cantidadPlantas || 0} plantas en {cama.sustrato || 'sustrato'}
          </Typography>

          {/* Estadísticas mini */}
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {stats.totalCortes || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cortes
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="secondary">
                {stats.totalEsquejesHistorico || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esquejes
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions>
          <Button 
            size="small" 
            startIcon={<QrCodeIcon />}
            fullWidth
          >
            Ver Detalle
          </Button>
        </CardActions>
      </Card>
    );
  };

  const StatCard = ({ icon, title, value, color = 'primary' }) => (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        {React.cloneElement(icon, { sx: { fontSize: 32, color: `${color}.main`, mb: 1 } })}
        <Typography variant="h4" color={color} gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  );

  // ============================================================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ============================================================================

  // Estados de carga y error
  if (loadingVivero) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Box textAlign="center">
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Cargando información del vivero...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (viveroError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {viveroError}
        </Alert>
        <Box textAlign="center">
          <Button variant="contained" onClick={handleRefresh}>
            Intentar de nuevo
          </Button>
        </Box>
      </Container>
    );
  }

  if (!selectedVivero) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vivero no encontrado: {viveroId}
        </Alert>
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            El vivero solicitado no existe o no está disponible públicamente.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Ir al Inicio
          </Button>
        </Box>
      </Container>
    );
  }

  const location = formatLocation(selectedVivero.ubicacion);
  const stats = selectedVivero.estadisticas || {};

  return (
    <Container maxWidth="md" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
      {/* Header con navegación */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Breadcrumbs>
          <Link 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            Agro-Track
          </Link>
          <Typography color="text.primary">
            {selectedVivero.nombre}
          </Typography>
        </Breadcrumbs>
        
        <IconButton 
          onClick={handleRefresh} 
          disabled={loadingVivero || loadingCamas}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Header del Vivero */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" mb={2}>
              <AgricultureIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {selectedVivero.nombre}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  ID: {selectedVivero.id}
                </Typography>
              </Box>
            </Box>

            {/* Descripción */}
            {selectedVivero.descripcion && (
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                {selectedVivero.descripcion}
              </Typography>
            )}

            {/* Responsable */}
            {selectedVivero.responsable && (
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2">
                  Responsable: {selectedVivero.responsable}
                </Typography>
              </Box>
            )}

            {/* Ubicación */}
            <Box display="flex" alignItems="center">
              {location.icon}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {location.text}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas Generales */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Estadísticas Generales
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<AgricultureIcon />}
              title="Total Camas"
              value={stats.totalCamas || totalCamas || 0}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<TrendingUpIcon />}
              title="Camas Activas"
              value={stats.camasOcupadas || camasActivas || 0}
              color="success"
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<EcoIcon />}
              title="Total Plantas"
              value={stats.totalPlantas || totalPlantas || 0}
              color="info"
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<AgricultureIcon />}
              title="Esquejes Histórico"
              value={stats.totalEsquejesHistorico || totalEsquejesHistorico || 0}
              color="secondary"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Información adicional */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Información del Vivero
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Fecha de Creación
              </Typography>
              <Typography variant="body1">
                {formatDate(selectedVivero.createdAt)}
              </Typography>
            </Box>
            
            {selectedVivero.updatedAt && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Última Actualización
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedVivero.updatedAt)}
                </Typography>
              </Box>
            )}

            {stats.ultimaActualizacion && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Estadísticas Actualizadas
                </Typography>
                <Typography variant="body1">
                  {formatDate(stats.ultimaActualizacion)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Acceso Público QR
                </Typography>
                <Chip 
                  label={selectedVivero.configuracion?.permitirQRPublico ? 'Habilitado' : 'Deshabilitado'}
                  color={selectedVivero.configuracion?.permitirQRPublico ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Lista Pública
                </Typography>
                <Chip 
                  label={selectedVivero.configuracion?.mostrarEnListaPublica ? 'Visible' : 'Oculto'}
                  color={selectedVivero.configuracion?.mostrarEnListaPublica ? 'info' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Lista de Camas */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Camas del Vivero ({camas.length})
          </Typography>
          {loadingCamas && <CircularProgress size={20} />}
        </Box>

        {camasError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Error cargando camas: {camasError}
          </Alert>
        )}

        {camas.length > 0 ? (
          <Grid container spacing={2}>
            {camas.map((cama) => (
              <Grid item xs={12} sm={6} md={4} key={cama.id}>
                <CamaCard cama={cama} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <EcoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay camas registradas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Este vivero aún no tiene camas de cultivo configuradas.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Footer con información del sistema */}
      <Paper sx={{ p: 2, mt: 4, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
          <AgricultureIcon sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" color="primary" fontWeight="bold">
            Agro-Track v2.0
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Sistema de gestión jerárquica de viveros y tracking dinámico de cultivos
        </Typography>
        
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            Vista actualizada: {new Date().toLocaleString('es-ES')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ViveroViewer;