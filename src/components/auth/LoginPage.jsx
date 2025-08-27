// src/components/auth/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Navigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AgricultureIcon from '@mui/icons-material/Agriculture';

const LoginPage = () => {
    const { login, isAuthenticated, loading, error, clearError } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Si ya está autenticado, redirigir al home
    if (isAuthenticated && !loading) {
        return <Navigate to="/" replace />;
    }

    const handleGoogleLogin = async () => {
        try {
            setIsLoggingIn(true);
            clearError(); // Limpiar errores previos
            await login();
            // El redirect se maneja automáticamente por el Navigate de arriba
        } catch (error) {
            console.error('Error en login:', error);
            // El error se maneja automáticamente por el useAuth hook
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                px={2}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        width: '100%',
                        maxWidth: 400,
                        textAlign: 'center',
                        borderRadius: 2
                    }}
                >
                    {/* Logo y título */}
                    <Box mb={3}>
                        <AgricultureIcon
                            sx={{
                                fontSize: 60,
                                color: 'primary.main',
                                mb: 2
                            }}
                        />
                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{ fontWeight: 'bold', color: 'primary.main' }}
                        >
                            Agro-Track
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            Sistema de gestión de viveros y cultivos
                        </Typography>
                    </Box>

                    {/* Mensaje de error */}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3, textAlign: 'left' }}
                            onClose={clearError}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Información sobre el acceso */}
                    <Box mb={3}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            Inicia sesión con tu cuenta de Google para acceder al sistema
                        </Typography>
                    </Box>

                    {/* Botón de login con Google */}
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={isLoggingIn ? <CircularProgress size={20} /> : <GoogleIcon />}
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            textTransform: 'none',
                            borderRadius: 2
                        }}
                    >
                        {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
                    </Button>

                    {/* Información adicional */}
                    <Box mt={3}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                        >
                            Al iniciar sesión, aceptas los términos de uso del sistema
                        </Typography>
                    </Box>
                </Paper>

                {/* Footer */}
                <Box mt={3}>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Agro-Track v1.0 - Sistema de gestión agrícola
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;