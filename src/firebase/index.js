// src/firebase/index.js
/**
 * ============================================================================
 * 🚀 AGRO-TRACK FIREBASE SERVICES - BARREL EXPORTS
 * ============================================================================
 * Archivo índice para importar fácilmente todos los servicios de Firebase
 * Estructura organizada por responsabilidades
 * ============================================================================
 */

// ============================================================================
// 🔧 CONFIGURACIÓN Y AUTENTICACIÓN
// ============================================================================

// Configuración base
export { default as app, auth, db, analytics, googleProvider } from './config.js';

// Servicios de autenticación
export * from './auth.js';
export {
    signInWithGoogle,
    signOut,
    getCurrentUser,
    onAuthChange
} from './auth.js';

// Servicio de usuarios
export * from './userService.js';
export {
    createOrUpdateUser,
    getUserData,
    getAllUsers
} from './userService.js';

// ============================================================================
// 🏡 SERVICIOS DE VIVEROS
// ============================================================================

// CRUD básico de viveros
export * from './viveros/viveroService.js';
export {
    createVivero,
    getVivero,
    getAllViveros,
    updateVivero,
    deleteVivero,
    viveroExists
} from './viveros/viveroService.js';

// Estadísticas de viveros
export * from './viveros/viveroStatsService.js';
export {
    calculateViveroStats,
    calculateCamaStats,
    getViveroPlantasSummary,
    getViveroWithUpdatedStats,
    recalculateMultipleViverosStats,
    getGlobalViverosStats
} from './viveros/viveroStatsService.js';

// Geolocalización de viveros
export * from './viveros/viveroLocationService.js';
export {
    updateViveroGPS,
    updateViveroUbicacionManual,
    clearViveroUbicacion,
    getCurrentGPSLocation,
    captureAndSaveGPS,
    calculateDistance,
    reverseGeocode,
    validateGPSCoordinates,
    getNearbyViveros,
    formatGPSCoordinates
} from './viveros/viveroLocationService.js';

// URLs y utilidades de viveros
export * from './viveros/viveroUrlService.js';
export {
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
} from './viveros/viveroUrlService.js';

// ============================================================================
// 🌿 SERVICIOS DE CAMAS (PRÓXIMAMENTE)
// ============================================================================

// TODO: Implementar en siguiente fase
// export * from './camas/camaService.js';
// export * from './camas/camaStatsService.js';
// export * from './camas/cortesService.js';

// ============================================================================
// 🔍 SERVICIOS COMPARTIDOS (PRÓXIMAMENTE)
// ============================================================================

// TODO: Implementar en siguientes fases
// export * from './shared/searchService.js';
// export * from './shared/validationService.js';
// export * from './shared/maintenanceService.js';

// ============================================================================
// 📦 EXPORTS AGRUPADOS POR FUNCIONALIDAD
// ============================================================================

// Servicios de autenticación agrupados
export const AuthServices = {
    signInWithGoogle,
    signOut,
    getCurrentUser,
    onAuthChange
};

// Servicios de usuarios agrupados
export const UserServices = {
    createOrUpdateUser,
    getUserData,
    getAllUsers
};

// Servicios de viveros CRUD agrupados
export const ViveroServices = {
    createVivero,
    getVivero,
    getAllViveros,
    updateVivero,
    deleteVivero,
    viveroExists
};

// Servicios de estadísticas agrupados
export const StatsServices = {
    calculateViveroStats,
    calculateCamaStats,
    getViveroPlantasSummary,
    getViveroWithUpdatedStats,
    recalculateMultipleViverosStats,
    getGlobalViverosStats
};

// Servicios de geolocalización agrupados
export const LocationServices = {
    updateViveroGPS,
    updateViveroUbicacionManual,
    clearViveroUbicacion,
    getCurrentGPSLocation,
    captureAndSaveGPS,
    calculateDistance,
    reverseGeocode,
    validateGPSCoordinates,
    getNearbyViveros,
    formatGPSCoordinates
};

// Servicios de URLs y utilidades agrupados
export const UrlServices = {
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

// ============================================================================
// 🎯 EXPORT POR DEFECTO - TODOS LOS SERVICIOS
// ============================================================================

export default {
    // Configuración
    app,
    auth,
    db,
    analytics,

    // Servicios agrupados
    AuthServices,
    UserServices,
    ViveroServices,
    StatsServices,
    LocationServices,
    UrlServices,

    // Servicios individuales para acceso directo
    auth: AuthServices,
    users: UserServices,
    viveros: ViveroServices,
    stats: StatsServices,
    location: LocationServices,
    urls: UrlServices
};

// ============================================================================
// 📚 EJEMPLOS DE USO
// ============================================================================

/*

// Ejemplo 1: Importar servicios específicos
import { createVivero, getVivero, updateViveroGPS } from '@/firebase';

// Ejemplo 2: Importar servicios agrupados
import { ViveroServices, LocationServices } from '@/firebase';

// Ejemplo 3: Importar todo
import FirebaseServices from '@/firebase';
const vivero = await FirebaseServices.viveros.createVivero(data, user);

// Ejemplo 4: Importar por categoría
import { 
    ViveroServices,
    StatsServices,
    LocationServices
} from '@/firebase';

const viveroData = await ViveroServices.createVivero(formData, userEmail);
const stats = await StatsServices.calculateViveroStats(viveroId);
const location = await LocationServices.getCurrentGPSLocation();

// Ejemplo 5: Usar en hooks personalizados
import { 
    getAllViveros, 
    getViveroWithUpdatedStats,
    validateViveroId 
} from '@/firebase';

export const useViveros = () => {
    const [viveros, setViveros] = useState([]);
    
    const loadViveros = async () => {
        const data = await getAllViveros({ includeStats: true });
        setViveros(data);
    };
    
    return { viveros, loadViveros };
};

*/