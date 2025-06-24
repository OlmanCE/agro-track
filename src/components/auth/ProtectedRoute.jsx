import React from 'react'
import {
    Box,
    CircularProgress,
    Alert,
    Typography,
    Button,
    Container,
    Card,
    CardContent,
    Stack
} from '@mui/material'
import {
    Lock as LockIcon,
    AdminPanelSettings as AdminIcon,
    Home as HomeIcon
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, isAdmin, loading, isAuthenticated } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    // Mostrar spinner mientras carga
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)'
                }}
            >
                <Card elevation={8} sx={{ p: 4, borderRadius: 3 }}>
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress size={48} color="primary" />
                        <Typography variant="h6" color="text.secondary">
                            Verificando acceso...
                        </Typography>
                    </Stack>
                </Card>
            </Box>
        )
    }

    // Redirigir a login si no está autenticado
    if (!isAuthenticated) {
        return (
            <Navigate 
                to="/login" 
                state={{ from: location }} 
                replace 
            />
        )
    }

    // Verificar permisos de admin si es requerido
    if (requireAdmin && !isAdmin) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2
                }}
            >
                <Container maxWidth="sm">
                    <Card
                        elevation={12}
                        sx={{
                            borderRadius: 4,
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255, 255, 255, 0.95)'
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Stack alignItems="center" spacing={3}>
                                {/* Icono de acceso denegado */}
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: 'error.light',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 1
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 40, color: 'white' }} />
                                </Box>

                                {/* Título */}
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    fontWeight="bold"
                                    color="error.main"
                                    textAlign="center"
                                >
                                    Acceso Denegado
                                </Typography>

                                {/* Mensaje */}
                                <Alert severity="warning" sx={{ width: '100%' }}>
                                    <Typography variant="body1">
                                        <strong>Permisos insuficientes:</strong> Esta sección requiere 
                                        privilegios de administrador.
                                    </Typography>
                                </Alert>

                                {/* Información del usuario */}
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Sesión actual:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {user?.email}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Rol: Usuario estándar
                                    </Typography>
                                </Box>

                                {/* Instrucciones */}
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        💡 <strong>¿Necesitas acceso de administrador?</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Contacta al administrador del sistema para solicitar 
                                        los permisos necesarios.
                                    </Typography>
                                </Box>

                                {/* Botones de acción */}
                                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<HomeIcon />}
                                        onClick={() => navigate('/')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Ir al inicio
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<AdminIcon />}
                                        onClick={() => window.location.href = 'mailto:admin@agro-track.com?subject=Solicitud de acceso administrador'}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Solicitar acceso
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        )
    }

    // Si todo está bien, renderizar el contenido
    return <>{children}</>
}

export default ProtectedRoute