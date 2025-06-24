import React from 'react'
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Box,
    LinearProgress
} from '@mui/material'
import {
    People as PeopleIcon,
    CheckCircle as ActiveIcon,
    HourglassEmpty as PendingIcon,
    Block as BlockedIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material'

const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary', 
    subtitle, 
    progress 
}) => (
    <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color={`${color}.main`}>
                        {value}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                
                <Avatar 
                    sx={{ 
                        bgcolor: `${color}.main`, 
                        width: 56, 
                        height: 56,
                        boxShadow: 2
                    }}
                >
                    {icon}
                </Avatar>
            </Box>
            
            {progress !== undefined && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        color={color}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {progress.toFixed(1)}% del total
                    </Typography>
                </Box>
            )}
        </CardContent>
    </Card>
)

const UserStatsCards = ({ stats, pendingCount, onRefresh }) => {
    if (!stats) return null

    const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0
    const pendingPercentage = stats.total > 0 ? (pendingCount / stats.total) * 100 : 0
    const adminPercentage = stats.total > 0 ? (stats.admins / stats.total) * 100 : 0

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Total de usuarios */}
            <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                    title="Total Usuarios"
                    value={stats.total}
                    icon={<PeopleIcon />}
                    color="primary"
                    subtitle="Registrados en el sistema"
                />
            </Grid>

            {/* Usuarios activos */}
            <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                    title="Activos"
                    value={stats.active}
                    icon={<ActiveIcon />}
                    color="success"
                    subtitle="Con acceso completo"
                    progress={activePercentage}
                />
            </Grid>

            {/* Usuarios pendientes */}
            <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                    title="Pendientes"
                    value={pendingCount}
                    icon={<PendingIcon />}
                    color="warning"
                    subtitle="Esperando aprobación"
                    progress={pendingPercentage}
                />
            </Grid>

            {/* Usuarios desactivados */}
            <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                    title="Desactivados"
                    value={stats.deactivated}
                    icon={<BlockedIcon />}
                    color="error"
                    subtitle="Sin acceso al sistema"
                />
            </Grid>

            {/* Administradores */}
            <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                    title="Administradores"
                    value={stats.admins}
                    icon={<AdminIcon />}
                    color="secondary"
                    subtitle="Con permisos elevados"
                    progress={adminPercentage}
                />
            </Grid>
        </Grid>
    )
}

export default UserStatsCards