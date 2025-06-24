import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Container,
    Button,
    Stack,
    CircularProgress,
    Alert
} from '@mui/material'
import {
    ArrowBack as BackIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material'
import CamaForm from '../components/camas/CamaForm'
import { camasService } from '../firebase/firebaseService'

const CamaFormPage = ({ mode = 'create' }) => {
    const { camaId } = useParams()
    const navigate = useNavigate()
    const [initialData, setInitialData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Cargar datos existentes si es modo edición
    useEffect(() => {
        if (mode === 'edit' && camaId) {
            loadCamaData()
        }
    }, [mode, camaId])

    const loadCamaData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const result = await camasService.getCama(camaId)
            
            if (result.success) {
                setInitialData(result.data)
            } else {
                setError(result.error)
            }
        } catch (error) {
            console.error("Error cargando cama:", error)
            setError("Error al cargar la información de la cama")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = (camaData) => {
        // Redirigir al admin después de guardar
        navigate('/admin', { 
            state: { 
                message: mode === 'create' 
                    ? `Cama ${camaData.id || 'nueva'} creada exitosamente` 
                    : `Cama ${camaId} actualizada exitosamente` 
            }
        })
    }

    const handleCancel = () => {
        navigate('/admin')
    }

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress size={48} sx={{ color: 'white' }} />
            </Box>
        )
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
                py: 4
            }}
        >
            <Container maxWidth="md">
                {/* Header con navegación */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<BackIcon />}
                        onClick={handleCancel}
                        sx={{ 
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: 'primary.main',
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': {
                                bgcolor: 'white',
                                borderColor: 'primary.main'
                            }
                        }}
                    >
                        Volver al Admin
                    </Button>
                    
                    <Button
                        variant="contained"
                        startIcon={<DashboardIcon />}
                        onClick={() => navigate('/admin')}
                        sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)'
                            }
                        }}
                    >
                        Panel de Admin
                    </Button>
                </Stack>

                {/* Mensaje de error si ocurre al cargar */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Formulario */}
                {(!loading && (mode === 'create' || initialData)) && (
                    <CamaForm
                        mode={mode}
                        camaId={camaId}
                        initialData={initialData}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                )}

                {/* Estado de error en modo edición */}
                {mode === 'edit' && !loading && !initialData && error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        No se pudo cargar la información de la cama. 
                        <Button 
                            color="inherit" 
                            onClick={loadCamaData}
                            sx={{ ml: 1 }}
                        >
                            Reintentar
                        </Button>
                    </Alert>
                )}
            </Container>
        </Box>
    )
}

export default CamaFormPage