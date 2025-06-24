import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    Grid,
    Stack,
    Alert,
    CircularProgress,
    Button,
    Divider,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material'
import {
    LocalFlorist as PlantIcon,
    Numbers as NumberIcon,
    Grass as SeedIcon,
    Layers as SubstrateIcon,
    Straighten as SizeIcon,
    AccessTime as TimeIcon,
    Home as HomeIcon,
    Share as ShareIcon,
    QrCode as QrIcon,
    Info as InfoIcon
} from '@mui/icons-material'
import { camasService } from '../../firebase/firebaseService'

const InfoCard = ({ icon, title, value, subtitle, color = 'primary' }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Avatar 
                sx={{ 
                    bgcolor: `${color}.main`, 
                    width: 56, 
                    height: 56, 
                    mx: 'auto', 
                    mb: 2 
                }}
            >
                {icon}
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
                {value}
            </Typography>
            <Typography variant="h6" color="text.primary" gutterBottom>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </CardContent>
    </Card>
)

const CamaViewer = () => {
    const { camaId } = useParams()
    const navigate = useNavigate()
    const [camaData, setCamaData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadCamaData()
    }, [camaId])

    const loadCamaData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            if (!camaId) {
                setError("ID de cama no proporcionado")
                return
            }

            const result = await camasService.getCama(camaId)
            
            if (result.success) {
                setCamaData(result.data)
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

    const handleShare = async () => {
        const url = window.location.href
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Cama ${camaId} - ${camaData?.nombrePlanta || 'Agro-Track'}`,
                    text: `Información de la cama de cultivo ${camaId}`,
                    url: url
                })
            } catch (error) {
                console.log('Error sharing:', error)
                copyToClipboard(url)
            }
        } else {
            copyToClipboard(url)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Aquí podrías mostrar un toast o notificación
            console.log('URL copiada al portapapeles')
        })
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'No disponible'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
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
                <Card elevation={8} sx={{ p: 4, borderRadius: 3 }}>
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress size={48} color="primary" />
                        <Typography variant="h6" color="text.secondary">
                            Cargando información de la cama...
                        </Typography>
                    </Stack>
                </Card>
            </Box>
        )
    }

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Container maxWidth="sm">
                    <Card elevation={8} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Avatar 
                                sx={{ 
                                    bgcolor: 'error.main', 
                                    width: 64, 
                                    height: 64, 
                                    mx: 'auto', 
                                    mb: 2 
                                }}
                            >
                                <InfoIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="error.main" gutterBottom>
                                Cama no encontrada
                            </Typography>
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                La cama con ID "<strong>{camaId}</strong>" no existe o ha sido eliminada.
                            </Typography>
                            <Stack direction="row" spacing={2} justifyContent="center">
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
                                    onClick={loadCamaData}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Reintentar
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
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
            <Container maxWidth="lg">
                {/* Header */}
                <Card elevation={8} sx={{ mb: 4, borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar 
                                    sx={{ 
                                        bgcolor: 'primary.main', 
                                        width: 64, 
                                        height: 64 
                                    }}
                                >
                                    <PlantIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                                        {camaData.nombrePlanta}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                        <Chip 
                                            icon={<QrIcon />}
                                            label={`Cama ${camaId}`} 
                                            color="primary" 
                                            variant="outlined"
                                        />
                                        <Chip 
                                            label="Vista Pública" 
                                            color="success" 
                                            size="small"
                                        />
                                    </Stack>
                                </Box>
                            </Box>
                            
                            <Stack direction="row" spacing={1}>
                                <Tooltip title="Compartir">
                                    <IconButton 
                                        onClick={handleShare}
                                        sx={{ 
                                            bgcolor: 'primary.light',
                                            color: 'primary.contrastText',
                                            '&:hover': { bgcolor: 'primary.main' }
                                        }}
                                    >
                                        <ShareIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Ir al inicio">
                                    <IconButton 
                                        onClick={() => navigate('/')}
                                        sx={{ 
                                            bgcolor: 'secondary.light',
                                            color: 'secondary.contrastText',
                                            '&:hover': { bgcolor: 'secondary.main' }
                                        }}
                                    >
                                        <HomeIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>
                        
                        <Typography variant="body1" color="text.secondary">
                            📱 Esta página es accesible públicamente a través del código QR de la cama
                        </Typography>
                    </CardContent>
                </Card>

                {/* Información principal */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard
                            icon={<NumberIcon />}
                            title="Plantas"
                            value={camaData.cantidadPlantas}
                            subtitle="Cantidad total"
                            color="primary"
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard
                            icon={<SeedIcon />}
                            title="Esquejes"
                            value={camaData.esquejes}
                            subtitle="Cantidad preparada"
                            color="secondary"
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard
                            icon={<SubstrateIcon />}
                            title="Sustrato"
                            value={camaData.sustrato}
                            subtitle="Tipo de sustrato"
                            color="success"
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard
                            icon={<SizeIcon />}
                            title="Tarro"
                            value={`${camaData.tarroSize} ${camaData.tarroUnidad}`}
                            subtitle="Tamaño del contenedor"
                            color="info"
                        />
                    </Grid>
                </Grid>

                {/* Información detallada */}
                <Card elevation={8} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            📋 Información Detallada
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        🌱 Detalles de Cultivo
                                    </Typography>
                                    
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Nombre de la planta
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaData.nombrePlanta}
                                            </Typography>
                                        </Box>
                                        
                                        <Divider />
                                        
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Cantidad de plantas
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaData.cantidadPlantas} unidades
                                            </Typography>
                                        </Box>
                                        
                                        <Divider />
                                        
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Esquejes disponibles
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaData.esquejes} unidades
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="h6" color="secondary" gutterBottom>
                                        🏺 Especificaciones Técnicas
                                    </Typography>
                                    
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Tipo de sustrato
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaData.sustrato}
                                            </Typography>
                                        </Box>
                                        
                                        <Divider />
                                        
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Tamaño del tarro
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaData.tarroSize} {camaData.tarroUnidad}
                                            </Typography>
                                        </Box>
                                        
                                        <Divider />
                                        
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                ID de la cama
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {camaId}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Información de timestamps */}
                        {(camaData.createdAt || camaData.updatedAt) && (
                            <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', borderRadius: 2 }}>
                                <Typography variant="h6" color="info.dark" gutterBottom>
                                    <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Historial
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    {camaData.createdAt && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Fecha de creación
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatDate(camaData.createdAt)}
                                            </Typography>
                                        </Grid>
                                    )}
                                    
                                    {camaData.updatedAt && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Última actualización
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatDate(camaData.updatedAt)}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        🌱 Powered by Agro-Track • Sistema de gestión de cultivos
                    </Typography>
                </Box>
            </Container>
        </Box>
    )
}

export default CamaViewer