import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Chip,
    Stack,
    Divider,
    Avatar,
    Paper
} from '@mui/material'
import {
    LocalFlorist as PlantIcon,
    Numbers as NumberIcon,
    Grass as SeedIcon,
    Layers as SubstrateIcon,
    Straighten as SizeIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Add as AddIcon,
    QrCode as QrIcon
} from '@mui/icons-material'
import { camasService } from '../../firebase/firebaseService'

const CamaForm = ({ 
    camaId = null, 
    initialData = null, 
    onSave, 
    onCancel,
    mode = 'create' // 'create' | 'edit'
}) => {
    // Estados del formulario
    const [formData, setFormData] = useState({
        nombrePlanta: '',
        cantidadPlantas: '',
        esquejes: '',
        sustrato: '',
        tarroSize: '',
        tarroUnidad: 'pulgadas'
    })
    const [camaIdInput, setCamaIdInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [errors, setErrors] = useState({})

    // Opciones para los selects
    const unidadesOptions = [
        'pulgadas',
        'cm',
        'mm'
    ]

    const sustratosComunes = [
        'Turba',
        'Fibra de coco',
        'Perlita',
        'Vermiculita',
        'Turba + Perlita',
        'Fibra de coco + Perlita',
        'Sustrato comercial',
        'Arena',
        'Tierra vegetal',
        'Otro'
    ]

    // Cargar datos iniciales si es modo edición
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                nombrePlanta: initialData.nombrePlanta || '',
                cantidadPlantas: initialData.cantidadPlantas || '',
                esquejes: initialData.esquejes || '',
                sustrato: initialData.sustrato || '',
                tarroSize: initialData.tarroSize || '',
                tarroUnidad: initialData.tarroUnidad || 'pulgadas'
            })
        }
        if (mode === 'edit' && camaId) {
            setCamaIdInput(camaId)
        }
    }, [mode, initialData, camaId])

    // Manejar cambios en inputs
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        
        // Limpiar error del campo si existe
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }))
        }
    }

    // Validar formulario
    const validateForm = () => {
        const newErrors = {}

        // Validar ID de cama (solo en modo crear)
        if (mode === 'create') {
            if (!camaIdInput.trim()) {
                newErrors.camaId = 'El ID de la cama es requerido'
            } else if (!/^[a-zA-Z0-9_-]+$/.test(camaIdInput.trim())) {
                newErrors.camaId = 'El ID solo puede contener letras, números, guiones y guiones bajos'
            }
        }

        // Validar nombre de planta
        if (!formData.nombrePlanta.trim()) {
            newErrors.nombrePlanta = 'El nombre de la planta es requerido'
        }

        // Validar cantidad de plantas
        if (!formData.cantidadPlantas) {
            newErrors.cantidadPlantas = 'La cantidad de plantas es requerida'
        } else if (parseInt(formData.cantidadPlantas) <= 0) {
            newErrors.cantidadPlantas = 'La cantidad debe ser mayor a 0'
        }

        // Validar esquejes
        if (!formData.esquejes) {
            newErrors.esquejes = 'La cantidad de esquejes es requerida'
        } else if (parseInt(formData.esquejes) < 0) {
            newErrors.esquejes = 'La cantidad de esquejes no puede ser negativa'
        }

        // Validar sustrato
        if (!formData.sustrato.trim()) {
            newErrors.sustrato = 'El sustrato es requerido'
        }

        // Validar tamaño de tarro
        if (!formData.tarroSize) {
            newErrors.tarroSize = 'El tamaño del tarro es requerido'
        } else if (parseFloat(formData.tarroSize) <= 0) {
            newErrors.tarroSize = 'El tamaño debe ser mayor a 0'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Formatear ID de cama
    const formatCamaId = (id) => {
        return id.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
    }

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Por favor, corrige los errores en el formulario' })
            return
        }

        try {
            setLoading(true)
            setMessage(null)

            const camaData = {
                nombrePlanta: formData.nombrePlanta.trim(),
                cantidadPlantas: parseInt(formData.cantidadPlantas),
                esquejes: parseInt(formData.esquejes),
                sustrato: formData.sustrato.trim(),
                tarroSize: parseFloat(formData.tarroSize),
                tarroUnidad: formData.tarroUnidad
            }

            let result
            if (mode === 'create') {
                const finalCamaId = formatCamaId(camaIdInput.trim())
                result = await camasService.createCama(finalCamaId, camaData)
            } else {
                result = await camasService.updateCama(camaId, camaData)
            }

            if (result.success) {
                setMessage({ 
                    type: 'success', 
                    text: mode === 'create' ? 'Cama creada exitosamente' : 'Cama actualizada exitosamente'
                })
                
                // Limpiar formulario si es modo crear
                if (mode === 'create') {
                    setFormData({
                        nombrePlanta: '',
                        cantidadPlantas: '',
                        esquejes: '',
                        sustrato: '',
                        tarroSize: '',
                        tarroUnidad: 'pulgadas'
                    })
                    setCamaIdInput('')
                }

                // Callback de éxito
                if (onSave) {
                    onSave(result.data)
                }
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            console.error('Error en formulario:', error)
            setMessage({ type: 'error', text: 'Error inesperado. Intenta de nuevo.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {mode === 'create' ? <AddIcon /> : <EditIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {mode === 'create' ? '🌱 Nueva Cama de Cultivo' : '✏️ Editar Cama'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {mode === 'create' 
                                ? 'Registra una nueva cama con toda su información'
                                : `Modificando cama: ${camaId}`
                            }
                        </Typography>
                    </Box>
                </Box>

                {/* Mensajes */}
                {message && (
                    <Alert 
                        severity={message.type} 
                        sx={{ mb: 3 }}
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* ID de Cama - Solo en modo crear */}
                        {mode === 'create' && (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                    <TextField
                                        fullWidth
                                        label="ID de la Cama"
                                        value={camaIdInput}
                                        onChange={(e) => setCamaIdInput(e.target.value)}
                                        error={!!errors.camaId}
                                        helperText={errors.camaId || 'Ej: cama01, lavanda_A1, sector_norte_01'}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <QrIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="cama01"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'white'
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
                                        💡 Este ID se usará en la URL y código QR (ej: /cama/cama01)
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Divider>
                                <Chip label="Información de la planta" color="primary" />
                            </Divider>
                        </Grid>

                        {/* Nombre de la planta */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre de la Planta"
                                value={formData.nombrePlanta}
                                onChange={(e) => handleInputChange('nombrePlanta', e.target.value)}
                                error={!!errors.nombrePlanta}
                                helperText={errors.nombrePlanta}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PlantIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                placeholder="Ej: Lavanda, Romero, Albahaca"
                            />
                        </Grid>

                        {/* Cantidad de plantas */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cantidad de Plantas"
                                value={formData.cantidadPlantas}
                                onChange={(e) => handleInputChange('cantidadPlantas', e.target.value)}
                                error={!!errors.cantidadPlantas}
                                helperText={errors.cantidadPlantas}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <NumberIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 1 }
                                }}
                                placeholder="24"
                            />
                        </Grid>

                        {/* Cantidad de esquejes */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cantidad de Esquejes"
                                value={formData.esquejes}
                                onChange={(e) => handleInputChange('esquejes', e.target.value)}
                                error={!!errors.esquejes}
                                helperText={errors.esquejes}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SeedIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 0 }
                                }}
                                placeholder="100"
                            />
                        </Grid>

                        {/* Sustrato */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth error={!!errors.sustrato}>
                                <InputLabel>Sustrato</InputLabel>
                                <Select
                                    value={formData.sustrato}
                                    onChange={(e) => handleInputChange('sustrato', e.target.value)}
                                    label="Sustrato"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SubstrateIcon color="primary" />
                                        </InputAdornment>
                                    }
                                >
                                    {sustratosComunes.map((sustrato) => (
                                        <MenuItem key={sustrato} value={sustrato}>
                                            {sustrato}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.sustrato && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                        {errors.sustrato}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider>
                                <Chip label="Información del contenedor" color="secondary" />
                            </Divider>
                        </Grid>

                        {/* Tamaño del tarro */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Tamaño del Tarro"
                                value={formData.tarroSize}
                                onChange={(e) => handleInputChange('tarroSize', e.target.value)}
                                error={!!errors.tarroSize}
                                helperText={errors.tarroSize}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SizeIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 0, step: 0.1 }
                                }}
                                placeholder="8"
                            />
                        </Grid>

                        {/* Unidad del tarro */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Unidad de Medida</InputLabel>
                                <Select
                                    value={formData.tarroUnidad}
                                    onChange={(e) => handleInputChange('tarroUnidad', e.target.value)}
                                    label="Unidad de Medida"
                                >
                                    {unidadesOptions.map((unidad) => (
                                        <MenuItem key={unidad} value={unidad}>
                                            {unidad}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Resumen visual */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    📋 Resumen
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                    {formData.nombrePlanta && (
                                        <Chip 
                                            icon={<PlantIcon />} 
                                            label={formData.nombrePlanta} 
                                            color="primary" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {formData.cantidadPlantas && (
                                        <Chip 
                                            label={`${formData.cantidadPlantas} plantas`} 
                                            color="secondary" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {formData.sustrato && (
                                        <Chip 
                                            label={formData.sustrato} 
                                            color="success" 
                                            variant="outlined" 
                                        />
                                    )}
                                    {formData.tarroSize && formData.tarroUnidad && (
                                        <Chip 
                                            label={`${formData.tarroSize} ${formData.tarroUnidad}`} 
                                            color="info" 
                                            variant="outlined" 
                                        />
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Botones de acción */}
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                {onCancel && (
                                    <Button
                                        variant="outlined"
                                        onClick={onCancel}
                                        disabled={loading}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                    sx={{ 
                                        textTransform: 'none',
                                        minWidth: 120
                                    }}
                                >
                                    {loading 
                                        ? 'Guardando...' 
                                        : mode === 'create' 
                                            ? 'Crear Cama' 
                                            : 'Actualizar'
                                    }
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    )
}

export default CamaForm