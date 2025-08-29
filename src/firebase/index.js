// src/firebase/index.js
/**
 * ============================================================================
 * 🚀 AGRO-TRACK FIREBASE SERVICES - BARREL EXPORTS v2.0
 * ============================================================================
 * Archivo índice para importar fácilmente todos los servicios de Firebase
 * Estructura organizada por responsabilidades con servicios de camas incluidos
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
// 🌿 SERVICIOS DE CAMAS
// ============================================================================

// CRUD básico de camas
export * from './camas/camaService.js';
export {
    createCama,
    getCama,
    getCamasFromVivero,
    getAllCamas,
    updateCama,
    deleteCama,
    camaExists,
    getCamasByPlanta,
    updateMultipleCamasEstado,
    getCamasStatsFromVivero
} from './camas/camaService.js';

// Estadísticas de camas
export * from './camas/camaStatsService.js';
export {
    calculateCamaStats,
    getCamasComparativeStats,
    getCamaTrendAnalysis,
    recalculateMultipleCamasStats,
    getTopProductiveCamas,
    generateCamaPerformanceReport
} from './camas/camaStatsService.js';

// Gestión de cortes de esquejes
export * from './camas/cortesService.js';
export {
    createCorte,
    getCorte,
    getCortesFromCama,
    getCortesFromVivero,
    updateCorte,
    deleteCorte,
    createMultipleCortes,
    getProduccionStats,
    getAllCortes,
    corteExists,
    getRecentActivity,
    validateCorteData
} from './camas/cortesService.js';

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

// Servicios de camas CRUD agrupados
export const CamaServices = {
    createCama,
    getCama,
    getCamasFromVivero,
    getAllCamas,
    updateCama,
    deleteCama,
    camaExists,
    getCamasByPlanta,
    updateMultipleCamasEstado,
    getCamasStatsFromVivero
};

// Servicios de estadísticas agrupados
export const StatsServices = {
    // Estadísticas de viveros
    calculateViveroStats,
    getViveroPlantasSummary,
    getViveroWithUpdatedStats,
    recalculateMultipleViverosStats,
    getGlobalViverosStats,

    // Estadísticas de camas
    calculateCamaStats,
    getCamasComparativeStats,
    getCamaTrendAnalysis,
    recalculateMultipleCamasStats,
    getTopProductiveCamas,
    generateCamaPerformanceReport
};

// Servicios de cortes/esquejes agrupados
export const CortesServices = {
    createCorte,
    getCorte,
    getCortesFromCama,
    getCortesFromVivero,
    updateCorte,
    deleteCorte,
    createMultipleCortes,
    getProduccionStats,
    getAllCortes,
    corteExists,
    getRecentActivity,
    validateCorteData
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
// 🎯 EXPORT POR DEFECTO - TODOS LOS SERVICIOS v2.0
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
    CamaServices,
    StatsServices,
    CortesServices,
    LocationServices,
    UrlServices,

    // Servicios individuales para acceso directo
    auth: AuthServices,
    users: UserServices,
    viveros: ViveroServices,
    camas: CamaServices,
    stats: StatsServices,
    cortes: CortesServices,
    location: LocationServices,
    urls: UrlServices
};

// ============================================================================
// 📚 EJEMPLOS DE USO v2.0
// ============================================================================

/*

// Ejemplo 1: Importar servicios específicos de camas
import { createCama, getCamasFromVivero, createCorte } from '@/firebase';

// Ejemplo 2: Importar servicios agrupados
import { CamaServices, CortesServices, StatsServices } from '@/firebase';

// Ejemplo 3: Usar en hooks personalizados
import { 
    getAllViveros, 
    getCamasFromVivero,
    calculateCamaStats,
    createCorte 
} from '@/firebase';

export const useCamas = (viveroId) => {
    const [camas, setCamas] = useState([]);
    
    const loadCamas = async () => {
        const data = await getCamasFromVivero(viveroId);
        setCamas(data);
    };
    
    const addCorte = async (camaId, corteData) => {
        await createCorte(viveroId, camaId, corteData, user.email);
        await loadCamas(); // Recargar
    };
    
    return { camas, loadCamas, addCorte };
};

// Ejemplo 4: Workflow completo de vivero → cama → corte
import { 
    ViveroServices,
    CamaServices, 
    CortesServices,
    StatsServices 
} from '@/firebase';

const createFullWorkflow = async () => {
    // 1. Crear vivero
    const viveroId = await ViveroServices.createVivero({
        id: 'vivero-norte',
        nombre: 'Vivero Norte',
        descripcion: 'Vivero principal'
    }, 'admin@email.com');

    // 2. Crear cama en el vivero
    const camaId = await CamaServices.createCama(viveroId, {
        id: 'cama01',
        nombrePlanta: 'Lavanda',
        cantidadPlantas: 24,
        sustrato: 'Turba'
    }, 'admin@email.com');

    // 3. Registrar corte de esquejes
    const corteId = await CortesServices.createCorte(viveroId, camaId, {
        fecha: new Date(),
        cantidadEsquejes: 50,
        responsable: 'Juan Pérez'
    }, 'admin@email.com');

    // 4. Calcular estadísticas actualizadas
    const stats = await StatsServices.calculateCamaStats(viveroId, camaId);
    
    return { viveroId, camaId, corteId, stats };
};

// Ejemplo 5: Dashboard de estadísticas
import { StatsServices, CortesServices } from '@/firebase';

const getDashboardData = async (viveroId) => {
    const [
        viveroStats,
        camasComparative,
        recentActivity,
        topCamas
    ] = await Promise.all([
        StatsServices.calculateViveroStats(viveroId),
        StatsServices.getCamasComparativeStats(viveroId),
        CortesServices.getRecentActivity(30, viveroId),
        StatsServices.getTopProductiveCamas({ limit: 5 })
    ]);

    return {
        viveroStats,
        camasComparative,
        recentActivity,
        topCamas
    };
};

*/