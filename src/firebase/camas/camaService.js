// src/firebase/camas/camaService.js
import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    limit,
    writeBatch
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * 🌿 CAMA SERVICE - CRUD Operations
 * ============================================================================
 * Responsabilidad: Operaciones básicas CRUD para camas dentro de viveros
 * - Crear, leer, actualizar y eliminar camas
 * - Validaciones básicas con jerarquía viveros
 * - Gestión de subcollection dentro de viveros
 * ============================================================================
 */

/**
 * Crea una nueva cama en un vivero específico
 * @param {string} viveroId - ID del vivero padre
 * @param {Object} camaData - Datos de la cama
 * @param {string} camaData.id - ID único de la cama
 * @param {string} camaData.nombrePlanta - Nombre de la planta
 * @param {number} camaData.cantidadPlantas - Cantidad de plantas
 * @param {string} camaData.sustrato - Tipo de sustrato
 * @param {number} camaData.tarroSize - Tamaño del tarro
 * @param {string} camaData.tarroUnidad - Unidad del tarro (pulgadas/cm)
 * @param {string} camaData.estado - Estado de la cama
 * @param {string} camaData.observaciones - Observaciones adicionales
 * @param {Date} camaData.fechaSiembra - Fecha de siembra
 * @param {Date} camaData.fechaEstimadaCosecha - Fecha estimada de cosecha
 * @param {string} createdBy - Email del usuario que crea la cama
 * @returns {Promise<string>} ID de la cama creada
 */
export const createCama = async (viveroId, camaData, createdBy) => {
    try {
        const {
            id,
            nombrePlanta,
            cantidadPlantas,
            sustrato,
            tarroSize,
            tarroUnidad,
            estado,
            observaciones,
            fechaSiembra,
            fechaEstimadaCosecha
        } = camaData;

        // Validar datos requeridos
        if (!viveroId) {
            throw new Error("ID del vivero es requerido");
        }

        if (!id || !nombrePlanta) {
            throw new Error("ID y nombre de la planta son requeridos");
        }

        // Verificar que el vivero existe
        const viveroRef = doc(db, "viveros", viveroId);
        const viveroDoc = await getDoc(viveroRef);

        if (!viveroDoc.exists()) {
            throw new Error(`Vivero no encontrado: ${viveroId}`);
        }

        // Verificar que la cama no existe
        const camaRef = doc(db, "viveros", viveroId, "camas", id);
        const existingCama = await getDoc(camaRef);

        if (existingCama.exists()) {
            throw new Error(`Ya existe una cama con ID: ${id} en el vivero ${viveroId}`);
        }

        console.log("🌿 Creando nueva cama:", nombrePlanta, "en vivero:", viveroId);

        // Obtener datos del vivero para el nombre completo
        const viveroData = viveroDoc.data();
        const nombreCompleto = `${viveroData.nombre} - Cama ${id}`;

        // Estructura completa de la cama según documentación v2.0
        const camaDocument = {
            id,
            viveroId,
            nombreCompleto,
            nombrePlanta,
            cantidadPlantas: cantidadPlantas || 0,
            sustrato: sustrato || "",
            tarroSize: tarroSize || 0,
            tarroUnidad: tarroUnidad || "pulgadas",
            estado: estado || "activa",
            observaciones: observaciones || "",
            fechaSiembra: fechaSiembra || null,
            fechaEstimadaCosecha: fechaEstimadaCosecha || null,
            estadisticas: {
                totalEsquejesHistorico: 0,
                ultimoCorte: null,
                totalCortes: 0
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy
        };

        await setDoc(camaRef, camaDocument);

        console.log("✅ Cama creada exitosamente:", id);
        return id;

    } catch (error) {
        console.error("❌ Error creando cama:", error.message);
        throw new Error(`Error al crear cama: ${error.message}`);
    }
};

/**
 * Obtiene una cama específica
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @returns {Promise<Object|null>} Datos de la cama o null si no existe
 */
export const getCama = async (viveroId, camaId) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        const camaDoc = await getDoc(camaRef);

        if (!camaDoc.exists()) {
            console.log("❌ Cama no encontrada:", camaId, "en vivero:", viveroId);
            return null;
        }

        const camaData = { id: camaDoc.id, ...camaDoc.data() };
        console.log("📄 Cama obtenida:", camaData.nombreCompleto);
        return camaData;

    } catch (error) {
        console.error("❌ Error obteniendo cama:", error.message);
        throw new Error(`Error al obtener cama: ${error.message}`);
    }
};

