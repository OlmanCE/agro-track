import React, { useState } from 'react'
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
    FormControlLabel,
    Switch,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material'
import {
    Check as ApproveIcon,
    Close as RejectIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material'
import { adminUserService } from '../../firebase/firebaseService'

const PendingUserCard = ({ 
    user, 
    onApprove, 
    onReject, 
    loading, 
    currentAdminEmail 
}) => {
    const [approveDialog, setApproveDialog] = useState(false)
    const [rejectDialog, setRejectDialog] = useState(false)
    const [makeAdmin, setMakeAdmin] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    const handleApprove = async () => {
        await onApprove(user.id, makeAdmin)
        setApproveDialog(false)
        setMakeAdmin(false)
    }

    const handleReject = async () => {
        await onReject(user.id, rejectReason || "No especificado")
        setRejectDialog(false)
        setRejectReason('')
    }

    const formatDate = (date) => {
        if (!date) return 'Fecha no disponible'
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
                        <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                            <PersonIcon />
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                {user.name}
                            </Typography>
                            
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                </Typography>
                            </Stack>
                            
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    Solicitado: {formatDate(user.createdAt)}
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Estado y acciones */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <Chip 
                            label="Pendiente de Aprobación" 
                            color="warning" 
                            variant="outlined"
                            size="small"
                        />
                        
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Aprobar usuario">
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    startIcon={<ApproveIcon />}
                                    onClick={() => setApproveDialog(true)}
                                    disabled={loading}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Aprobar
                                </Button>
                            </Tooltip>
                            
                            <Tooltip title="Rechazar usuario">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<RejectIcon />}
                                    onClick={() => setRejectDialog(true)}
                                    disabled={loading}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Rechazar
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Box>
                </Box>

                {/* Dialog de aprobación */}
                <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        ✅ Aprobar Usuario
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" gutterBottom>
                            ¿Confirmas que deseas aprobar el acceso para <strong>{user.email}</strong>?
                        </Typography>
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={makeAdmin}
                                    onChange={(e) => setMakeAdmin(e.target.checked)}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AdminIcon fontSize="small" />
                                    <Typography>Otorgar permisos de administrador</Typography>
                                </Box>
                            }
                            sx={{ mt: 2 }}
                        />
                        
                        {makeAdmin && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                <strong>⚠️ Atención:</strong> Los administradores pueden gestionar todos los usuarios y camas del sistema.
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setApproveDialog(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success"
                            onClick={handleApprove}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <ApproveIcon />}
                        >
                            {loading ? 'Aprobando...' : 'Aprobar Usuario'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog de rechazo */}
                <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        ❌ Rechazar Usuario
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" gutterBottom>
                            ¿Confirmas que deseas rechazar el acceso para <strong>{user.email}</strong>?
                        </Typography>
                        
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Razón del rechazo (opcional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ej: No cumple con los requisitos, cuenta duplicada, etc."
                            sx={{ mt: 2 }}
                        />
                        
                        <Alert severity="error" sx={{ mt: 2 }}>
                            <strong>⚠️ Atención:</strong> Esta acción eliminará permanentemente la cuenta del usuario.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRejectDialog(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error"
                            onClick={handleReject}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <RejectIcon />}
                        >
                            {loading ? 'Rechazando...' : 'Rechazar Usuario'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    )
}

const PendingUsersPanel = ({ pendingUsers, onUserAction, currentAdminEmail }) => {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const handleApprove = async (uid, isAdmin = false) => {
        try {
            setLoading(true)
            const result = await adminUserService.approveUser(uid, currentAdminEmail, isAdmin)
            
            if (result.success) {
                setMessage({ type: 'success', text: result.message })
                onUserAction() // Refrescar datos
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al aprobar usuario' })
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (uid, reason) => {
        try {
            setLoading(true)
            const result = await adminUserService.rejectUser(uid, currentAdminEmail, reason)
            
            if (result.success) {
                setMessage({ type: 'success', text: result.message })
                onUserAction() // Refrescar datos
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al rechazar usuario' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                👥 Usuarios Pendientes de Aprobación
            </Typography>
            
            {message && (
                <Alert 
                    severity={message.type} 
                    sx={{ mb: 2 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            {pendingUsers.length === 0 ? (
                <Alert severity="info">
                    🎉 <strong>¡Excelente!</strong> No hay usuarios pendientes de aprobación.
                </Alert>
            ) : (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {pendingUsers.length} usuario{pendingUsers.length !== 1 ? 's' : ''} esperando aprobación
                    </Typography>
                    
                    {pendingUsers.map((user) => (
                        <PendingUserCard
                            key={user.id}
                            user={user}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            loading={loading}
                            currentAdminEmail={currentAdminEmail}
                        />
                    ))}
                </>
            )}
        </Box>
    )
}

export default PendingUsersPanel