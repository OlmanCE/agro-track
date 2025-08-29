// src/firebase/viveros/viveroUrlService.js

/**
 * ============================================================================
 * 🔗 VIVERO URL SERVICE
 * ============================================================================
 * Responsabilidad: Gestión de URLs, códigos QR y utilidades
 * - Generación de URLs completas y cortas
 * - Validación de IDs de viveros
 * - Generación automática de slugs
 * - Utilidades para códigos QR
 * - Formateo y validación de datos
 * ============================================================================
 */

/**
 * Genera las URLs para un vivero (completa y corta para QR)
 * @param {string} viveroId - ID del vivero
 * @param {string} baseUrl - URL base de la aplicación
 * @returns {Object} URLs del vivero
 */
export const generateViveroUrls = (viveroId, baseUrl = '') => {
    // Limpiar baseUrl para evitar barras duplicadas
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return {
        completa: `${cleanBaseUrl}/vivero/${viveroId}`,
        corta: `${cleanBaseUrl}/v/${viveroId}`,
        admin: `${cleanBaseUrl}/admin/vivero/${viveroId}/editar`,
        adminCamas: `${cleanBaseUrl}/admin/vivero/${viveroId}/camas`,
        nuevaCama: `${cleanBaseUrl}/admin/vivero/${viveroId}/cama/nueva`
    };
};

/**
 * Genera las URLs para una cama específica
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {string} baseUrl - URL base de la aplicación
 * @returns {Object} URLs de la cama
 */
export const generateCamaUrls = (viveroId, camaId, baseUrl = '') => {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return {
        completa: `${cleanBaseUrl}/vivero/${viveroId}/cama/${camaId}`,
        corta: `${cleanBaseUrl}/v/${viveroId}/c/${camaId}`,
        admin: `${cleanBaseUrl}/admin/vivero/${viveroId}/cama/${camaId}/editar`,
        cortes: `${cleanBaseUrl}/admin/vivero/${viveroId}/cama/${camaId}/cortes`,
        nuevoCorte: `${cleanBaseUrl}/admin/vivero/${viveroId}/cama/${camaId}/corte/nuevo`
    };
};

/**
 * Valida si un ID de vivero es válido (formato slug)
 * @param {string} viveroId - ID a validar
 * @returns {Object} Resultado de validación {valid, errors}
 */
