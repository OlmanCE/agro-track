// src/hooks/useViveros.js
import { useState, useEffect, useCallback } from 'react';
import {
    ViveroServices,
    StatsServices,
    LocationServices,
    UrlServices
} from '../firebase/index.js';

/**
 * ============================================================================
 * 🌱 useViveros Hook - React Hook for Viveros Management
 * ============================================================================
 * Hook personalizado para gestión completa de viveros
 * Integra todos los servicios Firebase en un estado React consistente
 * Manejo robusto de loading, errores y operaciones asíncronas
 * ============================================================================
 */

/**
 * Hook personalizado para gestión de viveros
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar
 * @param {boolean} options.includeStats - Incluir estadísticas en loads
 * @param {boolean} options.publicOnly - Solo viveros públicos
 * @returns {Object} Estado y funciones del hook
 */
export const useViveros = (options = {}) => {
    const {
        autoLoad = true,
        includeStats = false,
        publicOnly = false
    } = options;

    // ============================================================================
    // 📊 ESTADO DEL HOOK
    // ============================================================================

    // Estado principal de viveros
    const [viveros, setViveros] = useState([]);
    const [selectedVivero, setSelectedVivero] = useState(null);

    // Estados de loading por operación
    const [loading, setLoading] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingGPS, setLoadingGPS] = useState(false);

    // Estados de error
    const [error, setError] = useState(null);
    const [createError, setCreateError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    // Estados adicionales
    const [globalStats, setGlobalStats] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // ============================================================================
    // 🔄 FUNCIONES DE CARGA
    // ============================================================================

    /**
     * Carga todos los viveros
     */
    const loadViveros = useCallback(async (forceRefresh = false) => {
        if (loading && !forceRefresh) return;

        try {
            setLoading(true);
            setError(null);

            console.log("🔄 Cargando viveros...");

            const loadOptions = {
                publicOnly,
                orderBy: 'updatedAt'
            };

            let viverosData = await ViveroServices.getAllViveros(loadOptions);

            // Si se requieren estadísticas actualizadas
            if (includeStats && viverosData.length > 0) {
                console.log("📊 Actualizando estadísticas...");
                viverosData = await Promise.all(
                    viverosData.map(async (vivero) => {
                        try {
                            return await StatsServices.getViveroWithUpdatedStats(vivero.id);
                        } catch (error) {
                            console.warn(`⚠️ Error actualizando stats de ${vivero.id}:`, error.message);
                            return vivero; // Devolver sin stats actualizadas
                        }
                    })
                );
            }

            setViveros(viverosData);
            setLastUpdated(new Date());

            console.log(`✅ ${viverosData.length} viveros cargados`);

        } catch (error) {
            console.error("❌ Error cargando viveros:", error.message);
            setError(`Error al cargar viveros: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [includeStats, publicOnly, loading]);

    /**
     * Carga un vivero específico
     */
    const loadVivero = useCallback(async (viveroId, withStats = includeStats) => {
        if (!viveroId) {
            setError("ID de vivero requerido");
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            console.log("📄 Cargando vivero:", viveroId);

            let vivero;
            if (withStats) {
                vivero = await StatsServices.getViveroWithUpdatedStats(viveroId);
            } else {
                vivero = await ViveroServices.getVivero(viveroId);
            }

            if (vivero) {
                setSelectedVivero(vivero);
                console.log("✅ Vivero cargado:", vivero.nombre);
            }

            return vivero;

        } catch (error) {
            console.error("❌ Error cargando vivero:", error.message);
            setError(`Error al cargar vivero: ${error.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    }, [includeStats]);

    /**
     * Carga estadísticas globales
     */
    const loadGlobalStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            console.log("🌍 Cargando estadísticas globales...");

            const stats = await StatsServices.getGlobalViverosStats();
            setGlobalStats(stats);

            console.log("✅ Estadísticas globales cargadas");

        } catch (error) {
            console.error("❌ Error cargando estadísticas globales:", error.message);
            setError(`Error al cargar estadísticas: ${error.message}`);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    // ============================================================================
    // ✏️ OPERACIONES CRUD
    // ============================================================================

    /**
     * Crea un nuevo vivero
     */
    const createVivero = useCallback(async (viveroData, userEmail) => {
        try {
            setLoadingCreate(true);
            setCreateError(null);

            console.log("🌱 Creando nuevo vivero:", viveroData.nombre);

            // Generar ID si no se proporciona
            if (!viveroData.id) {
                viveroData.id = UrlServices.generateViveroId(viveroData.nombre);
            }

            // Validar ID
            const validation = UrlServices.validateViveroId(viveroData.id);
            if (!validation.valid) {
                throw new Error(`ID inválido: ${validation.errors.join(', ')}`);
            }

            // Crear vivero
            const viveroId = await ViveroServices.createVivero(viveroData, userEmail);

            // Recargar lista de viveros
            await loadViveros(true);

            console.log("✅ Vivero creado exitosamente:", viveroId);
            return viveroId;

        } catch (error) {
            console.error("❌ Error creando vivero:", error.message);
            setCreateError(error.message);
            throw error;
        } finally {
            setLoadingCreate(false);
        }
    }, [loadViveros]);

    /**
     * Actualiza un vivero existente
     */
    const updateVivero = useCallback(async (viveroId, updateData, userEmail) => {
        try {
            setLoadingUpdate(true);
            setUpdateError(null);

            console.log("🔄 Actualizando vivero:", viveroId);

            await ViveroServices.updateVivero(viveroId, updateData, userEmail);

            // Actualizar en el estado local si existe
            setViveros(prevViveros =>
                prevViveros.map(vivero =>
                    vivero.id === viveroId
                        ? { ...vivero, ...updateData, updatedAt: new Date() }
                        : vivero
                )
            );

            // Actualizar vivero seleccionado si corresponde
            if (selectedVivero && selectedVivero.id === viveroId) {
                setSelectedVivero(prev => ({ ...prev, ...updateData }));
            }

            console.log("✅ Vivero actualizado exitosamente");

        } catch (error) {
            console.error("❌ Error actualizando vivero:", error.message);
            setUpdateError(error.message);
            throw error;
        } finally {
            setLoadingUpdate(false);
        }
    }, [selectedVivero]);

    /**
     * Elimina un vivero
     */
    const deleteVivero = useCallback(async (viveroId) => {
        try {
            setLoadingDelete(true);
            setDeleteError(null);

            console.log("🗑️ Eliminando vivero:", viveroId);

            await ViveroServices.deleteVivero(viveroId);

            // Remover del estado local
            setViveros(prevViveros =>
                prevViveros.filter(vivero => vivero.id !== viveroId)
            );

            // Limpiar vivero seleccionado si era el eliminado
            if (selectedVivero && selectedVivero.id === viveroId) {
                setSelectedVivero(null);
            }

            console.log("✅ Vivero eliminado exitosamente");

        } catch (error) {
            console.error("❌ Error eliminando vivero:", error.message);
            setDeleteError(error.message);
            throw error;
        } finally {
            setLoadingDelete(false);
        }
    }, [selectedVivero]);

    // ============================================================================
    // 📍 OPERACIONES DE GEOLOCALIZACIÓN
    // ============================================================================

    /**
     * Actualiza ubicación GPS de un vivero
     */
    const updateViveroGPS = useCallback(async (viveroId, gpsOptions = {}) => {
        try {
            setLoadingGPS(true);
            setGpsError(null);

            console.log("📡 Obteniendo y guardando GPS para vivero:", viveroId);

            const gpsResult = await LocationServices.captureAndSaveGPS(viveroId, gpsOptions);

            // Actualizar en el estado local
            setViveros(prevViveros =>
                prevViveros.map(vivero =>
                    vivero.id === viveroId
                        ? {
                            ...vivero,
                            ubicacion: {
                                tipo: 'gps',
                                coordenadas: { lat: gpsResult.lat, lng: gpsResult.lng },
                                direccion: gpsResult.direccion,
                                timestamp: new Date()
                            }
                        }
                        : vivero
                )
            );

            // Actualizar vivero seleccionado
            if (selectedVivero && selectedVivero.id === viveroId) {
                setSelectedVivero(prev => ({
                    ...prev,
                    ubicacion: {
                        tipo: 'gps',
                        coordenadas: { lat: gpsResult.lat, lng: gpsResult.lng },
                        direccion: gpsResult.direccion,
                        timestamp: new Date()
                    }
                }));
            }

            console.log("✅ GPS actualizado exitosamente");
            return gpsResult;

        } catch (error) {
            console.error("❌ Error actualizando GPS:", error.message);
            setGpsError(error.message);
            throw error;
        } finally {
            setLoadingGPS(false);
        }
    }, [selectedVivero]);

    /**
     * Actualiza ubicación manual de un vivero
     */
    const updateViveroUbicacionManual = useCallback(async (viveroId, direccion) => {
        try {
            setLoadingUpdate(true);
            setUpdateError(null);

            await LocationServices.updateViveroUbicacionManual(viveroId, direccion);

            // Actualizar en el estado local
            setViveros(prevViveros =>
                prevViveros.map(vivero =>
                    vivero.id === viveroId
                        ? {
                            ...vivero,
                            ubicacion: {
                                tipo: 'manual',
                                coordenadas: null,
                                direccion: direccion,
                                timestamp: new Date()
                            }
                        }
                        : vivero
                )
            );

            // Actualizar vivero seleccionado
            if (selectedVivero && selectedVivero.id === viveroId) {
                setSelectedVivero(prev => ({
                    ...prev,
                    ubicacion: {
                        tipo: 'manual',
                        coordenadas: null,
                        direccion: direccion,
                        timestamp: new Date()
                    }
                }));
            }

            console.log("✅ Ubicación manual actualizada");

        } catch (error) {
            console.error("❌ Error actualizando ubicación manual:", error.message);
            setUpdateError(error.message);
            throw error;
        } finally {
            setLoadingUpdate(false);
        }
    }, [selectedVivero]);

    // ============================================================================
    // 📊 OPERACIONES DE ESTADÍSTICAS
    // ============================================================================

    /**
     * Recalcula estadísticas de un vivero
     */
    const recalculateViveroStats = useCallback(async (viveroId) => {
        try {
            setLoadingStats(true);
            console.log("🔄 Recalculando estadísticas del vivero:", viveroId);

            const stats = await StatsServices.calculateViveroStats(viveroId);

            // Actualizar en el estado local
            setViveros(prevViveros =>
                prevViveros.map(vivero =>
                    vivero.id === viveroId
                        ? { ...vivero, estadisticas: stats }
                        : vivero
                )
            );

            // Actualizar vivero seleccionado
            if (selectedVivero && selectedVivero.id === viveroId) {
                setSelectedVivero(prev => ({ ...prev, estadisticas: stats }));
            }

            console.log("✅ Estadísticas recalculadas");
            return stats;

        } catch (error) {
            console.error("❌ Error recalculando estadísticas:", error.message);
            throw error;
        } finally {
            setLoadingStats(false);
        }
    }, [selectedVivero]);

    // ============================================================================
    // 🔧 UTILIDADES Y HELPERS
    // ============================================================================

    /**
     * Limpia todos los errores
     */
    const clearErrors = useCallback(() => {
        setError(null);
        setCreateError(null);
        setUpdateError(null);
        setDeleteError(null);
        setGpsError(null);
    }, []);

    /**
     * Limpia el vivero seleccionado
     */
    const clearSelectedVivero = useCallback(() => {
        setSelectedVivero(null);
    }, []);

    /**
     * Busca viveros por texto
     */
    const searchViveros = useCallback((searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            return viveros;
        }

        const term = searchTerm.toLowerCase();
        return viveros.filter(vivero =>
            vivero.nombre.toLowerCase().includes(term) ||
            vivero.descripcion?.toLowerCase().includes(term) ||
            vivero.responsable?.toLowerCase().includes(term) ||
            vivero.id.toLowerCase().includes(term)
        );
    }, [viveros]);

    /**
     * Genera URLs para un vivero
     */
    const generateViveroUrls = useCallback((viveroId, baseUrl = '') => {
        return UrlServices.generateViveroUrls(viveroId, baseUrl);
    }, []);

    /**
     * Valida datos de vivero
     */
    const validateViveroData = useCallback((viveroData) => {
        const errors = [];

        if (!viveroData.nombre || viveroData.nombre.trim().length === 0) {
            errors.push("Nombre del vivero es requerido");
        }

        if (viveroData.id) {
            const idValidation = UrlServices.validateViveroId(viveroData.id);
            if (!idValidation.valid) {
                errors.push(...idValidation.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }, []);

    // ============================================================================
    // 🔄 EFECTOS
    // ============================================================================

    // Carga inicial automática
    useEffect(() => {
        if (autoLoad) {
            loadViveros();
        }
    }, [autoLoad, loadViveros]);

    // ============================================================================
    // 📦 RETORNO DEL HOOK
    // ============================================================================

    return {
        // Estado principal
        viveros,
        selectedVivero,
        globalStats,
        lastUpdated,

        // Estados de loading
        loading,
        loadingCreate,
        loadingUpdate,
        loadingDelete,
        loadingStats,
        loadingGPS,

        // Estados de error
        error,
        createError,
        updateError,
        deleteError,
        gpsError,

        // Operaciones de carga
        loadViveros,
        loadVivero,
        loadGlobalStats,

        // Operaciones CRUD
        createVivero,
        updateVivero,
        deleteVivero,

        // Operaciones de geolocalización
        updateViveroGPS,
        updateViveroUbicacionManual,

        // Operaciones de estadísticas
        recalculateViveroStats,

        // Utilidades
        clearErrors,
        clearSelectedVivero,
        searchViveros,
        generateViveroUrls,
        validateViveroData,

        // Setters para control externo
        setSelectedVivero,

        // Computed values útiles
        hasViveros: viveros.length > 0,
        totalViveros: viveros.length,
        isLoadingAny: loading || loadingCreate || loadingUpdate || loadingDelete || loadingStats || loadingGPS,
        hasErrors: !!(error || createError || updateError || deleteError || gpsError)
    };
};

export default useViveros;