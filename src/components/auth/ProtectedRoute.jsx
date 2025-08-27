// src/components/auth/ProtectedRoute.jsx
import { useAuth } from '../../hooks/useAuth.jsx';
import { Navigate } from 'react-router-dom';
import {
    Container,
    Box,
    CircularProgress,
    Typography,
    Alert
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Componente para proteger rutas que requieren autenticación
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar si está autenticado
 * @param {boolean} props.requireAdmin - Si la ruta requiere permisos de administrador
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, loading, isAuthenticated, isAdmin } = useAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                        Verificando autenticación...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si requiere admin pero el usuario no es admin
    if (requireAdmin && !isAdmin) {
        return (
            <Container maxWidth="md">
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                    textAlign="center"
                >
                    <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />

                    <Typography variant="h4" gutterBottom color="error">
                        Acceso Denegado
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        No tienes permisos de administrador para acceder a esta página.
                    </Typography>

                    <Alert severity="info" sx={{ maxWidth: 500 }}>
                        <Typography variant="body2">
                            <strong>Usuario actual:</strong> {user?.email}
                            <br />
                            <strong>Rol:</strong> Usuario estándar
                            <br />
                            <br />
                            Si necesitas acceso de administrador, contacta con el administrador del sistema.
                        </Typography>
                    </Alert>

                    <Box mt={3}>
                        <Typography variant="caption" color="text.secondary">
                            Puedes regresar al inicio o cerrar sesión desde el menú
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    // Si todo está bien, mostrar el contenido protegido
    return (
        <>
            {/* Opcional: Mostrar indicador de usuario admin en desarrollo */}
            {process.env.NODE_ENV === 'development' && isAdmin && (
                <Box
                    sx={{
                        backgroundColor: 'success.light',
                        color: 'success.contrastText',
                        textAlign: 'center',
                        py: 0.5,
                        fontSize: '0.8rem'
                    }}
                >
                    <SecurityIcon sx={{ fontSize: 16, mr: 1 }} />
                    Modo Administrador - {user?.email}
                </Box>
            )}

            {children}
        </>
    );
};

export default ProtectedRoute;