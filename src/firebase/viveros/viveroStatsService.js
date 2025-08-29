// src/firebase/viveros/viveroStatsService.js
import {
    doc,
    collection,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * 📊 VIVERO STATS SERVICE
 * ============================================================================
 * Responsabilidad: Cálculo y gestión de estadísticas de viveros
 * - Cálculo de estadísticas de viveros
 * - Cálculo de estadísticas de camas
 * - Resumen de plantas por tipo
 * - Actualización automática de métricas
 * ============================================================================
 */

/**
 * Calcula estadísticas actualizadas de un vivero
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<Object>} Estadísticas calculadas
 */
export const calculateViveroStats = async (viveroId) => {
    try {
        console.log("📊 Calculando estadísticas del vivero:", viveroId);

        // Obtener todas las camas del vivero
        const camasRef = collection(db, "viveros", viveroId, "camas");
        const camasSnapshot = await getDocs(camasRef);

        let totalCamas = camasSnapshot.size;
        let camasOcupadas = 0;
        let totalPlantas = 0;
        let totalEsquejesHistorico = 0;

        // Procesar cada cama para obtener estadísticas
        for (const camaDoc of camasSnapshot.docs) {
            const camaData = camaDoc.data();

            // Contar camas ocupadas (que tienen plantas)
            if (camaData.cantidadPlantas && camaData.cantidadPlantas > 0) {
                camasOcupadas++;
            }

            totalPlantas += camaData.cantidadPlantas || 0;

            // Obtener estadísticas de cortes de esquejes
            const camaStats = await calculateCamaStats(viveroId, camaDoc.id);
            totalEsquejesHistorico += camaStats.totalEsquejesHistorico || 0;
        }

        const stats = {
            totalCamas,
            camasOcupadas,
            camasLibres: totalCamas - camasOcupadas,
            totalPlantas,
            totalEsquejesHistorico,
            ultimaActualizacion: serverTimestamp()
        };

        // Actualizar las estadísticas en el documento del vivero
        const viveroRef = doc(db, "viveros", viveroId);
        await updateDoc(viveroRef, {
            "estadisticas": stats,
            updatedAt: serverTimestamp()
        });

        console.log("✅ Estadísticas calculadas:", stats);
        return stats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas del vivero:", error.message);
        throw new Error(`Error al calcular estadísticas: ${error.message}`);
    }
};

/**
 * Calcula estadísticas de una cama específica basada en sus cortes
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @returns {Promise<Object>} Estadísticas de la cama
 */
export const calculateCamaStats = async (viveroId, camaId) => {
    try {
        const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
        const q = query(cortesRef, orderBy("fecha", "desc"));
        const cortesSnapshot = await getDocs(q);

        let totalEsquejesHistorico = 0;
        let ultimoCorte = null;
        let totalCortes = cortesSnapshot.size;

        cortesSnapshot.forEach((doc) => {
            const corte = doc.data();
            totalEsquejesHistorico += corte.cantidadEsquejes || 0;

            // Obtener la fecha del último corte
            if (!ultimoCorte || (corte.fecha && corte.fecha > ultimoCorte)) {
                ultimoCorte = corte.fecha;
            }
        });

        const stats = {
            totalEsquejesHistorico,
            ultimoCorte,
            totalCortes
        };

        // Actualizar estadísticas en el documento de la cama
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        await updateDoc(camaRef, {
            "estadisticas": stats,
            updatedAt: serverTimestamp()
        });

        return stats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas de cama:", error.message);
        throw error;
    }
};

/**
 * Obtiene estadísticas resumidas de las plantas en un vivero
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<Array>} Resumen de plantas por tipo
 */
export const getViveroPlantasSummary = async (viveroId) => {
    try {
        console.log("📊 Calculando resumen de plantas del vivero:", viveroId);

        const camasRef = collection(db, "viveros", viveroId, "camas");
        const camasSnapshot = await getDocs(camasRef);

        const plantasSummary = {};

        // Procesar cada cama
        for (const camaDoc of camasSnapshot.docs) {
            const camaData = camaDoc.data();
            const planta = camaData.nombrePlanta || "Sin clasificar";

            if (!plantasSummary[planta]) {
                plantasSummary[planta] = {
                    nombrePlanta: planta,
                    totalCamas: 0,
                    totalPlantas: 0,
                    totalEsquejesHistorico: 0
                };
            }

            plantasSummary[planta].totalCamas += 1;
            plantasSummary[planta].totalPlantas += camaData.cantidadPlantas || 0;

            // Obtener estadísticas de esquejes de la cama
            const camaStats = await calculateCamaStats(viveroId, camaDoc.id);
            plantasSummary[planta].totalEsquejesHistorico += camaStats.totalEsquejesHistorico || 0;
        }

        // Convertir a array y ordenar por productividad
        const result = Object.values(plantasSummary).sort((a, b) =>
            b.totalEsquejesHistorico - a.totalEsquejesHistorico
        );

        console.log(`✅ Resumen calculado: ${result.length} tipos de plantas`);
        return result;

    } catch (error) {
        console.error("❌ Error calculando resumen de plantas:", error.message);
        throw new Error(`Error al calcular resumen de plantas: ${error.message}`);
    }
};

/**
 * Obtiene un vivero con estadísticas actualizadas
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<Object|null>} Vivero con estadísticas actualizadas
 */
export const getViveroWithUpdatedStats = async (viveroId) => {
    try {
        // Importar dinámicamente para evitar dependencias circulares
        const { getVivero } = await import('./viveroService.js');

        // Primero calcular estadísticas actualizadas
        const stats = await calculateViveroStats(viveroId);

        // Luego obtener el vivero con las estadísticas ya actualizadas
        const vivero = await getVivero(viveroId);

        if (vivero) {
            vivero.estadisticas = { ...vivero.estadisticas, ...stats };
        }

        return vivero;

    } catch (error) {
        console.error("❌ Error obteniendo vivero con estadísticas:", error.message);
        throw error;
    }
};

/**
 * Recalcula estadísticas de múltiples viveros
 * @param {Array<string>} viveroIds - Array de IDs de viveros
 * @returns {Promise<Object>} Resultado del recálculo
 */
export const recalculateMultipleViverosStats = async (viveroIds) => {
    try {
        console.log(`🔄 Recalculando estadísticas de ${viveroIds.length} viveros...`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const viveroId of viveroIds) {
            try {
                await calculateViveroStats(viveroId);
                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ viveroId, error: error.message });
                console.error(`❌ Error recalculando vivero ${viveroId}:`, error.message);
            }
        }

        const result = {
            total: viveroIds.length,
            success: successCount,
            errors: errorCount,
            errorDetails: errors
        };

        console.log(`✅ Recálculo completado: ${successCount} éxitos, ${errorCount} errores`);
        return result;

    } catch (error) {
        console.error("❌ Error en recálculo múltiple:", error.message);
        throw error;
    }
};

