// src/components/viveros/ViveroForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  GpsFixed as GpsIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Agriculture as AgricultureIcon
} from '@mui/icons-material';
import { useViveros } from '../../hooks/useViveros.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * ============================================================================
 * 🌱 ViveroForm Component
 * ============================================================================
 * Formulario completo para crear/editar viveros
 * - Integración total con useViveros hook
 * - GPS tiempo real con geolocalización
 * - Validación client-side robusta
 * - Estados loading visuales
 * - Material-UI responsive mobile-first
 * ============================================================================
 */

const ViveroForm = ({ 
  viveroId = null, 
  mode = 'create', // 'create' o 'edit'
  onSuccess = null,
  onCancel = null 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedVivero,
    loadVivero,
    createVivero,
    updateVivero,
    updateViveroGPS,
    updateViveroUbicacionManual,
    loadingCreate,
    loadingUpdate,
    loadingGPS,
    createError,
    updateError,
    gpsError,
    clearErrors,
    validateViveroData
  } = useViveros();

  // ============================================================================
  // 📊 ESTADO DEL FORMULARIO
  // ============================================================================

  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    responsable: '',
    ubicacion: {
      tipo: 'vacio',
      coordenadas: null,
      direccion: '',
      timestamp: null
    },
    configuracion: {
      permitirQRPublico: true,
      mostrarEnListaPublica: true
    }
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [direccionManual, setDireccionManual] = useState('');

  // ============================================================================
  // 🔄 EFECTOS INICIALES
  // ============================================================================

  // Cargar vivero para edición
  useEffect(() => {
    if (mode === 'edit' && viveroId) {
      if (selectedVivero && selectedVivero.id === viveroId) {
        populateFormFromVivero(selectedVivero);
      } else {
        loadVivero(viveroId).then(vivero => {
          if (vivero) {
            populateFormFromVivero(vivero);
          }
        });
      }
    }
  }, [mode, viveroId, selectedVivero, loadVivero]);

  // Limpiar errores cuando cambia el modo
  useEffect(() => {
    clearErrors();
    setErrors({});
  }, [mode, clearErrors]);

  // ============================================================================
  // 🔧 FUNCIONES AUXILIARES
  // ============================================================================

  const populateFormFromVivero = (vivero) => {
    setFormData({
      id: vivero.id || '',
      nombre: vivero.nombre || '',
      descripcion: vivero.descripcion || '',
      responsable: vivero.responsable || '',
      ubicacion: {
        tipo: vivero.ubicacion?.tipo || 'vacio',
        coordenadas: vivero.ubicacion?.coordenadas || null,
        direccion: vivero.ubicacion?.direccion || '',
        timestamp: vivero.ubicacion?.timestamp || null
      },
      configuracion: {
        permitirQRPublico: vivero.configuracion?.permitirQRPublico ?? true,
        mostrarEnListaPublica: vivero.configuracion?.mostrarEnListaPublica ?? true
      }
    });

    if (vivero.ubicacion?.direccion) {
      setDireccionManual(vivero.ubicacion.direccion);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    
    if (field.includes('.')) {
      // Campo anidado
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Marcar como tocado
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Limpiar error específico si existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSwitchChange = (field) => (event) => {
    const checked = event.target.checked;
    const [parent, child] = field.split('.');
    
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: checked
      }
    }));
  };

  // ============================================================================
  // 📍 FUNCIONES GPS
  // ============================================================================

  const handleCaptureGPS = async () => {
    try {
      clearErrors();
      
      if (mode === 'create') {
        // En modo crear, solo capturar coordenadas localmente
        const gpsResult = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => {
              let errorMessage = "Error obteniendo GPS";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "Permisos de GPS denegados";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "GPS no disponible";
                  break;
                case error.TIMEOUT:
                  errorMessage = "Timeout obteniendo GPS";
                  break;
              }
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          );
        });

        // Actualizar estado local
        setFormData(prev => ({
          ...prev,
          ubicacion: {
            tipo: 'gps',
            coordenadas: { lat: gpsResult.lat, lng: gpsResult.lng },
            direccion: `GPS: ${gpsResult.lat.toFixed(6)}, ${gpsResult.lng.toFixed(6)}`,
            timestamp: new Date()
          }
        }));

        console.log("✅ GPS capturado localmente");

      } else {
        // En modo editar, usar el hook para guardar inmediatamente
        await updateViveroGPS(viveroId);
        
        // El hook ya actualiza selectedVivero, así que recargar form
        if (selectedVivero) {
          populateFormFromVivero(selectedVivero);
        }
      }

    } catch (error) {
      console.error("❌ Error capturando GPS:", error.message);
    }
  };

  const handleUpdateDireccionManual = async () => {
    if (!direccionManual.trim()) return;

    try {
      if (mode === 'create') {
        // En modo crear, actualizar estado local
        setFormData(prev => ({
          ...prev,
          ubicacion: {
            tipo: 'manual',
            coordenadas: null,
            direccion: direccionManual.trim(),
            timestamp: new Date()
          }
        }));
      } else {
        // En modo editar, guardar inmediatamente
        await updateViveroUbicacionManual(viveroId, direccionManual.trim());
        
        if (selectedVivero) {
          populateFormFromVivero(selectedVivero);
        }
      }

      console.log("✅ Dirección manual actualizada");

    } catch (error) {
      console.error("❌ Error actualizando dirección:", error.message);
    }
  };

  const handleClearUbicacion = () => {
    setFormData(prev => ({
      ...prev,
      ubicacion: {
        tipo: 'vacio',
        coordenadas: null,
        direccion: '',
        timestamp: null
      }
    }));
    setDireccionManual('');
  };

  // ============================================================================
  // ✅ VALIDACIÓN Y SUBMIT
  // ============================================================================

  const validateForm = () => {
    const validation = validateViveroData(formData);
    const newErrors = {};

    if (!validation.valid) {
      validation.errors.forEach(error => {
        if (error.includes('nombre')) newErrors.nombre = error;
        if (error.includes('ID')) newErrors.id = error;
      });
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre del vivero es requerido';
    }

    if (mode === 'create' && !formData.id.trim()) {
      newErrors.id = 'ID del vivero es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      clearErrors();

      if (mode === 'create') {
        const viveroId = await createVivero(formData, user.email);
        
        if (onSuccess) {
          onSuccess(viveroId);
        } else {
          navigate('/admin');
        }
      } else {
        await updateVivero(viveroId, formData, user.email);
        
        if (onSuccess) {
          onSuccess(viveroId);
        } else {
          navigate('/admin');
        }
      }

    } catch (error) {
      console.error("❌ Error en submit:", error.message);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/admin');
    }
  };

  // ============================================================================
  // 🎨 RENDERIZADO
  // ============================================================================

  const isLoading = loadingCreate || loadingUpdate;
  const currentError = createError || updateError;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <AgricultureIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4" component="h1">
            {mode === 'create' ? 'Crear Nuevo Vivero' : 'Editar Vivero'}
          </Typography>
        </Box>

        {/* Error Alert */}
        {currentError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {currentError}
          </Alert>
        )}

        {/* GPS Error */}
        {gpsError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            GPS: {gpsError}
          </Alert>
        )}

        {/* Formulario */}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Información Básica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* ID del Vivero */}
            {mode === 'create' && (
              <Grid item xs={12} md={4}>
                <TextField
                  label="ID del Vivero"
                  value={formData.id}
                  onChange={handleInputChange('id')}
                  error={!!errors.id}
                  helperText={errors.id || "Solo letras minúsculas, números y guiones"}
                  required
                  fullWidth
                  placeholder="ej: vivero-norte"
                />
              </Grid>
            )}

            {/* Nombre */}
            <Grid item xs={12} md={mode === 'create' ? 8 : 12}>
              <TextField
                label="Nombre del Vivero"
                value={formData.nombre}
                onChange={handleInputChange('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
                fullWidth
                placeholder="ej: Vivero Norte"
              />
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                value={formData.descripcion}
                onChange={handleInputChange('descripcion')}
                multiline
                rows={3}
                fullWidth
                placeholder="Descripción detallada del vivero..."
              />
            </Grid>

            {/* Responsable */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Responsable"
                value={formData.responsable}
                onChange={handleInputChange('responsable')}
                fullWidth
                placeholder="Nombre del responsable"
              />
            </Grid>

            {/* Ubicación */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Ubicación
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Estado actual de ubicación */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Estado Actual
                      </Typography>
                      
                      {formData.ubicacion.tipo === 'vacio' && (
                        <Chip label="Sin ubicación" color="default" />
                      )}
                      
                      {formData.ubicacion.tipo === 'gps' && (
                        <Box>
                          <Chip 
                            label="GPS Activo" 
                            color="success" 
                            icon={<GpsIcon />} 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {formData.ubicacion.direccion}
                          </Typography>
                          {formData.ubicacion.coordenadas && (
                            <Typography variant="caption" color="text.secondary">
                              Lat: {formData.ubicacion.coordenadas.lat.toFixed(6)}, 
                              Lng: {formData.ubicacion.coordenadas.lng.toFixed(6)}
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {formData.ubicacion.tipo === 'manual' && (
                        <Box>
                          <Chip 
                            label="Manual" 
                            color="info" 
                            icon={<LocationIcon />} 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {formData.ubicacion.direccion}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <IconButton onClick={handleClearUbicacion} color="error">
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Botón GPS */}
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                startIcon={loadingGPS ? <CircularProgress size={20} /> : <GpsIcon />}
                onClick={handleCaptureGPS}
                disabled={loadingGPS || isLoading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loadingGPS ? 'Obteniendo GPS...' : 'Obtener GPS Actual'}
              </Button>
            </Grid>

            {/* Dirección manual */}
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1}>
                <TextField
                  label="Dirección Manual"
                  value={direccionManual}
                  onChange={(e) => setDireccionManual(e.target.value)}
                  fullWidth
                  placeholder="Escribir ubicación..."
                />
                <Button
                  variant="outlined"
                  onClick={handleUpdateDireccionManual}
                  disabled={!direccionManual.trim() || isLoading}
                  sx={{ minWidth: 60 }}
                >
                  <EditIcon />
                </Button>
              </Box>
            </Grid>

            {/* Configuración */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Configuración
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.configuracion.permitirQRPublico}
                    onChange={handleSwitchChange('configuracion.permitirQRPublico')}
                  />
                }
                label="Permitir acceso público via QR"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.configuracion.mostrarEnListaPublica}
                    onChange={handleSwitchChange('configuracion.mostrarEnListaPublica')}
                  />
                }
                label="Mostrar en lista pública"
              />
            </Grid>
          </Grid>

          {/* Botones de acción */}
          <Box display="flex" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isLoading}
              startIcon={<CancelIcon />}
              size="large"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              size="large"
            >
              {isLoading 
                ? (mode === 'create' ? 'Creando...' : 'Guardando...') 
                : (mode === 'create' ? 'Crear Vivero' : 'Guardar Cambios')
              }
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ViveroForm;