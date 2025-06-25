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
    Refresh as RefreshIcon,
    Add as AddIcon,
    LocalFlorist as PlantIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    QrCode as QrIcon
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { adminUserService, camasService } from '../../firebase/firebaseService'
import { useNavigate } from 'react-router-dom'
import PendingUsersPanel from './PendingUsersPanel'
import AllUsersPanel from './AllUsersPanel'
import UserStatsCards from './UserStatsCards'
import QrModal from '../qrGenerator/QrModal'

const AdminDashboard = () => {
    const { user, userName } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(0)
    const [stats, setStats] = useState(null)
    const [pendingUsers, setPendingUsers] = useState([])
    const [camas, setCamas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Estados para QR Modal
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [selectedCama, setSelectedCama] = useState(null)

    // Cargar datos iniciales
    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Cargar estadísticas, usuarios pendientes y camas en paralelo
            const [statsResult, pendingResult, camasResult] = await Promise.all([
                adminUserService.getUserStats(),
                adminUserService.getPendingUsers(),
                camasService.getAllCamas()
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

            if (camasResult.success) {
                setCamas(camasResult.data)
            } else {
                console.error("Error cargando camas:", camasResult.error)
                // No lanzamos error para camas, es opcional
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

    // Manejar apertura de QR modal
    const handleOpenQrModal = (cama) => {
        setSelectedCama(cama)
        setQrModalOpen(true)
    }

    // Cerrar QR modal
    const handleCloseQrModal = () => {
        setQrModalOpen(false)
        setSelectedCama(null)
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
                            <Box>
                                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                    <Typography variant="h6">
                                        🌱 Gestión de Camas de Cultivo
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/admin/cama/nueva')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Nueva Cama
                                    </Button>
                                </Stack>

                                {/* Resumen de camas */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={4}>
                                        <Card elevation={2}>
                                            <CardContent sx={{ textAlign: 'center' }}>
                                                <Typography variant="h3" color="primary.main" fontWeight="bold">
                                                    {camas.length}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    Camas registradas
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card elevation={2}>
                                            <CardContent sx={{ textAlign: 'center' }}>
                                                <Typography variant="h3" color="success.main" fontWeight="bold">
                                                    {camas.reduce((sum, cama) => sum + (cama.cantidadPlantas || 0), 0)}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    Total de plantas
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card elevation={2}>
                                            <CardContent sx={{ textAlign: 'center' }}>
                                                <Typography variant="h3" color="secondary.main" fontWeight="bold">
                                                    {new Set(camas.map(cama => cama.nombrePlanta)).size}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    Tipos de plantas
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {/* Lista de camas */}
                                {camas.length === 0 ? (
                                    <Alert severity="info" sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" gutterBottom>
                                            🌱 ¡Comienza creando tu primera cama!
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            No hay camas registradas en el sistema.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => navigate('/admin/cama/nueva')}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Crear Primera Cama
                                        </Button>
                                    </Alert>
                                ) : (
                                    <Stack spacing={2}>
                                        {camas.map((cama) => (
                                            <Card key={cama.id} elevation={1}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                <PlantIcon />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="h6">
                                                                    {cama.nombrePlanta}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    ID: {cama.id} • {cama.cantidadPlantas} plantas • {cama.sustrato}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                                    <Chip 
                                                                        size="small" 
                                                                        label={`${cama.tarroSize} ${cama.tarroUnidad}`} 
                                                                        color="secondary" 
                                                                        variant="outlined" 
                                                                    />
                                                                    <Chip 
                                                                        size="small" 
                                                                        label={`${cama.esquejes} esquejes`} 
                                                                        color="success" 
                                                                        variant="outlined" 
                                                                    />
                                                                </Stack>
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<ViewIcon />}
                                                                onClick={() => window.open(`/cama/${cama.id}`, '_blank')}
                                                                sx={{ textTransform: 'none' }}
                                                            >
                                                                Ver
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="secondary"
                                                                startIcon={<QrIcon />}
                                                                onClick={() => handleOpenQrModal(cama)}
                                                                sx={{ textTransform: 'none' }}
                                                            >
                                                                QR
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                startIcon={<EditIcon />}
                                                                onClick={() => navigate(`/admin/cama/${cama.id}/editar`)}
                                                                sx={{ textTransform: 'none' }}
                                                            >
                                                                Editar
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
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
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2">
                                    <strong>Usuarios Pendientes:</strong> Aprobar o rechazar nuevos registros
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2">
                                    <strong>Gestión de Usuarios:</strong> Activar/desactivar y cambiar permisos
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2">
                                    <strong>Gestión de Camas:</strong> Crear, editar y generar códigos QR
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="body2">
                                    <strong>Códigos QR:</strong> Generar, descargar e imprimir para cada cama
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* QR Modal */}
                <QrModal
                    open={qrModalOpen}
                    onClose={handleCloseQrModal}
                    camaId={selectedCama?.id}
                    camaData={selectedCama}
                />
            </Container>
        </Box>
    )
}

export default AdminDashboard