// LoginPage.jsx - Versión con iconos seguros
import React from 'react'
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Avatar,
    Stack,
    useTheme,
    useMediaQuery
} from '@mui/material'
// Usar solo iconos que definitivamente existen
import {
    Google as GoogleIcon,
    LocalFlorist as PlantIcon,
    Yard as LeafIcon
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const LoginPage = () => {
    const { 
        loginWithGoogle, 
        loading, 
        authError, 
        isAuthenticated, 
        isAdmin,
        clearError 
    } = useAuth()
    
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Redirect después del login
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || (isAdmin ? '/admin' : '/')
            navigate(from, { replace: true })
        }
    }, [isAuthenticated, isAdmin, navigate, location])

    const handleGoogleLogin = async () => {
        clearError()
        await loginWithGoogle()
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Elementos decorativos de fondo */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    opacity: 0.1,
                    transform: 'rotate(-15deg)'
                }}
            >
                <LeafIcon sx={{ fontSize: 120 }} />
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '10%',
                    opacity: 0.1,
                    transform: 'rotate(25deg)'
                }}
            >
                <PlantIcon sx={{ fontSize: 100 }} />
            </Box>

            <Container maxWidth="sm">
                <Card
                    elevation={12}
                    sx={{
                        borderRadius: 4,
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <CardContent sx={{ padding: isMobile ? 3 : 4 }}>
                        {/* Logo y título */}
                        <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: 'primary.main',
                                    mb: 1
                                }}
                            >
                                <PlantIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            
                            <Typography
                                variant="h3"
                                component="h1"
                                fontWeight="bold"
                                color="primary.main"
                                textAlign="center"
                            >
                                Agro-Track
                            </Typography>
                            
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                textAlign="center"
                                sx={{ maxWidth: 300 }}
                            >
                                Gestión inteligente de cultivos
                            </Typography>
                        </Stack>

                        {/* Mensaje de bienvenida */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="body1"
                                textAlign="center"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Inicia sesión para acceder a tu sistema de gestión agrícola
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Acceso seguro
                            </Typography>
                        </Divider>

                        {/* Error Alert */}
                        {authError && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 3 }}
                                onClose={clearError}
                            >
                                {authError}
                            </Alert>
                        )}

                        {/* Botón de Google Login */}
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
                            sx={{
                                height: 56,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                background: 'linear-gradient(45deg, #4285F4 30%, #34A853 90%)',
                                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #3367D6 30%, #2E7D32 90%)',
                                    boxShadow: '0 6px 16px rgba(66, 133, 244, 0.4)',
                                    transform: 'translateY(-1px)'
                                },
                                '&:disabled': {
                                    background: 'rgba(0, 0, 0, 0.12)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                        </Button>

                        {/* Footer informativo */}
                        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Stack spacing={1}>
                                <Typography
                                    variant="body2"
                                    textAlign="center"
                                    color="text.secondary"
                                >
                                    🌱 Seguimiento de camas de cultivo
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="center"
                                    color="text.secondary"
                                >
                                    📱 Códigos QR para acceso rápido
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="center"
                                    color="text.secondary"
                                >
                                    🔒 Acceso seguro y controlado
                                </Typography>
                            </Stack>
                        </Box>

                        {/* Versión */}
                        <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                            color="text.disabled"
                            sx={{ mt: 3 }}
                        >
                            Agro-Track v1.0 - MVP
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}

export default LoginPage