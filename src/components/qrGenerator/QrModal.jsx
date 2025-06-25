import React, { useState, useRef } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    IconButton,
    Tooltip,
    Divider,
    Chip
} from '@mui/material'
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Share as ShareIcon,
    QrCode as QrIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material'
import QrGenerator from './QrGenerator'

const QrModal = ({ 
    open, 
    onClose, 
    camaId, 
    camaData 
}) => {
    const [qrSize, setQrSize] = useState(256)
    const [errorLevel, setErrorLevel] = useState('M')
    const [showInfo, setShowInfo] = useState(true)
    const [message, setMessage] = useState(null)
    const qrRef = useRef()

    // Tamaños predefinidos
    const sizeOptions = [
        { value: 128, label: 'Pequeño (128px)', desc: 'Para documentos' },
        { value: 256, label: 'Mediano (256px)', desc: 'Estándar' },
        { value: 384, label: 'Grande (384px)', desc: 'Para carteles' },
        { value: 512, label: 'Extra Grande (512px)', desc: 'Para impresión' }
    ]

    // Niveles de corrección de errores
    const errorLevels = [
        { value: 'L', label: 'Bajo (L)', desc: '~7%' },
        { value: 'M', label: 'Medio (M)', desc: '~15%' },
        { value: 'Q', label: 'Alto (Q)', desc: '~25%' },
        { value: 'H', label: 'Máximo (H)', desc: '~30%' }
    ]

    // Convertir SVG a imagen y descargar
    const downloadQR = async (format = 'png') => {
        try {
            const svgElement = qrRef.current?.querySelector('svg')
            if (!svgElement) {
                throw new Error('No se encontró el código QR')
            }

            // Crear canvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const svgData = new XMLSerializer().serializeToString(svgElement)
            
            // Configurar canvas
            canvas.width = qrSize + 40 // Margen extra
            canvas.height = qrSize + 40
            
            // Fondo blanco
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Crear imagen del SVG
            const img = new Image()
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)
            
            img.onload = () => {
                // Centrar QR en canvas
                const x = (canvas.width - qrSize) / 2
                const y = (canvas.height - qrSize) / 2
                ctx.drawImage(img, x, y, qrSize, qrSize)
                
                // Descargar
                canvas.toBlob((blob) => {
                    const link = document.createElement('a')
                    link.download = `agro-track-cama-${camaId}-qr.${format}`
                    link.href = URL.createObjectURL(blob)
                    link.click()
                    
                    // Limpiar
                    URL.revokeObjectURL(link.href)
                    URL.revokeObjectURL(url)
                    
                    setMessage({ type: 'success', text: `QR descargado como ${format.toUpperCase()}` })
                }, `image/${format}`)
            }
            
            img.src = url
        } catch (error) {
            console.error('Error descargando QR:', error)
            setMessage({ type: 'error', text: 'Error al descargar el código QR' })
        }
    }

    // Imprimir QR
    const printQR = () => {
        const printWindow = window.open('', '_blank')
        const qrContainer = qrRef.current
        
        if (!qrContainer) {
            setMessage({ type: 'error', text: 'Error al preparar impresión' })
            return
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Código QR - Cama ${camaId}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }
                    .qr-container {
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .header {
                        margin-bottom: 20px;
                        padding: 15px;
                        background: #4CAF50;
                        color: white;
                        border-radius: 8px;
                    }
                    .qr-code {
                        margin: 20px 0;
                        padding: 20px;
                        background: white;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        display: inline-block;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="header">
                        <h1>🌱 Agro-Track</h1>
                        <h2>${camaData?.nombrePlanta || 'Cama de Cultivo'}</h2>
                        <p>Cama ${camaId} • ${camaData?.cantidadPlantas || 0} plantas</p>
                    </div>
                    <div class="qr-code">
                        ${qrContainer.innerHTML}
                    </div>
                    <div class="footer">
                        <p>Escanea este código QR para acceder a la información completa de la cama</p>
                        <p>URL: ${window.location.origin}/cama/${camaId}</p>
                        <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
            </body>
            </html>
        `
        
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
        
        setMessage({ type: 'success', text: 'Código QR enviado a imprimir' })
    }

    // Compartir URL
    const shareQR = async () => {
        const url = `${window.location.origin}/cama/${camaId}`
        const shareData = {
            title: `Cama ${camaId} - ${camaData?.nombrePlanta || 'Agro-Track'}`,
            text: `Información de la cama de cultivo ${camaId}`,
            url: url
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
                setMessage({ type: 'success', text: 'Enlace compartido exitosamente' })
            } else {
                // Fallback: copiar al portapapeles
                await navigator.clipboard.writeText(url)
                setMessage({ type: 'success', text: 'Enlace copiado al portapapeles' })
            }
        } catch (error) {
            console.error('Error compartiendo:', error)
            setMessage({ type: 'error', text: 'Error al compartir' })
        }
    }

    // Copiar URL
    const copyUrl = async () => {
        try {
            const url = `${window.location.origin}/cama/${camaId}`
            await navigator.clipboard.writeText(url)
            setMessage({ type: 'success', text: 'URL copiada al portapapeles' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al copiar URL' })
        }
    }

    const handleClose = () => {
        setMessage(null)
        onClose()
    }

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QrIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Código QR - Cama {camaId}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                {camaData && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip 
                            label={camaData.nombrePlanta} 
                            color="primary" 
                            size="small" 
                        />
                        <Chip 
                            label={`${camaData.cantidadPlantas} plantas`} 
                            variant="outlined" 
                            size="small" 
                        />
                    </Stack>
                )}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Mensaje de estado */}
                {message && (
                    <Alert 
                        severity={message.type} 
                        sx={{ mb: 3 }}
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Panel de configuración */}
                    <Box sx={{ minWidth: 280 }}>
                        <Typography variant="h6" gutterBottom>
                            ⚙️ Configuración
                        </Typography>
                        
                        <Stack spacing={3}>
                            {/* Tamaño */}
                            <FormControl fullWidth>
                                <InputLabel>Tamaño del QR</InputLabel>
                                <Select
                                    value={qrSize}
                                    label="Tamaño del QR"
                                    onChange={(e) => setQrSize(e.target.value)}
                                >
                                    {sizeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box>
                                                <Typography variant="body2">
                                                    {option.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.desc}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Nivel de corrección de errores */}
                            <FormControl fullWidth>
                                <InputLabel>Corrección de errores</InputLabel>
                                <Select
                                    value={errorLevel}
                                    label="Corrección de errores"
                                    onChange={(e) => setErrorLevel(e.target.value)}
                                >
                                    {errorLevels.map((level) => (
                                        <MenuItem key={level.value} value={level.value}>
                                            <Box>
                                                <Typography variant="body2">
                                                    {level.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {level.desc} de recuperación
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Mostrar información */}
                            <Box>
                                <Typography variant="body2" gutterBottom>
                                    Mostrar información
                                </Typography>
                                <ToggleButtonGroup
                                    value={showInfo}
                                    exclusive
                                    onChange={(e, value) => value !== null && setShowInfo(value)}
                                    size="small"
                                    fullWidth
                                >
                                    <ToggleButton value={true}>
                                        Con info
                                    </ToggleButton>
                                    <ToggleButton value={false}>
                                        Solo QR
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                    {/* Vista previa del QR */}
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            👁️ Vista Previa
                        </Typography>
                        
                        <QrGenerator
                            ref={qrRef}
                            camaId={camaId}
                            camaData={camaData}
                            size={Math.min(qrSize, 384)} // Limitar tamaño en modal
                            level={errorLevel}
                            showInfo={showInfo}
                        />
                    </Box>
                </Box>
            </DialogContent>

            {/* Acciones */}
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    {/* Copiar URL */}
                    <Tooltip title="Copiar enlace">
                        <Button
                            variant="outlined"
                            startIcon={<CopyIcon />}
                            onClick={copyUrl}
                            sx={{ textTransform: 'none' }}
                        >
                            Copiar URL
                        </Button>
                    </Tooltip>

                    {/* Compartir */}
                    <Tooltip title="Compartir enlace">
                        <Button
                            variant="outlined"
                            startIcon={<ShareIcon />}
                            onClick={shareQR}
                            sx={{ textTransform: 'none' }}
                        >
                            Compartir
                        </Button>
                    </Tooltip>

                    {/* Imprimir */}
                    <Tooltip title="Imprimir QR">
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={printQR}
                            sx={{ textTransform: 'none' }}
                        >
                            Imprimir
                        </Button>
                    </Tooltip>

                    {/* Descargar */}
                    <Tooltip title="Descargar como PNG">
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => downloadQR('png')}
                            sx={{ textTransform: 'none' }}
                        >
                            Descargar
                        </Button>
                    </Tooltip>
                </Stack>
            </DialogActions>
        </Dialog>
    )
}

export default QrModal