export const validateViveroId = (viveroId) => {
    const errors = [];

    if (!viveroId) {
        errors.push("ID del vivero es requerido");
        return { valid: false, errors };
    }

    if (typeof viveroId !== 'string') {
        errors.push("ID del vivero debe ser texto");
        return { valid: false, errors };
    }

    // Validaciones de formato
    if (viveroId.length < 2) {
        errors.push("ID debe tener al menos 2 caracteres");
    }

    if (viveroId.length > 50) {
        errors.push("ID no puede exceder 50 caracteres");
    }

    // Formato slug: solo letras minúsculas, números, guiones y guiones bajos
    const slugRegex = /^[a-z0-9_-]+$/;
    if (!slugRegex.test(viveroId)) {
        errors.push("ID solo puede contener letras minúsculas, números, guiones (-) y guiones bajos (_)");
    }

    // No puede empezar o terminar con guión
    if (viveroId.startsWith('-') || viveroId.endsWith('-')) {
        errors.push("ID no puede empezar o terminar con guión");
    }

    // No puede tener guiones consecutivos
    if (viveroId.includes('--')) {
        errors.push("ID no puede tener guiones consecutivos");
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Valida si un ID de cama es válido
 * @param {string} camaId - ID de la cama a validar
 * @returns {Object} Resultado de validación {valid, errors}
 */
export const validateCamaId = (camaId) => {
    const errors = [];

    if (!camaId) {
        errors.push("ID de la cama es requerido");
        return { valid: false, errors };
    }

    if (typeof camaId !== 'string') {
        errors.push("ID de la cama debe ser texto");
        return { valid: false, errors };
    }

    if (camaId.length < 1) {
        errors.push("ID de cama debe tener al menos 1 carácter");
    }

    if (camaId.length > 20) {
        errors.push("ID de cama no puede exceder 20 caracteres");
    }

    // Formato para camas: letras, números, guiones
    const camaRegex = /^[a-z0-9_-]+$/i;
    if (!camaRegex.test(camaId)) {
        errors.push("ID de cama solo puede contener letras, números, guiones (-) y guiones bajos (_)");
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Genera un ID único para vivero basado en el nombre
 * @param {string} nombre - Nombre del vivero
 * @returns {string} ID generado
 */
export const generateViveroId = (nombre) => {
    if (!nombre || typeof nombre !== 'string') {
        return '';
    }

    return nombre
        .toLowerCase()
        .trim()
        .normalize("NFD") // Normalizar caracteres unicode
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno solo
        .replace(/^-|-$/g, '') // Remover guiones al inicio y final
        .substring(0, 50); // Limitar longitud
};

/**
 * Genera un ID único para cama basado en un patrón
 * @param {string} pattern - Patrón base (ej: "cama", "c", "bed")
 * @param {number} numero - Número de la cama
 * @param {boolean} zeroPadding - Si agregar ceros a la izquierda
 * @returns {string} ID de cama generado
 */
export const generateCamaId = (pattern = 'cama', numero, zeroPadding = true) => {
    if (typeof numero !== 'number' || numero < 1) {
        throw new Error("Número de cama debe ser mayor a 0");
    }

    const paddedNumber = zeroPadding && numero < 100
        ? numero.toString().padStart(2, '0')
        : numero.toString();

    return `${pattern}${paddedNumber}`.toLowerCase();
};

/**
 * Extrae información de una URL de vivero o cama
 * @param {string} url - URL a analizar
 * @returns {Object} Información extraída
 */
export const parseAgroTrackUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Patrones de URLs
        const patterns = {
            viveroCompleto: /^\/vivero\/([a-z0-9_-]+)$/,
            viveroCorto: /^\/v\/([a-z0-9_-]+)$/,
            camaCompleta: /^\/vivero\/([a-z0-9_-]+)\/cama\/([a-z0-9_-]+)$/,
            camaCorta: /^\/v\/([a-z0-9_-]+)\/c\/([a-z0-9_-]+)$/,
            adminVivero: /^\/admin\/vivero\/([a-z0-9_-]+)\/editar$/,
            adminCama: /^\/admin\/vivero\/([a-z0-9_-]+)\/cama\/([a-z0-9_-]+)\/editar$/
        };

        // Vivero completo
        let match = pathname.match(patterns.viveroCompleto);
        if (match) {
            return {
                tipo: 'vivero',
                formato: 'completo',
                viveroId: match[1],
                esAdmin: false
            };
        }

        // Vivero corto
        match = pathname.match(patterns.viveroCorto);
        if (match) {
            return {
                tipo: 'vivero',
                formato: 'corto',
                viveroId: match[1],
                esAdmin: false
            };
        }

        // Cama completa
        match = pathname.match(patterns.camaCompleta);
        if (match) {
            return {
                tipo: 'cama',
                formato: 'completo',
                viveroId: match[1],
                camaId: match[2],
                esAdmin: false
            };
        }

        // Cama corta
        match = pathname.match(patterns.camaCorta);
        if (match) {
            return {
                tipo: 'cama',
                formato: 'corto',
                viveroId: match[1],
                camaId: match[2],
                esAdmin: false
            };
        }

        // Admin vivero
        match = pathname.match(patterns.adminVivero);
        if (match) {
            return {
                tipo: 'vivero',
                formato: 'admin',
                viveroId: match[1],
                esAdmin: true
            };
        }

        // Admin cama
        match = pathname.match(patterns.adminCama);
        if (match) {
            return {
                tipo: 'cama',
                formato: 'admin',
                viveroId: match[1],
                camaId: match[2],
                esAdmin: true
            };
        }

        return {
            tipo: 'desconocido',
            valida: false
        };

    } catch (error) {
        return {
            tipo: 'error',
            valida: false,
            error: error.message
        };
    }
};

/**
 * Genera datos para código QR de vivero
 * @param {Object} vivero - Datos del vivero
 * @param {string} baseUrl - URL base
 * @returns {Object} Datos para QR
 */
export const generateViveroQRData = (vivero, baseUrl = '') => {
    const urls = generateViveroUrls(vivero.id, baseUrl);

    return {
        url: urls.corta,
        urlCompleta: urls.completa,
        titulo: vivero.nombre,
        subtitulo: `Vivero ${vivero.nombre}`,
        descripcion: vivero.descripcion || '',
        tipo: 'vivero',
        id: vivero.id,
        metadata: {
            responsable: vivero.responsable,
            totalCamas: vivero.estadisticas?.totalCamas || 0,
            ubicacion: vivero.ubicacion?.direccion || ''
        }
    };
};

/**
 * Genera datos para código QR de cama
 * @param {Object} cama - Datos de la cama
 * @param {Object} vivero - Datos del vivero padre
 * @param {string} baseUrl - URL base
 * @returns {Object} Datos para QR
 */
export const generateCamaQRData = (cama, vivero, baseUrl = '') => {
    const urls = generateCamaUrls(vivero.id, cama.id, baseUrl);

    return {
        url: urls.corta,
        urlCompleta: urls.completa,
        titulo: `${cama.nombrePlanta || 'Planta'} - ${cama.id}`,
        subtitulo: `${vivero.nombre} - Cama ${cama.id}`,
        descripcion: `${cama.cantidadPlantas || 0} plantas en ${cama.sustrato || 'sustrato'}`,
        tipo: 'cama',
        viveroId: vivero.id,
        camaId: cama.id,
        metadata: {
            nombrePlanta: cama.nombrePlanta,
            cantidadPlantas: cama.cantidadPlantas,
            sustrato: cama.sustrato,
            estado: cama.estado,
            totalEsquejes: cama.estadisticas?.totalEsquejesHistorico || 0
        }
    };
};

/**
 * Formatea un nombre para mostrar de manera consistente
 * @param {string} nombre - Nombre a formatear
 * @param {Object} options - Opciones de formateo
 * @returns {string} Nombre formateado
 */
export const formatDisplayName = (nombre, options = {}) => {
    const {
        capitalizeFirst = true,
        maxLength = 50,
        placeholder = 'Sin nombre'
    } = options;

    if (!nombre || typeof nombre !== 'string') {
        return placeholder;
    }

    let formatted = nombre.trim();

    if (capitalizeFirst) {
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength - 3) + '...';
    }

    return formatted;
};

/**
 * Genera un resumen de texto para mostrar
 * @param {string} texto - Texto completo
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto resumido
 */
export const generateTextSummary = (texto, maxLength = 100) => {
    if (!texto || typeof texto !== 'string') {
        return '';
    }

    const cleaned = texto.trim();

    if (cleaned.length <= maxLength) {
        return cleaned;
    }

    // Buscar el último espacio antes del límite
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
};

// Exports por defecto
export default {
    generateViveroUrls,
    generateCamaUrls,
    validateViveroId,
    validateCamaId,
    generateViveroId,
    generateCamaId,
    parseAgroTrackUrl,
    generateViveroQRData,
    generateCamaQRData,
    formatDisplayName,
    generateTextSummary
};