import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Avatar,
    Chip,
    Stack,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import {
    MoreVert as MoreIcon,
    Check as ActivateIcon,
    Block as DeactivateIcon,
    AdminPanelSettings as AdminIcon,
    Person as UserIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material'
import { adminUserService } from '../../firebase/firebaseService'

const UserCard = ({ 
    user, 
    onStatusChange,
    onAdminToggle,
    loading,
    currentAdminEmail,
    isCurrentUser
}) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const [actionDialog, setActionDialog] = useState({ open: false, type: '', data: {} })

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleAction = (type, data = {}) => {
        setActionDialog({ open: true, type, data })
        handleMenuClose()
    }

    const handleConfirmAction = async () => {
        const { type, data } = actionDialog
        
        switch (type) {
            case 'activate':
                await onStatusChange(user.id, 'active')
                break
            case 'deactivate':
                await onStatusChange(user.id, 'deactivated', data.reason || '')
                break
            case 'toggle_admin':
                await onAdminToggle(user.id, !user.isAdmin)
                break
        }
        
        setActionDialog({ open: false, type: '', data: {} })
    }

    const handleReasonChange = (reason) => {
        setActionDialog(prev => ({
            ...prev,
            data: { ...prev.data, reason }
        }))
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success'
            case 'pending_approval': return 'warning'
            case 'deactivated': return 'error'
            default: return 'default'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Activo'
            case 'pending_approval': return 'Pendiente'
            case 'deactivated': return 'Desactivado'
            default: return 'Desconocido'
        }
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    return (
        <Card elevation={1} sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Información del usuario */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Avatar 
                            sx={{ 
                                bgcolor: user.isAdmin ? 'secondary.main' : 'primary.main',
                                width: 48, 
                                height: 48 
                            }}
                        >
                            {user.isAdmin ? <AdminIcon /> : <UserIcon />}
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6">
                                    {user.name}
                                </Typography>
                                {isCurrentUser && (
                                    <Chip label="Tú" size="small" color="primary" />
                                )}
                                {user.isAdmin && (
                                    <Chip 
                                        label="Admin" 
                                        size="small" 
                                        color="secondary" 
                                        icon={<AdminIcon />}
                                    />
                                )}
                            </Box>
                            
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                </Typography>
                            </Stack>
                            
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TimeIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        Último acceso: {formatDate(user.lastLogin)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Estado y acciones */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <Chip 
                            label={getStatusLabel(user.status)} 
                            color={getStatusColor(user.status)}
                            size="small"
                        />
                        
                        {!isCurrentUser && (
                            <Tooltip title="Acciones de usuario">
                                <IconButton
                                    onClick={handleMenuOpen}
                                    disabled={loading}
                                    size="small"
                                >
                                    <MoreIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* Menu de acciones */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {user.status === 'active' ? (
                        <MenuItem onClick={() => handleAction('deactivate')}>
                            <ListItemIcon>
                                <DeactivateIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText>Desactivar usuario</ListItemText>
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={() => handleAction('activate')}>
                            <ListItemIcon>
                                <ActivateIcon fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText>Activar usuario</ListItemText>
                        </MenuItem>
                    )}
                    
                    <MenuItem onClick={() => handleAction('toggle_admin')}>
                        <ListItemIcon>
                            <AdminIcon fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText>
                            {user.isAdmin ? 'Quitar admin' : 'Hacer admin'}
                        </ListItemText>
                    </MenuItem>
                </Menu>

                {/* Dialog de confirmación */}
                <Dialog 
                    open={actionDialog.open} 
                    onClose={() => setActionDialog({ open: false, type: '', data: {} })}
                    maxWidth="sm" 
                    fullWidth
                >
                    <DialogTitle>
                        {actionDialog.type === 'activate' && '✅ Activar Usuario'}
                        {actionDialog.type === 'deactivate' && '🚫 Desactivar Usuario'}
                        {actionDialog.type === 'toggle_admin' && `${user.isAdmin ? '👤' : '👨‍💼'} Cambiar Permisos`}
                    </DialogTitle>
                    <DialogContent>
                        {actionDialog.type === 'activate' && (
                            <Typography>
                                ¿Confirmas que deseas activar a <strong>{user.email}</strong>?
                            </Typography>
                        )}
                        
                        {actionDialog.type === 'deactivate' && (
                            <Box>
                                <Typography gutterBottom>
                                    ¿Confirmas que deseas desactivar a <strong>{user.email}</strong>?
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Razón (opcional)"
                                    value={actionDialog.data.reason || ''}
                                    onChange={(e) => handleReasonChange(e.target.value)}
                                    sx={{ mt: 2 }}
                                />
                            </Box>
                        )}
                        
                        {actionDialog.type === 'toggle_admin' && (
                            <Typography>
                                ¿Confirmas que deseas {user.isAdmin ? 'quitar' : 'otorgar'} permisos de administrador a <strong>{user.email}</strong>?
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setActionDialog({ open: false, type: '', data: {} })}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained"
                            onClick={handleConfirmAction}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : null}
                        >
                            {loading ? 'Procesando...' : 'Confirmar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    )
}

const AllUsersPanel = ({ onUserAction, currentAdminEmail }) => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const result = await adminUserService.getAllUsers()
            
            if (result.success) {
                setUsers(result.data)
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cargar usuarios' })
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (uid, status, reason = '') => {
        try {
            setActionLoading(true)
            let result
            
            if (status === 'active') {
                result = await adminUserService.reactivateUser(uid, currentAdminEmail)
            } else {
                result = await adminUserService.deactivateUser(uid, currentAdminEmail, reason)
            }
            
            if (result.success) {
                setMessage({ type: 'success', text: result.message })
                loadUsers()
                onUserAction()
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cambiar estado del usuario' })
        } finally {
            setActionLoading(false)
        }
    }

    const handleAdminToggle = async (uid, isAdmin) => {
        try {
            setActionLoading(true)
            const result = await adminUserService.toggleAdminPermission(uid, isAdmin, currentAdminEmail)
            
            if (result.success) {
                setMessage({ type: 'success', text: result.message })
                loadUsers()
                onUserAction()
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cambiar permisos' })
        } finally {
            setActionLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        if (filterStatus === 'all') return true
        return user.status === filterStatus
    })

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    👥 Gestión de Usuarios
                </Typography>
                
                <Stack direction="row" spacing={1}>
                    {['all', 'active', 'pending_approval', 'deactivated'].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => setFilterStatus(status)}
                            sx={{ textTransform: 'none' }}
                        >
                            {status === 'all' ? 'Todos' : 
                             status === 'active' ? 'Activos' :
                             status === 'pending_approval' ? 'Pendientes' : 'Desactivados'}
                        </Button>
                    ))}
                </Stack>
            </Box>
            
            {message && (
                <Alert 
                    severity={message.type} 
                    sx={{ mb: 2 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} 
                {filterStatus !== 'all' && ` ${filterStatus === 'active' ? 'activos' : 
                                                filterStatus === 'pending_approval' ? 'pendientes' : 'desactivados'}`}
            </Typography>

            {filteredUsers.length === 0 ? (
                <Alert severity="info">
                    No hay usuarios que coincidan con el filtro seleccionado.
                </Alert>
            ) : (
                filteredUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onStatusChange={handleStatusChange}
                        onAdminToggle={handleAdminToggle}
                        loading={actionLoading}
                        currentAdminEmail={currentAdminEmail}
                        isCurrentUser={user.email === currentAdminEmail}
                    />
                ))
            )}
        </Box>
    )
}

export default AllUsersPanel