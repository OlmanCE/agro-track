import React from 'react'
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Alert,
    Button,
    Stack,
    Avatar,
    Chip
} from '@mui/material'
import {
    HourglassEmpty as PendingIcon,
    Email as EmailIcon,
    AdminPanelSettings as AdminIcon,
    Logout as LogoutIcon
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'

const PendingApprovalPage = () => {
    const { user, logout, refreshUserData } = useAuth()

    const handleRefresh = async () => {
        await refreshUserData()
    }

    const handleContactAdmin = () => {
        const subject = `Solicitud de activación - ${user?.email}`
        const body = `Hola,\n\nMi cuenta está pendiente de aprobación:\n\nEmail: ${user?.email}\nNombre: ${user?.displayName || 'No especificado'}\n\nPor favor, activa mi cuenta para acceder al sistema.\n\nGracias.`
        
        window.location.href = `mailto:admin@agro-track.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 50%, #FFCC02 100%)',
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
                        {/* Icono y título */}
                        <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: 'warning.main',
                                    mb: 1
                                }}
                            >
                                <PendingIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            
                            <Typography
                                variant="h4"
                                component="h1"
                                fontWeight="bold"
                                color="warning.dark"
                                textAlign="center"
                            >
                                Cuenta Pendiente
                            </Typography>
                            
                            <Chip 
                                label="Esperando Aprobación" 
                                color="warning" 
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </Stack>

                        {/* Información del usuario */}
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>Tu cuenta ha sido creada exitosamente</strong>
                            </Typography>
                            <Typography variant="body2">
                                Usuario: {user?.email}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Estado: Pendiente de aprobación por un administrador
                            </Typography>
                        </Alert>

                        {/* Instrucciones */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                ¿Qué sigue?
                            </Typography>
                            
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Typography variant="h6" color="primary">
                                        1.
                                    </Typography>
                                    <Typography variant="body2">
                                        Un administrador revisará tu solicitud de acceso
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Typography variant="h6" color="primary">
                                        2.
                                    </Typography>
                                    <Typography variant="body2">
                                        Recibirás acceso una vez que sea aprobada
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Typography variant="h6" color="primary">
                                        3.
                                    </Typography>
                                    <Typography variant="body2">
                                        Mientras tanto, puedes contactar al administrador si es urgente
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Tiempo estimado */}
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2">
                                <strong>⏱️ Tiempo estimado:</strong> Las aprobaciones suelen procesarse 
                                en 24-48 horas hábiles.
                            </Typography>
                        </Alert>

                        {/* Botones de acción */}
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handleRefresh}
                                sx={{ textTransform: 'none', flex: 1 }}
                            >
                                Verificar Estado
                            </Button>
                            
                            <Button
                                variant="contained"
                                startIcon={<EmailIcon />}
                                onClick={handleContactAdmin}
                                sx={{ textTransform: 'none', flex: 1 }}
                            >
                                Contactar Admin
                            </Button>
                        </Stack>

                        {/* Logout */}
                        <Button
                            variant="text"
                            startIcon={<LogoutIcon />}
                            onClick={logout}
                            fullWidth
                            sx={{ 
                                mt: 2, 
                                textTransform: 'none',
                                color: 'text.secondary'
                            }}
                        >
                            Cerrar Sesión
                        </Button>

                        {/* Footer */}
                        <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                            color="text.disabled"
                            sx={{ mt: 3 }}
                        >
                            Agro-Track - Sistema de Control de Acceso
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}

export default PendingApprovalPage