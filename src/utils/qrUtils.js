// src/utils/qrUtils.js
/**
 * Utilidades para generar, descargar y manejar códigos QR
 * Agro-Track - Sistema de gestión de camas de cultivo
 */

/**
 * Genera la URL completa para una cama específica
 * @param {string} camaId - ID de la cama
 * @param {string} baseUrl - URL base (opcional, por defecto usa window.location.origin)
 * @returns {string} URL completa
 */
export const generateCamaUrl = (camaId, baseUrl = null) => {
    const base = baseUrl || window.location.origin
    return `${base}/cama/${camaId}`
}

/**
 * Convierte un elemento SVG a imagen y la descarga
 * @param {SVGElement} svgElement - Elemento SVG del QR
 * @param {number} size - Tamaño del QR
 * @param {string} filename - Nombre del archivo
 * @param {string} format - Formato de imagen (png, jpg)
 * @returns {Promise} - Promesa que resuelve cuando la descarga inicia
 */
export const downloadQRImage = (svgElement, size = 256, filename = 'qr-code', format = 'png') => {
    return new Promise((resolve, reject) => {
        try {
            // Crear canvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const margin = 40
            
            // Configurar canvas con margen
            canvas.width = size + margin
            canvas.height = size + margin
            
            // Fondo blanco
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Serializar SVG
            const svgData = new XMLSerializer().serializeToString(svgElement)
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)
            
            // Crear imagen
            const img = new Image()
            img.onload = () => {
                // Centrar QR en canvas
                const x = margin / 2
                const y = margin / 2
                ctx.drawImage(img, x, y, size, size)
                
                // Convertir a blob y descargar
                canvas.toBlob((blob) => {
                    const link = document.createElement('a')
                    link.download = `${filename}.${format}`
                    link.href = URL.createObjectURL(blob)
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    
                    // Limpiar URLs
                    URL.revokeObjectURL(link.href)
                    URL.revokeObjectURL(url)
                    
                    resolve()
                }, `image/${format}`)
            }
            
            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Error al procesar la imagen'))
            }
            
            img.src = url
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Crea contenido HTML para impresión de QR
 * @param {string} camaId - ID de la cama
 * @param {Object} camaData - Datos de la cama
 * @param {string} qrHtml - HTML del QR generado
 * @returns {string} HTML completo para impresión
 */
export const generatePrintHTML = (camaId, camaData, qrHtml) => {
    const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    
    const url = generateCamaUrl(camaId)
    
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código QR - Cama ${camaId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: white;
                    padding: 20px;
                }
                
                .print-container {
                    max-width: 600px;
                    margin: 0 auto;
                    text-align: center;
                }
                
                .header {
                    background: linear-gradient(135deg, #4CAF50, #2E7D32);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                }
                
                .header h1 {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                
                .header h2 {
                    font-size: 1.8em;
                    margin-bottom: 8px;
                    opacity: 0.95;
                }
                
                .header p {
                    font-size: 1.1em;
                    opacity: 0.9;
                }
                
                .qr-section {
                    background: #f8f9fa;
                    border: 3px solid #e9ecef;
                    border-radius: 16px;
                    padding: 30px;
                    margin: 30px 0;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .qr-code {
                    display: inline-block;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                
                .plant-info {
                    background: #e8f5e8;
                    border-left: 5px solid #4CAF50;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                    text-align: left;
                }
                
                .plant-info h3 {
                    color: #2E7D32;
                    margin-bottom: 10px;
                    font-size: 1.2em;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .info-item {
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                    border: 1px solid #d4edda;
                }
                
                .info-label {
                    font-weight: bold;
                    color: #2E7D32;
                    font-size: 0.9em;
                }
                
                .info-value {
                    color: #495057;
                }
                
                .instructions {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }
                
                .instructions h3 {
                    color: #856404;
                    margin-bottom: 10px;
                }
                
                .url-info {
                    background: #e3f2fd;
                    border: 1px solid #bbdefb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    word-break: break-all;
                }
                
                .url-info strong {
                    color: #1976d2;
                }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #e9ecef;
                    font-size: 0.9em;
                    color: #6c757d;
                }
                
                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .footer-item {
                    text-align: center;
                }
                
                @media print {
                    body { 
                        print-color-adjust: exact; 
                        -webkit-print-color-adjust: exact;
                    }
                    
                    .print-container {
                        max-width: 100%;
                    }
                    
                    .header {
                        background: #4CAF50 !important;
                        color: white !important;
                    }
                }
                
                @page {
                    margin: 1cm;
                    size: A4;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <!-- Header con branding -->
                <div class="header">
                    <h1>🌱 Agro-Track</h1>
                    <h2>${camaData?.nombrePlanta || 'Cama de Cultivo'}</h2>
                    <p>Cama ${camaId} • ${camaData?.cantidadPlantas || 0} plantas</p>
                </div>
                
                <!-- Información de la planta -->
                ${camaData ? `
                <div class="plant-info">
                    <h3>📋 Información de la Cama</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Planta:</div>
                            <div class="info-value">${camaData.nombrePlanta}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Cantidad:</div>
                            <div class="info-value">${camaData.cantidadPlantas} plantas</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Esquejes:</div>
                            <div class="info-value">${camaData.esquejes} unidades</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Sustrato:</div>
                            <div class="info-value">${camaData.sustrato}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Contenedor:</div>
                            <div class="info-value">${camaData.tarroSize} ${camaData.tarroUnidad}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">ID de Cama:</div>
                            <div class="info-value">${camaId}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Código QR -->
                <div class="qr-section">
                    <h3 style="margin-bottom: 20px; color: #2E7D32;">📱 Código QR de Acceso</h3>
                    <div class="qr-code">
                        ${qrHtml}
                    </div>
                </div>
                
                <!-- Instrucciones -->
                <div class="instructions">
                    <h3>📖 Instrucciones de Uso</h3>
                    <p>1. <strong>Escanea</strong> el código QR con la cámara de tu dispositivo móvil</p>
                    <p>2. <strong>Accede</strong> instantáneamente a toda la información de esta cama</p>
                    <p>3. <strong>Comparte</strong> el enlace con otros miembros del equipo si es necesario</p>
                </div>
                
                <!-- URL para acceso manual -->
                <div class="url-info">
                    <strong>🔗 Enlace directo:</strong><br>
                    <code>${url}</code>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-grid">
                        <div class="footer-item">
                            <strong>Fecha de generación:</strong><br>
                            ${currentDate}
                        </div>
                        <div class="footer-item">
                            <strong>Sistema:</strong><br>
                            Agro-Track v1.0
                        </div>
                        <div class="footer-item">
                            <strong>Tipo:</strong><br>
                            Código QR de Cama
                        </div>
                    </div>
                    <p style="margin-top: 15px; font-style: italic;">
                        Este código QR proporciona acceso público a la información de la cama. 
                        Manténgalo en un lugar visible cerca de la cama correspondiente.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `
}

/**
 * Abre ventana de impresión con contenido personalizado
 * @param {string} htmlContent - Contenido HTML para imprimir
 * @param {string} title - Título de la ventana
 */
export const printHTML = (htmlContent, title = 'Impresión') => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión. Verifica que los popups estén habilitados.')
    }
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    
    // Esperar a que cargue el contenido antes de imprimir
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }
}

/**
 * Comparte URL usando Web Share API o fallback a clipboard
 * @param {string} camaId - ID de la cama
 * @param {Object} camaData - Datos de la cama
 * @param {string} baseUrl - URL base opcional
 * @returns {Promise} - Promesa que resuelve al completar la acción
 */
export const shareQRUrl = async (camaId, camaData, baseUrl = null) => {
    const url = generateCamaUrl(camaId, baseUrl)
    const shareData = {
        title: `Cama ${camaId} - ${camaData?.nombrePlanta || 'Agro-Track'}`,
        text: `Información de la cama de cultivo ${camaId}${camaData?.nombrePlanta ? ` (${camaData.nombrePlanta})` : ''}`,
        url: url
    }

    try {
        if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData)
            return { success: true, method: 'share' }
        } else {
            // Fallback: copiar al portapapeles
            await navigator.clipboard.writeText(url)
            return { success: true, method: 'clipboard' }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            // Usuario canceló el share - no es un error
            return { success: true, method: 'cancelled' }
        }
        throw error
    }
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise} - Promesa que resuelve al copiar
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        
        try {
            document.execCommand('copy')
            document.body.removeChild(textArea)
            return true
        } catch (fallbackError) {
            document.body.removeChild(textArea)
            throw fallbackError
        }
    }
}

/**
 * Configuraciones predefinidas para diferentes tamaños de QR
 */
export const QR_PRESETS = {
    small: {
        size: 128,
        name: 'Pequeño',
        description: 'Para documentos digitales',
        level: 'L'
    },
    medium: {
        size: 256,
        name: 'Mediano',
        description: 'Uso estándar',
        level: 'M'
    },
    large: {
        size: 384,
        name: 'Grande',
        description: 'Para carteles',
        level: 'Q'
    },
    xlarge: {
        size: 512,
        name: 'Extra Grande',
        description: 'Para impresión de alta calidad',
        level: 'H'
    }
}

/**
 * Valida si un ID de cama es válido para QR
 * @param {string} camaId - ID de la cama
 * @returns {boolean} - True si es válido
 */
export const isValidCamaId = (camaId) => {
    return camaId && 
           typeof camaId === 'string' && 
           camaId.trim().length > 0 && 
           /^[a-zA-Z0-9_-]+$/.test(camaId.trim())
}

/**
 * Formatea un timestamp para mostrar fecha legible
 * @param {*} timestamp - Timestamp de Firestore
 * @returns {string} - Fecha formateada
 */
export const formatTimestamp = (timestamp) => {
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

/**
 * Genera un nombre de archivo único para descargas
 * @param {string} camaId - ID de la cama
 * @param {string} plantName - Nombre de la planta (opcional)
 * @param {string} format - Formato del archivo
 * @returns {string} - Nombre de archivo
 */
export const generateQRFilename = (camaId, plantName = null, format = 'png') => {
    const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    
    const parts = ['agro-track', 'cama', sanitizeName(camaId)]
    if (plantName) {
        parts.push(sanitizeName(plantName))
    }
    parts.push('qr')
    
    return `${parts.join('-')}.${format}`
}

/**
 * Detecta el tipo de dispositivo para optimizar la experiencia QR
 * @returns {Object} - Información del dispositivo
 */
export const getDeviceInfo = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    const supportsShare = 'share' in navigator
    const supportsClipboard = 'clipboard' in navigator
    
    return {
        isMobile,
        isIOS,
        isAndroid,
        isDesktop: !isMobile,
        supportsShare,
        supportsClipboard,
        recommendedQRSize: isMobile ? 256 : 384
    }
}

/**
 * Crea un enlace de WhatsApp para compartir
 * @param {string} camaId - ID de la cama
 * @param {Object} camaData - Datos de la cama
 * @returns {string} - URL de WhatsApp
 */
export const generateWhatsAppLink = (camaId, camaData) => {
    const url = generateCamaUrl(camaId)
    const text = `🌱 *Agro-Track* - Cama ${camaId}\n\n` +
                `*Planta:* ${camaData?.nombrePlanta || 'No especificada'}\n` +
                `*Plantas:* ${camaData?.cantidadPlantas || 0}\n` +
                `*Esquejes:* ${camaData?.esquejes || 0}\n\n` +
                `Ver información completa: ${url}`
    
    return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Analiza la calidad del QR según el nivel de corrección de errores
 * @param {string} level - Nivel de corrección (L, M, Q, H)
 * @returns {Object} - Información sobre la calidad
 */
export const getQRQualityInfo = (level) => {
    const levels = {
        'L': { name: 'Básica', recovery: '~7%', color: 'error', description: 'Menor calidad, archivo más pequeño' },
        'M': { name: 'Media', recovery: '~15%', color: 'warning', description: 'Equilibrio entre calidad y tamaño' },
        'Q': { name: 'Alta', recovery: '~25%', color: 'info', description: 'Buena resistencia a daños' },
        'H': { name: 'Máxima', recovery: '~30%', color: 'success', description: 'Máxima resistencia, archivo más grande' }
    }
    
    return levels[level] || levels['M']
}

/**
 * Exportar todas las utilidades como objeto default también
 */
const qrUtils = {
    generateCamaUrl,
    downloadQRImage,
    generatePrintHTML,
    printHTML,
    shareQRUrl,
    copyToClipboard,
    QR_PRESETS,
    isValidCamaId,
    formatTimestamp,
    generateQRFilename,
    getDeviceInfo,
    generateWhatsAppLink,
    getQRQualityInfo
}

export default qrUtils