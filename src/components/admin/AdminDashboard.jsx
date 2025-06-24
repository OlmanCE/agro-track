import React, { useState, useEffect } from 'react'
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Alert,
    CircularProgress,
    Tab,
    Tabs,
    Badge,
    Stack,
    Avatar,
    Divider
} from '@mui/material'
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    HourglassEmpty as PendingIcon,
    CheckCircle as ActiveIcon,
    Block as BlockIcon,
    AdminPanelSettings as AdminIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { adminUserService } from '../../firebase/firebaseService'
import PendingUsersPanel from './PendingUsersPanel'
import AllUsersPanel from './AllUsersPanel'
import UserStatsCards from './UserStatsCards'

const AdminDashboard = () => {
    const { user, userName } = useAuth()
    const [activeTab, setActiveTab] = useState(0)
    const [stats, setStats] = useState(null)
    const [pendingUsers, setPendingUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Cargar datos iniciales
    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Cargar estadísticas y usuarios pendientes en paralelo
            const [statsResult, pendingResult] = await Promise.all([
                adminUserService.getUserStats(),
                adminUserService.getPendingUsers()
            ])

            if (statsResult.success) {
                setStats(statsResult.data)
            } else {
                throw new Error(statsResult.error)
            }

            if (pendingResult.success) {
                setPendingUsers(pendingResult.data)
            } else {
                throw new Error(pendingResult.error)
            }

        } catch (error) {
            console.error("❌ Error cargando dashboard:", error)
            setError("Error al cargar datos del dashboard")
        } finally {
            setLoading(false)
        }
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const handleRefresh = () => {
        loadDashboardData()
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress size={48} />
            </Box>
        )
    }

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                <DashboardIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h4" component="h1" fontWeight="bold">
                                    Panel de Administración
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Bienvenido, {userName} 👋
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            Actualizar
                        </Button>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>

                {/* Estadísticas */}
                {stats && (
                    <UserStatsCards 
                        stats={stats} 
                        pendingCount={pendingUsers.length}
                        onRefresh={handleRefresh}
                    />
                )}

                {/* Navegación por pestañas */}
                <Card sx={{ mb: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={handleTabChange}
                            variant="fullWidth"
                        >
                            <Tab 
                                icon={
                                    <Badge badgeContent={pendingUsers.length} color="warning">
                                        <PendingIcon />
                                    </Badge>
                                } 
                                label="Usuarios Pendientes"
                                sx={{ textTransform: 'none' }}
                            />
                            <Tab 
                                icon={<PeopleIcon />} 
                                label="Todos los Usuarios"
                                sx={{ textTransform: 'none' }}
                            />
                            <Tab 
                                icon={<DashboardIcon />} 
                                label="Gestión de Camas"
                                sx={{ textTransform: 'none' }}
                            />
                        </Tabs>
                    </Box>

                    {/* Contenido de las pestañas */}
                    <Box sx={{ p: 3 }}>
                        {activeTab === 0 && (
                            <PendingUsersPanel 
                                pendingUsers={pendingUsers}
                                onUserAction={loadDashboardData}
                                currentAdminEmail={user?.email}
                            />
                        )}
                        
                        {activeTab === 1 && (
                            <AllUsersPanel 
                                onUserAction={loadDashboardData}
                                currentAdminEmail={user?.email}
                            />
                        )}
                        
                        {activeTab === 2 && (
                            <Box textAlign="center" py={4}>
                                <Typography variant="h6" color="text.secondary">
                                    🌱 Gestión de Camas
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Esta sección estará disponible próximamente
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Card>

                {/* Footer informativo */}
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            💡 Guía rápida del administrador
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2">
                                    <strong>Usuarios Pendientes:</strong> Aprobar o rechazar nuevos registros
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2">
                                    <strong>Gestión de Usuarios:</strong> Activar/desactivar y cambiar permisos
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2">
                                    <strong>Gestión de Camas:</strong> Crear, editar y generar códigos QR
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}

export default AdminDashboard