/**
 * Obtiene todas las camas de un vivero
 * @param {string} viveroId - ID del vivero
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.estado - Filtrar por estado específico
 * @param {number} options.limitResults - Límite de resultados
 * @param {string} options.orderBy - Campo para ordenar
 * @returns {Promise<Array>} Lista de camas del vivero
 */
export const getCamasFromVivero = async (viveroId, options = {}) => {
    try {
        if (!viveroId) {
            throw new Error("viveroId es requerido");
        }

        const {
            estado = null,
            limitResults = null,
            orderBy: orderField = "createdAt"
        } = options;

        console.log("📋 Obteniendo camas del vivero:", viveroId);

        const camasRef = collection(db, "viveros", viveroId, "camas");
        let q = query(camasRef, orderBy(orderField, "desc"));

        // Filtrar por estado si se especifica
        if (estado) {
            q = query(q, where("estado", "==", estado));
        }

        // Aplicar límite si se especifica
        if (limitResults) {
            q = query(q, limit(limitResults));
        }

        const querySnapshot = await getDocs(q);
        const camas = [];

        querySnapshot.forEach((doc) => {
            camas.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ ${camas.length} camas obtenidas del vivero ${viveroId}`);
        return camas;

    } catch (error) {
        console.error("❌ Error obteniendo camas del vivero:", error.message);
        throw new Error(`Error al obtener camas: ${error.message}`);
    }
};

/**
 * Obtiene todas las camas de todos los viveros (para búsquedas globales)
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.nombrePlanta - Filtrar por nombre de planta
 * @param {string} options.estado - Filtrar por estado
 * @param {number} options.limitResults - Límite de resultados
 * @returns {Promise<Array>} Lista de todas las camas
 */
export const getAllCamas = async (options = {}) => {
    try {
        const {
            nombrePlanta = null,
            estado = null,
            limitResults = 100
        } = options;

        console.log("🌍 Obteniendo todas las camas del sistema...");

        // Primero obtener todos los viveros
        const viverosRef = collection(db, "viveros");
        const viverosSnapshot = await getDocs(viverosRef);

        const allCamas = [];

        // Para cada vivero, obtener sus camas
        for (const viveroDoc of viverosSnapshot.docs) {
            const viveroId = viveroDoc.id;
            const camasRef = collection(db, "viveros", viveroId, "camas");
            let q = query(camasRef, orderBy("createdAt", "desc"));

            // Aplicar filtros
            if (estado) {
                q = query(q, where("estado", "==", estado));
            }

            if (nombrePlanta) {
                q = query(q, where("nombrePlanta", "==", nombrePlanta));
            }

            const camasSnapshot = await getDocs(q);

            camasSnapshot.forEach((doc) => {
                allCamas.push({
                    id: doc.id,
                    viveroId: viveroId,
                    ...doc.data()
                });
            });
        }

        // Ordenar por fecha de creación y aplicar límite
        const sortedCamas = allCamas
            .sort((a, b) => (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date()))
            .slice(0, limitResults);

        console.log(`✅ ${sortedCamas.length} camas obtenidas de todos los viveros`);
        return sortedCamas;

    } catch (error) {
        console.error("❌ Error obteniendo todas las camas:", error.message);
        throw new Error(`Error al obtener todas las camas: ${error.message}`);
    }
};

/**
 * Actualiza una cama existente
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {Object} updateData - Datos a actualizar
 * @param {string} updatedBy - Email del usuario que actualiza
 * @returns {Promise<void>}
 */
export const updateCama = async (viveroId, camaId, updateData, updatedBy) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);

        // Verificar que la cama existe
        const camaDoc = await getDoc(camaRef);
        if (!camaDoc.exists()) {
            throw new Error(`Cama no encontrada: ${camaId} en vivero ${viveroId}`);
        }

        console.log("🔄 Actualizando cama:", camaId, "en vivero:", viveroId);

        // Preparar datos de actualización
        const updatePayload = {
            ...updateData,
            updatedAt: serverTimestamp(),
            updatedBy
        };

        // No permitir actualizar ciertos campos críticos
        delete updatePayload.id;
        delete updatePayload.viveroId;
        delete updatePayload.createdAt;
        delete updatePayload.createdBy;

        // Si se actualiza el nombre de la planta, actualizar nombreCompleto
        if (updateData.nombrePlanta) {
            const viveroRef = doc(db, "viveros", viveroId);
            const viveroDoc = await getDoc(viveroRef);
            if (viveroDoc.exists()) {
                const viveroData = viveroDoc.data();
                updatePayload.nombreCompleto = `${viveroData.nombre} - Cama ${camaId}`;
            }
        }

        await updateDoc(camaRef, updatePayload);

        console.log("✅ Cama actualizada exitosamente");

    } catch (error) {
        console.error("❌ Error actualizando cama:", error.message);
        throw new Error(`Error al actualizar cama: ${error.message}`);
    }
};

/**
 * Elimina una cama y todos sus cortes de esquejes
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama a eliminar
 * @returns {Promise<void>}
 */
export const deleteCama = async (viveroId, camaId) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        console.log("🗑️ Eliminando cama:", camaId, "del vivero:", viveroId);

        const batch = writeBatch(db);
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);

        // Verificar que la cama existe
        const camaDoc = await getDoc(camaRef);
        if (!camaDoc.exists()) {
            throw new Error(`Cama no encontrada: ${camaId} en vivero ${viveroId}`);
        }

        // Obtener todos los cortes de esquejes de la cama para eliminarlos
        const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
        const cortesSnapshot = await getDocs(cortesRef);

        // Eliminar cada corte de esqueje
        cortesSnapshot.forEach((corteDoc) => {
            batch.delete(corteDoc.ref);
        });

        // Eliminar la cama
        batch.delete(camaRef);

        // Ejecutar todas las eliminaciones
        await batch.commit();

        console.log("✅ Cama eliminada completamente");

    } catch (error) {
        console.error("❌ Error eliminando cama:", error.message);
        throw new Error(`Error al eliminar cama: ${error.message}`);
    }
};

/**
 * Verifica si una cama existe
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @returns {Promise<boolean>} Si la cama existe
 */
export const camaExists = async (viveroId, camaId) => {
    try {
        if (!viveroId || !camaId) {
            return false;
        }

        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        const camaDoc = await getDoc(camaRef);
        return camaDoc.exists();
    } catch (error) {
        console.error("❌ Error verificando existencia de la cama:", error.message);
        return false;
    }
};

/**
 * Obtiene camas por nombre de planta específico
 * @param {string} nombrePlanta - Nombre de la planta a buscar
 * @param {Object} options - Opciones adicionales
 * @param {string} options.viveroId - Filtrar por vivero específico
 * @param {number} options.limitResults - Límite de resultados
 * @returns {Promise<Array>} Lista de camas con esa planta
 */
export const getCamasByPlanta = async (nombrePlanta, options = {}) => {
    try {
        if (!nombrePlanta) {
            throw new Error("Nombre de planta es requerido");
        }

        const { viveroId = null, limitResults = 50 } = options;

        console.log("🔍 Buscando camas con planta:", nombrePlanta);

        if (viveroId) {
            // Buscar solo en un vivero específico
            const camasRef = collection(db, "viveros", viveroId, "camas");
            const q = query(
                camasRef,
                where("nombrePlanta", "==", nombrePlanta),
                orderBy("createdAt", "desc"),
                limit(limitResults)
            );

            const querySnapshot = await getDocs(q);
            const camas = [];

            querySnapshot.forEach((doc) => {
                camas.push({
                    id: doc.id,
                    viveroId: viveroId,
                    ...doc.data()
                });
            });

            console.log(`✅ ${camas.length} camas encontradas con ${nombrePlanta} en vivero ${viveroId}`);
            return camas;

        } else {
            // Buscar en todos los viveros usando getAllCamas
            return await getAllCamas({ nombrePlanta, limitResults });
        }

    } catch (error) {
        console.error("❌ Error buscando camas por planta:", error.message);
        throw new Error(`Error al buscar camas por planta: ${error.message}`);
    }
};

/**
 * Actualiza el estado de múltiples camas
 * @param {string} viveroId - ID del vivero
 * @param {Array<string>} camaIds - Array de IDs de camas
 * @param {string} nuevoEstado - Nuevo estado para las camas
 * @param {string} updatedBy - Email del usuario que actualiza
 * @returns {Promise<Object>} Resultado de la actualización masiva
 */
export const updateMultipleCamasEstado = async (viveroId, camaIds, nuevoEstado, updatedBy) => {
    try {
        if (!viveroId || !Array.isArray(camaIds) || camaIds.length === 0) {
            throw new Error("viveroId y array de camaIds son requeridos");
        }

        console.log(`🔄 Actualizando estado de ${camaIds.length} camas a: ${nuevoEstado}`);

        const batch = writeBatch(db);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const camaId of camaIds) {
            try {
                const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
                
                batch.update(camaRef, {
                    estado: nuevoEstado,
                    updatedAt: serverTimestamp(),
                    updatedBy
                });

                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ camaId, error: error.message });
            }
        }

        await batch.commit();

        const result = {
            total: camaIds.length,
            success: successCount,
            errors: errorCount,
            errorDetails: errors
        };

        console.log(`✅ Actualización masiva completada: ${successCount} éxitos, ${errorCount} errores`);
        return result;

    } catch (error) {
        console.error("❌ Error en actualización masiva de camas:", error.message);
        throw error;
    }
};

/**
 * Obtiene estadísticas resumidas de camas por vivero
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<Object>} Estadísticas de camas del vivero
 */
export const getCamasStatsFromVivero = async (viveroId) => {
    try {
        if (!viveroId) {
            throw new Error("viveroId es requerido");
        }

        console.log("📊 Calculando estadísticas de camas del vivero:", viveroId);

        const camas = await getCamasFromVivero(viveroId);

        const stats = {
            totalCamas: camas.length,
            camasOcupadas: 0,
            camasLibres: 0,
            totalPlantas: 0,
            estadosCamas: {},
            plantasTipos: {},
            sustratosTipos: {}
        };

        camas.forEach(cama => {
            // Conteo por estado
            if (cama.cantidadPlantas && cama.cantidadPlantas > 0) {
                stats.camasOcupadas++;
            } else {
                stats.camasLibres++;
            }

            stats.totalPlantas += cama.cantidadPlantas || 0;

            // Estadísticas por estado
            const estado = cama.estado || 'sin_estado';
            stats.estadosCamas[estado] = (stats.estadosCamas[estado] || 0) + 1;

            // Estadísticas por tipo de planta
            const planta = cama.nombrePlanta || 'sin_planta';
            if (!stats.plantasTipos[planta]) {
                stats.plantasTipos[planta] = {
                    totalCamas: 0,
                    totalPlantas: 0
                };
            }
            stats.plantasTipos[planta].totalCamas++;
            stats.plantasTipos[planta].totalPlantas += cama.cantidadPlantas || 0;

            // Estadísticas por tipo de sustrato
            const sustrato = cama.sustrato || 'sin_sustrato';
            stats.sustratosTipos[sustrato] = (stats.sustratosTipos[sustrato] || 0) + 1;
        });

        console.log("✅ Estadísticas de camas calculadas:", stats);
        return stats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas de camas:", error.message);
        throw error;
    }
};

// Exports por defecto para facilitar importación
export default {
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