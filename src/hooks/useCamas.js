// src/hooks/useCamas.js
import { useState, useEffect, useCallback } from 'react';
import {
    CamaServices,
    CortesServices,
    StatsServices,
    UrlServices
} from '../firebase/index.js';

/**
 * ============================================================================
 * 🌿 useCamas Hook - React Hook for Camas Management
 * ============================================================================
 * Hook personalizado para gestión completa de camas y cortes de esquejes
 * Integra servicios Firebase en estado React consistente
 * Manejo robusto de operaciones jerárquicas vivero → cama → cortes
 * ============================================================================
 */

/**
 * Hook personalizado para gestión de camas
 * @param {string} viveroId - ID del vivero (requerido)
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar
 * @param {boolean} options.includeStats - Incluir estadísticas en loads
 * @returns {Object} Estado y funciones del hook
 */
export const useCamas = (viveroId, options = {}) => {
    const {
        autoLoad = true,
        includeStats = false
    } = options;

    // ============================================================================
    // 📊 ESTADO DEL HOOK
    // ============================================================================

    // Estado principal de camas
    const [camas, setCamas] = useState([]);
    const [selectedCama, setSelectedCama] = useState(null);
    const [selectedCamaCortes, setSelectedCamaCortes] = useState([]);

    // Estados de loading por operación
    const [loading, setLoading] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingCortes, setLoadingCortes] = useState(false);

    // Estados de error
    const [error, setError] = useState(null);
    const [createError, setCreateError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [cortesError, setCortesError] = useState(null);

    // Estados adicionales
    const [camasStats, setCamasStats] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // ============================================================================
    // ✅ VALIDACIÓN INICIAL
    // ============================================================================

    useEffect(() => {
        if (!viveroId) {
            setError("viveroId es requerido para el hook useCamas");
        }
    }, [viveroId]);

    // ============================================================================
    // 🔄 FUNCIONES DE CARGA
    // ============================================================================

    /**
     * Carga todas las camas del vivero
     */
    const loadCamas = useCallback(async (forceRefresh = false) => {
        if (!viveroId) {
            setError("viveroId es requerido");
            return;
        }

        if (loading && !forceRefresh) return;

        try {
            setLoading(true);
            setError(null);

            console.log("🔄 Cargando camas del vivero:", viveroId);

            let camasData = await CamaServices.getCamasFromVivero(viveroId, {
                orderBy: 'updatedAt'
            });

            // Si se requieren estadísticas actualizadas
            if (includeStats && camasData.length > 0) {
                console.log("📊 Actualizando estadísticas de camas...");
                camasData = await Promise.all(
                    camasData.map(async (cama) => {
                        try {
                            const stats = await StatsServices.calculateCamaStats(viveroId, cama.id);
                            return { ...cama, estadisticas: stats };
                        } catch (error) {
                            console.warn(`⚠️ Error actualizando stats de cama ${cama.id}:`, error.message);
                            return cama; // Devolver sin stats actualizadas
                        }
                    })
                );
            }

            setCamas(camasData);
            setLastUpdated(new Date());

            console.log(`✅ ${camasData.length} camas cargadas del vivero ${viveroId}`);

        } catch (error) {
            console.error("❌ Error cargando camas:", error.message);
            setError(`Error al cargar camas: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [viveroId, includeStats, loading]);

    /**
     * Carga una cama específica con sus cortes
     */
    const loadCama = useCallback(async (camaId, withCortes = true) => {
        if (!viveroId || !camaId) {
            setError("viveroId y camaId son requeridos");
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            console.log("📄 Cargando cama:", camaId);

            const cama = await CamaServices.getCama(viveroId, camaId);

            if (cama) {
                // Calcular estadísticas actualizadas
                if (includeStats) {
                    try {
                        const stats = await StatsServices.calculateCamaStats(viveroId, camaId);
                        cama.estadisticas = stats;
                    } catch (error) {
                        console.warn("⚠️ Error calculando stats:", error.message);
                    }
                }

                setSelectedCama(cama);

                // Cargar cortes si se requiere
                if (withCortes) {
                    await loadCamaCortes(camaId);
                }

                console.log("✅ Cama cargada:", cama.nombreCompleto);
            }

            return cama;

        } catch (error) {
            console.error("❌ Error cargando cama:", error.message);
            setError(`Error al cargar cama: ${error.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    }, [viveroId, includeStats]);

    /**
     * Carga cortes de una cama específica
     */
    const loadCamaCortes = useCallback(async (camaId, options = {}) => {
        if (!viveroId || !camaId) {
            setCortesError("viveroId y camaId son requeridos");
            return;
        }

        try {
            setLoadingCortes(true);
            setCortesError(null);

            console.log("📋 Cargando cortes de cama:", camaId);

            const cortes = await CortesServices.getCortesFromCama(viveroId, camaId, {
                orderBy: 'fecha',
                orderDirection: 'desc',
                limitResults: 50, // Últimos 50 cortes
                ...options
            });

            setSelectedCamaCortes(cortes);

            console.log(`✅ ${cortes.length} cortes cargados`);

        } catch (error) {
            console.error("❌ Error cargando cortes:", error.message);
            setCortesError(`Error al cargar cortes: ${error.message}`);
        } finally {
            setLoadingCortes(false);
        }
    }, [viveroId]);

    /**
     * Carga estadísticas comparativas de todas las camas
     */
    const loadCamasStats = useCallback(async () => {
        if (!viveroId) return;

        try {
            setLoadingStats(true);
            console.log("📊 Cargando estadísticas comparativas...");

            const stats = await StatsServices.getCamasComparativeStats(viveroId);
            setCamasStats(stats);

            console.log("✅ Estadísticas comparativas cargadas");

        } catch (error) {
            console.error("❌ Error cargando estadísticas comparativas:", error.message);
            setError(`Error al cargar estadísticas: ${error.message}`);
        } finally {
            setLoadingStats(false);
        }
    }, [viveroId]);

    // ============================================================================
    // ✏️ OPERACIONES CRUD DE CAMAS
    // ============================================================================

    /**
     * Crea una nueva cama
     */
    const createCama = useCallback(async (camaData, userEmail) => {
        if (!viveroId) {
            setCreateError("viveroId es requerido");
            return null;
        }

        try {
            setLoadingCreate(true);
            setCreateError(null);

            console.log("🌿 Creando nueva cama:", camaData.nombrePlanta);

            // Generar ID si no se proporciona
            if (!camaData.id) {
                const maxId = camas.length > 0 
                    ? Math.max(...camas.map(c => parseInt(c.id.replace(/\D/g, '')) || 0))
                    : 0;
                camaData.id = UrlServices.generateCamaId('cama', maxId + 1);
            }

            // Validar ID
            const validation = UrlServices.validateCamaId(camaData.id);
            if (!validation.valid) {
                throw new Error(`ID inválido: ${validation.errors.join(', ')}`);
            }

            // Crear cama
            const camaId = await CamaServices.createCama(viveroId, camaData, userEmail);

            // Recargar lista de camas
            await loadCamas(true);

            console.log("✅ Cama creada exitosamente:", camaId);
            return camaId;

        } catch (error) {
            console.error("❌ Error creando cama:", error.message);
            setCreateError(error.message);
            throw error;
        } finally {
            setLoadingCreate(false);
        }
    }, [viveroId, camas, loadCamas]);

    /**
     * Actualiza una cama existente
     */
    const updateCama = useCallback(async (camaId, updateData, userEmail) => {
        if (!viveroId || !camaId) {
            setUpdateError("viveroId y camaId son requeridos");
            return;
        }

        try {
            setLoadingUpdate(true);
            setUpdateError(null);

            console.log("🔄 Actualizando cama:", camaId);

            await CamaServices.updateCama(viveroId, camaId, updateData, userEmail);

            // Actualizar en el estado local si existe
            setCamas(prevCamas =>
                prevCamas.map(cama =>
                    cama.id === camaId
                        ? { ...cama, ...updateData, updatedAt: new Date() }
                        : cama
                )
            );

            // Actualizar cama seleccionada si corresponde
            if (selectedCama && selectedCama.id === camaId) {
                setSelectedCama(prev => ({ ...prev, ...updateData }));
            }

            console.log("✅ Cama actualizada exitosamente");

        } catch (error) {
            console.error("❌ Error actualizando cama:", error.message);
            setUpdateError(error.message);
            throw error;
        } finally {
            setLoadingUpdate(false);
        }
    }, [viveroId, selectedCama]);

    /**
     * Elimina una cama
     */
    const deleteCama = useCallback(async (camaId) => {
        if (!viveroId || !camaId) {
            setDeleteError("viveroId y camaId son requeridos");
            return;
        }

        try {
            setLoadingDelete(true);
            setDeleteError(null);

            console.log("🗑️ Eliminando cama:", camaId);

            await CamaServices.deleteCama(viveroId, camaId);

            // Remover del estado local
            setCamas(prevCamas =>
                prevCamas.filter(cama => cama.id !== camaId)
            );

            // Limpiar cama seleccionada si era la eliminada
            if (selectedCama && selectedCama.id === camaId) {
                setSelectedCama(null);
                setSelectedCamaCortes([]);
            }

            console.log("✅ Cama eliminada exitosamente");

        } catch (error) {
            console.error("❌ Error eliminando cama:", error.message);
            setDeleteError(error.message);
            throw error;
        } finally {
            setLoadingDelete(false);
        }
    }, [viveroId, selectedCama]);

    // ============================================================================
    // ✂️ OPERACIONES DE CORTES DE ESQUEJES
    // ============================================================================

    /**
     * Crea un nuevo corte de esquejes
     */
    const createCorte = useCallback(async (camaId, corteData, userEmail) => {
        if (!viveroId || !camaId) {
            setCortesError("viveroId y camaId son requeridos");
            return null;
        }

        try {
            setLoadingCortes(true);
            setCortesError(null);

            // Validar datos del corte
            const validation = CortesServices.validateCorteData(corteData);
            if (!validation.valid) {
                throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
            }

            console.log("✂️ Creando nuevo corte:", corteData.cantidadEsquejes, "esquejes");

            const corteId = await CortesServices.createCorte(viveroId, camaId, corteData, userEmail);

            // Recargar cortes de la cama si es la seleccionada
            if (selectedCama && selectedCama.id === camaId) {
                await loadCamaCortes(camaId);
            }

            // Recargar camas para actualizar estadísticas
            if (includeStats) {
                await loadCamas(true);
            }

            console.log("✅ Corte creado exitosamente:", corteId);
            return corteId;

        } catch (error) {
            console.error("❌ Error creando corte:", error.message);
            setCortesError(error.message);
            throw error;
        } finally {
            setLoadingCortes(false);
        }
    }, [viveroId, selectedCama, includeStats, loadCamas, loadCamaCortes]);

    /**
     * Actualiza un corte existente
     */
    const updateCorte = useCallback(async (camaId, corteId, updateData, userEmail) => {
        if (!viveroId || !camaId || !corteId) {
            setCortesError("viveroId, camaId y corteId son requeridos");
            return;
        }

        try {
            setLoadingCortes(true);
            setCortesError(null);

            console.log("🔄 Actualizando corte:", corteId);

            await CortesServices.updateCorte(viveroId, camaId, corteId, updateData, userEmail);

            // Actualizar en el estado local si está en la lista
            setSelectedCamaCortes(prevCortes =>
                prevCortes.map(corte =>
                    corte.id === corteId
                        ? { ...corte, ...updateData, updatedAt: new Date() }
                        : corte
                )
            );

            console.log("✅ Corte actualizado exitosamente");

        } catch (error) {
            console.error("❌ Error actualizando corte:", error.message);
            setCortesError(error.message);
            throw error;
        } finally {
            setLoadingCortes(false);
        }
    }, [viveroId]);

    /**
     * Elimina un corte
     */
    const deleteCorte = useCallback(async (camaId, corteId) => {
        if (!viveroId || !camaId || !corteId) {
            setCortesError("viveroId, camaId y corteId son requeridos");
            return;
        }

        try {
            setLoadingCortes(true);
            setCortesError(null);

            console.log("🗑️ Eliminando corte:", corteId);

            await CortesServices.deleteCorte(viveroId, camaId, corteId);

            // Remover del estado local
            setSelectedCamaCortes(prevCortes =>
                prevCortes.filter(corte => corte.id !== corteId)
            );

            // Recargar camas para actualizar estadísticas si es necesario
            if (includeStats) {
                await loadCamas(true);
            }

            console.log("✅ Corte eliminado exitosamente");

        } catch (error) {
            console.error("❌ Error eliminando corte:", error.message);
            setCortesError(error.message);
            throw error;
        } finally {
            setLoadingCortes(false);
        }
    }, [viveroId, includeStats, loadCamas]);

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
        setCortesError(null);
    }, []);

    /**
     * Limpia la cama seleccionada
     */
    const clearSelectedCama = useCallback(() => {
        setSelectedCama(null);
        setSelectedCamaCortes([]);
    }, []);

    /**
     * Busca camas por texto
     */
    const searchCamas = useCallback((searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            return camas;
        }

        const term = searchTerm.toLowerCase();
        return camas.filter(cama =>
            cama.nombrePlanta?.toLowerCase().includes(term) ||
            cama.nombreCompleto?.toLowerCase().includes(term) ||
            cama.sustrato?.toLowerCase().includes(term) ||
            cama.id.toLowerCase().includes(term)
        );
    }, [camas]);

    /**
     * Genera URLs para una cama
     */
    const generateCamaUrls = useCallback((camaId, baseUrl = '') => {
        return UrlServices.generateCamaUrls(viveroId, camaId, baseUrl);
    }, [viveroId]);

    /**
     * Valida datos de cama
     */
    const validateCamaData = useCallback((camaData) => {
        const errors = [];

        if (!camaData.nombrePlanta || camaData.nombrePlanta.trim().length === 0) {
            errors.push("Nombre de la planta es requerido");
        }

        if (camaData.cantidadPlantas !== undefined && camaData.cantidadPlantas < 0) {
            errors.push("La cantidad de plantas no puede ser negativa");
        }

        if (camaData.id) {
            const idValidation = UrlServices.validateCamaId(camaData.id);
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
        if (autoLoad && viveroId) {
            loadCamas();
        }
    }, [autoLoad, viveroId, loadCamas]);

    // ============================================================================
    // 📦 RETORNO DEL HOOK
    // ============================================================================

    return {
        // Estado principal
        camas,
        selectedCama,
        selectedCamaCortes,
        camasStats,
        lastUpdated,
        viveroId,

        // Estados de loading
        loading,
        loadingCreate,
        loadingUpdate,
        loadingDelete,
        loadingStats,
        loadingCortes,

        // Estados de error
        error,
        createError,
        updateError,
        deleteError,
        cortesError,

        // Operaciones de carga
        loadCamas,
        loadCama,
        loadCamaCortes,
        loadCamasStats,

        // Operaciones CRUD de camas
        createCama,
        updateCama,
        deleteCama,

        // Operaciones de cortes
        createCorte,
        updateCorte,
        deleteCorte,

        // Utilidades
        clearErrors,
        clearSelectedCama,
        searchCamas,
        generateCamaUrls,
        validateCamaData,

        // Setters para control externo
        setSelectedCama,

        // Computed values útiles
        hasCamas: camas.length > 0,
        totalCamas: camas.length,
        camasActivas: camas.filter(c => c.estado === 'activa').length,
        totalPlantas: camas.reduce((sum, cama) => sum + (cama.cantidadPlantas || 0), 0),
        totalEsquejesHistorico: camas.reduce((sum, cama) => sum + (cama.estadisticas?.totalEsquejesHistorico || 0), 0),
        isLoadingAny: loading || loadingCreate || loadingUpdate || loadingDelete || loadingStats || loadingCortes,
        hasErrors: !!(error || createError || updateError || deleteError || cortesError)
    };
};

export default useCamas;