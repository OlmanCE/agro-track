// src/components/viveros/ViverosList.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Agriculture as AgricultureIcon,
  LocationOn as LocationIcon,
  GpsFixed as GpsIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useViveros } from '../../hooks/useViveros.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * ============================================================================
 * 🏡 ViverosList Component
 * ============================================================================
 * Lista completa de viveros con funcionalidades:
 * - Búsqueda y filtrado
 * - Cards responsivas con información clave
 * - Acciones CRUD integradas
 * - Estados loading visuales
 * - Navegación a formularios y vistas
 * ============================================================================
 */

const ViverosList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const {
    viveros,
    loading,
    error,
    loadViveros,
    deleteVivero,
    loadingDelete,
    deleteError,
    searchViveros,
    clearErrors
  } = useViveros({ 
    autoLoad: true, 
    includeStats: true 
  });

  // ============================================================================
  // 📊 ESTADO LOCAL
  // ============================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredViveros, setFilteredViveros] = useState([]);
  const [selectedVivero, setSelectedVivero] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viveroToDelete, setViveroToDelete] = useState(null);

  // ============================================================================
  // 🔄 EFECTOS
  // ============================================================================

  // Filtrar viveros cuando cambia el término de búsqueda
  useEffect(() => {
    const filtered = searchViveros(searchTerm);
    setFilteredViveros(filtered);
  }, [searchTerm, viveros, searchViveros]);

  // Limpiar errores al cargar
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // ============================================================================
  // 🔧 HANDLERS
  // ============================================================================

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = async () => {
    await loadViveros(true);
  };

  const handleCreateVivero = () => {
    navigate('/admin/vivero/nuevo');
  };

  const handleViewVivero = (viveroId) => {
    navigate(`/vivero/${viveroId}`);
  };

  const handleEditVivero = (viveroId) => {
    if (!isAdmin) return;
    navigate(`/admin/vivero/${viveroId}/editar`);
  };

  const handleActionMenu = (event, vivero) => {
    event.stopPropagation();
    setSelectedVivero(vivero);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedVivero(null);
  };

  const handleDeleteClick = (vivero) => {
    setViveroToDelete(vivero);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!viveroToDelete) return;

    try {
      await deleteVivero(viveroToDelete.id);
      setDeleteDialogOpen(false);
      setViveroToDelete(null);
    } catch (error) {
      console.error('Error eliminando vivero:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setViveroToDelete(null);
  };

  // ============================================================================
  // 🎨 RENDERIZADO DE COMPONENTES
  // ============================================================================

  const formatLocation = (ubicacion) => {
    if (!ubicacion || ubicacion.tipo === 'vacio') {
      return { text: 'Sin ubicación', icon: null, color: 'default' };
    }

    if (ubicacion.tipo === 'gps') {
      return {
        text: ubicacion.direccion || 'GPS activo',
        icon: <GpsIcon />,
        color: 'success'
      };
    }

    if (ubicacion.tipo === 'manual') {
      return {
        text: ubicacion.direccion || 'Ubicación manual',
        icon: <LocationIcon />,
        color: 'info'
      };
    }

    return { text: 'Sin ubicación', icon: null, color: 'default' };
  };

  const ViveroCard = ({ vivero }) => {
    const location = formatLocation(vivero.ubicacion);
    const stats = vivero.estadisticas || {};

    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
        onClick={() => handleViewVivero(vivero.id)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header con título y menú de acciones */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flexGrow={1}>
              <Typography variant="h6" component="h2" gutterBottom>
                {vivero.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {vivero.id}
              </Typography>
            </Box>
            
            {isAdmin && (
              <IconButton 
                size="small" 
                onClick={(e) => handleActionMenu(e, vivero)}
                sx={{ ml: 1 }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          {/* Descripción */}
          {vivero.descripcion && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2, minHeight: '40px' }}
            >
              {vivero.descripcion.length > 100 
                ? `${vivero.descripcion.substring(0, 100)}...`
                : vivero.descripcion
              }
            </Typography>
          )}

          {/* Responsable */}
          {vivero.responsable && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Responsable:</strong> {vivero.responsable}
            </Typography>
          )}

          {/* Ubicación */}
          <Box display="flex" alignItems="center" mb={2}>
            <Chip
              label={location.text}
              color={location.color}
              icon={location.icon}
              size="small"
              sx={{ maxWidth: '100%' }}
            />
          </Box>

          {/* Estadísticas */}
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Box textAlign="center" p={1} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" color="primary">
                  {stats.totalCamas || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Camas
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box textAlign="center" p={1} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" color="success.main">
                  {stats.camasOcupadas || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ocupadas
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box textAlign="center" p={1} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" color="info.main">
                  {stats.totalPlantas || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Plantas
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box textAlign="center" p={1} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" color="secondary.main">
                  {stats.totalEsquejesHistorico || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Esquejes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ pt: 0 }}>
          <Button 
            size="small" 
            startIcon={<ViewIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewVivero(vivero.id);
            }}
          >
            Ver Detalle
          </Button>
          
          <Button 
            size="small" 
            startIcon={<QrCodeIcon />}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implementar vista QR
              console.log('Vista QR:', vivero.id);
            }}
          >
            QR
          </Button>

          {isAdmin && (
            <Button 
              size="small" 
              startIcon={<EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditVivero(vivero.id);
              }}
            >
              Editar
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  // ============================================================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ============================================================================

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Box mb={3}>
        <Breadcrumbs>
          <Link 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Inicio
          </Link>
          <Typography color="text.primary">
            Viveros
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Viveros
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra tus viveros, camas de cultivo y tracking de esquejes
          </Typography>
        </Box>

        {/* Botón refrescar */}
        <Tooltip title="Refrescar lista">
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            color="primary"
          >
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Delete Error */}
      {deleteError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al eliminar: {deleteError}
        </Alert>
      )}

      {/* Barra de búsqueda y filtros */}
      <Box mb={4}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar viveros por nombre, descripción, responsable..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                disabled // TODO: Implementar filtros avanzados
              >
                Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Contador de resultados */}
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary">
          {loading 
            ? 'Cargando viveros...'
            : `${filteredViveros.length} vivero${filteredViveros.length !== 1 ? 's' : ''} encontrado${filteredViveros.length !== 1 ? 's' : ''}`
          }
        </Typography>
      </Box>

      {/* Grid de viveros */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredViveros.length > 0 ? (
        <Grid container spacing={3}>
          {filteredViveros.map((vivero) => (
            <Grid item xs={12} sm={6} lg={4} key={vivero.id}>
              <ViveroCard vivero={vivero} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AgricultureIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm 
              ? 'No se encontraron viveros que coincidan con la búsqueda'
              : 'No hay viveros registrados'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza creando tu primer vivero'
            }
          </Typography>
          
          {isAdmin && !searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateVivero}
              sx={{ mt: 2 }}
            >
              Crear Primer Vivero
            </Button>
          )}
        </Paper>
      )}

      {/* FAB para crear nuevo vivero */}
      {isAdmin && filteredViveros.length > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={handleCreateVivero}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Menú de acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleViewVivero(selectedVivero?.id)}>
          <ViewIcon sx={{ mr: 2 }} />
          Ver Detalle
        </MenuItem>
        
        <MenuItem onClick={() => handleEditVivero(selectedVivero?.id)}>
          <EditIcon sx={{ mr: 2 }} />
          Editar
        </MenuItem>
        
        <MenuItem onClick={() => console.log('QR:', selectedVivero?.id)}>
          <QrCodeIcon sx={{ mr: 2 }} />
          Ver QR
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleDeleteClick(selectedVivero)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 2 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar el vivero <strong>"{viveroToDelete?.nombre}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción eliminará permanentemente el vivero y todas sus camas y cortes de esquejes asociados.
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            disabled={loadingDelete}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loadingDelete}
            startIcon={loadingDelete ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {loadingDelete ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViverosList;