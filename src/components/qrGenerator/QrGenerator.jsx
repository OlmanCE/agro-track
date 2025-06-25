import React, { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
    Box,
    Typography,
    Paper,
    Stack
} from '@mui/material'
import {
    LocalFlorist as PlantIcon
} from '@mui/icons-material'

const QrGenerator = forwardRef(({ 
    camaId, 
    camaData = null,
    size = 256, 
    level = 'M', // L, M, Q, H
    includeMargin = true,
    showInfo = true,
    baseUrl = window.location.origin // Automático
}, ref) => {
    // Construir URL completa
    const qrUrl = `${baseUrl}/cama/${camaId}`
    
    // Configuración del QR
    const qrConfig = {
        value: qrUrl,
        size: size,
        level: level, // Error correction level
        includeMargin: includeMargin,
        fgColor: '#2E7D32', // Verde oscuro (primary.dark)
        bgColor: '#FFFFFF'
    }

    return (
        <Box ref={ref} sx={{ textAlign: 'center' }}>
            {/* Información de la cama (opcional) */}
            {showInfo && camaData && (
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        borderRadius: 2
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <PlantIcon />
                        <Typography variant="h6" fontWeight="bold">
                            {camaData.nombrePlanta}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Cama {camaId} • {camaData.cantidadPlantas} plantas
                    </Typography>
                </Paper>
            )}

            {/* QR Code */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, 
                    display: 'inline-block',
                    borderRadius: 2,
                    bgcolor: '#ffffff'
                }}
            >
                <QRCodeSVG {...qrConfig} />
            </Paper>

            {/* URL del QR */}
            <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                    mt: 2, 
                    display: 'block',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                }}
            >
                {qrUrl}
            </Typography>
        </Box>
    )
})

QrGenerator.displayName = 'QrGenerator'

export default QrGenerator