/**
 * Obtiene estadísticas generales de todos los viveros del sistema
 * @returns {Promise<Object>} Estadísticas globales
 */
export const getGlobalViverosStats = async () => {
    try {
        console.log("🌍 Calculando estadísticas globales del sistema...");

        const { getAllViveros } = await import('./viveroService.js');
        const viveros = await getAllViveros();

        let totalViveros = viveros.length;
        let totalCamas = 0;
        let totalPlantas = 0;
        let totalEsquejesHistorico = 0;
        let viverosActivos = 0;

        viveros.forEach(vivero => {
            const stats = vivero.estadisticas || {};

            totalCamas += stats.totalCamas || 0;
            totalPlantas += stats.totalPlantas || 0;
            totalEsquejesHistorico += stats.totalEsquejesHistorico || 0;

            // Considerar activo si tiene camas con plantas
            if (stats.camasOcupadas > 0) {
                viverosActivos++;
            }
        });

        const globalStats = {
            totalViveros,
            viverosActivos,
            viverosInactivos: totalViveros - viverosActivos,
            totalCamas,
            totalPlantas,
            totalEsquejesHistorico,
            promedioCamasPorVivero: totalViveros > 0 ? (totalCamas / totalViveros).toFixed(1) : 0,
            promedioPlantasPorVivero: totalViveros > 0 ? (totalPlantas / totalViveros).toFixed(1) : 0,
            calculadoEn: new Date()
        };

        console.log("✅ Estadísticas globales calculadas:", globalStats);
        return globalStats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas globales:", error.message);
        throw error;
    }
};

// Exports por defecto
export default {
    calculateViveroStats,
    calculateCamaStats,
    getViveroPlantasSummary,
    getViveroWithUpdatedStats,
    recalculateMultipleViverosStats,
    getGlobalViverosStats
};