// src/firebase/camas/camaStatsService.js
import {
    doc,
    collection,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    limit
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * 📊 CAMA STATS SERVICE
 * ============================================================================
 * Responsabilidad: Cálculo y gestión de estadísticas de camas
 * - Cálculo de estadísticas de camas individuales
 * - Análisis de productividad de esquejes
 * - Estadísticas temporales y comparativas
 * - Resumen de rendimiento por planta
 * ============================================================================
 */

/**
 * Calcula estadísticas actualizadas de una cama basada en sus cortes
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @returns {Promise<Object>} Estadísticas calculadas de la cama
 */
export const calculateCamaStats = async (viveroId, camaId) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        console.log("📊 Calculando estadísticas de cama:", camaId, "en vivero:", viveroId);

        // Obtener todos los cortes de esquejes de la cama
        const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
        const q = query(cortesRef, orderBy("fecha", "desc"));
        const cortesSnapshot = await getDocs(q);

        let totalEsquejesHistorico = 0;
        let ultimoCorte = null;
        let totalCortes = cortesSnapshot.size;
        let fechaPrimerCorte = null;
        let promedioEsquejesPorCorte = 0;
        const cortesPorMes = {};
        const cortesDetalle = [];

        // Procesar cada corte
        cortesSnapshot.forEach((doc) => {
            const corte = doc.data();
            const cantidadEsquejes = corte.cantidadEsquejes || 0;

            totalEsquejesHistorico += cantidadEsquejes;

            // Información del último corte (más reciente)
            if (!ultimoCorte || (corte.fecha && corte.fecha > ultimoCorte)) {
                ultimoCorte = corte.fecha;
            }

            // Información del primer corte (más antiguo)
            if (!fechaPrimerCorte || (corte.fecha && corte.fecha < fechaPrimerCorte)) {
                fechaPrimerCorte = corte.fecha;
            }

            // Agrupar por mes para tendencias
            if (corte.fecha) {
                const fechaDate = corte.fecha.toDate();
                const mesKey = `${fechaDate.getFullYear()}-${String(fechaDate.getMonth() + 1).padStart(2, '0')}`;
                
                if (!cortesPorMes[mesKey]) {
                    cortesPorMes[mesKey] = {
                        totalCortes: 0,
                        totalEsquejes: 0,
                        mes: mesKey
                    };
                }
                
                cortesPorMes[mesKey].totalCortes++;
                cortesPorMes[mesKey].totalEsquejes += cantidadEsquejes;
            }

            // Detalle de cortes (últimos 10)
            cortesDetalle.push({
                id: doc.id,
                fecha: corte.fecha,
                cantidadEsquejes,
                responsable: corte.responsable,
                observaciones: corte.observaciones
            });
        });

        // Calcular promedio
        if (totalCortes > 0) {
            promedioEsquejesPorCorte = Math.round((totalEsquejesHistorico / totalCortes) * 100) / 100;
        }

        // Calcular productividad (esquejes por día desde primer corte)
        let productividadDiaria = 0;
        if (fechaPrimerCorte && ultimoCorte) {
            const diasTranscurridos = Math.max(1, Math.ceil((ultimoCorte.toDate() - fechaPrimerCorte.toDate()) / (1000 * 60 * 60 * 24)));
            productividadDiaria = Math.round((totalEsquejesHistorico / diasTranscurridos) * 100) / 100;
        }

        const stats = {
            totalEsquejesHistorico,
            ultimoCorte,
            fechaPrimerCorte,
            totalCortes,
            promedioEsquejesPorCorte,
            productividadDiaria,
            cortesPorMes: Object.values(cortesPorMes).sort((a, b) => a.mes.localeCompare(b.mes)),
            ultimosCortes: cortesDetalle.slice(0, 10), // Solo los últimos 10
            calculadoEn: serverTimestamp()
        };

        // Actualizar estadísticas en el documento de la cama
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        await updateDoc(camaRef, {
            "estadisticas": stats,
            updatedAt: serverTimestamp()
        });

        console.log("✅ Estadísticas de cama calculadas:", {
            totalEsquejes: totalEsquejesHistorico,
            totalCortes,
            promedio: promedioEsquejesPorCorte
        });

        return stats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas de cama:", error.message);
        throw new Error(`Error al calcular estadísticas de cama: ${error.message}`);
    }
};

/**
 * Obtiene estadísticas comparativas entre camas de un vivero
 * @param {string} viveroId - ID del vivero
 * @param {Object} options - Opciones de análisis
 * @param {number} options.limitTop - Límite para rankings (default: 10)
 * @param {string} options.ordenarPor - Campo para ordenar ('totalEsquejes', 'productividad', 'frecuencia')
 * @returns {Promise<Object>} Estadísticas comparativas
 */
export const getCamasComparativeStats = async (viveroId, options = {}) => {
    try {
        if (!viveroId) {
            throw new Error("viveroId es requerido");
        }

        const { limitTop = 10, ordenarPor = 'totalEsquejes' } = options;

        console.log("📊 Calculando estadísticas comparativas de camas del vivero:", viveroId);

        // Obtener todas las camas del vivero
        const camasRef = collection(db, "viveros", viveroId, "camas");
        const camasSnapshot = await getDocs(camasRef);

        const camasStats = [];
        let totalEsquejesVivero = 0;
        let totalCortesVivero = 0;

        // Procesar cada cama
        for (const camaDoc of camasSnapshot.docs) {
            const camaData = camaDoc.data();
            const camaId = camaDoc.id;

            // Calcular o obtener estadísticas actualizadas
            let stats;
            if (!camaData.estadisticas || !camaData.estadisticas.calculadoEn) {
                stats = await calculateCamaStats(viveroId, camaId);
            } else {
                stats = camaData.estadisticas;
            }

            const camaInfo = {
                camaId,
                nombrePlanta: camaData.nombrePlanta,
                nombreCompleto: camaData.nombreCompleto,
                cantidadPlantas: camaData.cantidadPlantas || 0,
                estado: camaData.estado,
                ...stats
            };

            camasStats.push(camaInfo);
            totalEsquejesVivero += stats.totalEsquejesHistorico || 0;
            totalCortesVivero += stats.totalCortes || 0;
        }

        // Ordenar según criterio
        const sortFunction = {
            'totalEsquejes': (a, b) => (b.totalEsquejesHistorico || 0) - (a.totalEsquejesHistorico || 0),
            'productividad': (a, b) => (b.productividadDiaria || 0) - (a.productividadDiaria || 0),
            'promedio': (a, b) => (b.promedioEsquejesPorCorte || 0) - (a.promedioEsquejesPorCorte || 0),
            'frecuencia': (a, b) => (b.totalCortes || 0) - (a.totalCortes || 0)
        };

        const sortedCamas = [...camasStats].sort(sortFunction[ordenarPor] || sortFunction['totalEsquejes']);

        // Calcular percentiles y rankings
        const rankings = {
            topProductivas: sortedCamas.slice(0, limitTop),
            topPorPromedio: [...camasStats].sort(sortFunction['promedio']).slice(0, limitTop),
            topPorFrecuencia: [...camasStats].sort(sortFunction['frecuencia']).slice(0, limitTop),
            menosProductivas: sortedCamas.slice(-Math.min(5, sortedCamas.length))
        };

        // Estadísticas del vivero
        const viveroStats = {
            totalCamas: camasStats.length,
            totalEsquejesVivero,
            totalCortesVivero,
            promedioEsquejesPorCama: camasStats.length > 0 ? Math.round((totalEsquejesVivero / camasStats.length) * 100) / 100 : 0,
            promedioCortePorCama: camasStats.length > 0 ? Math.round((totalCortesVivero / camasStats.length) * 100) / 100 : 0
        };

        // Análisis por tipo de planta
        const plantasAnalisis = {};
        camasStats.forEach(cama => {
            const planta = cama.nombrePlanta || 'Sin clasificar';
            if (!plantasAnalisis[planta]) {
                plantasAnalisis[planta] = {
                    nombrePlanta: planta,
                    totalCamas: 0,
                    totalEsquejes: 0,
                    totalCortes: 0,
                    promedioEsquejesPorCama: 0
                };
            }

            plantasAnalisis[planta].totalCamas++;
            plantasAnalisis[planta].totalEsquejes += cama.totalEsquejesHistorico || 0;
            plantasAnalisis[planta].totalCortes += cama.totalCortes || 0;
        });

        // Calcular promedios por planta
        Object.values(plantasAnalisis).forEach(planta => {
            if (planta.totalCamas > 0) {
                planta.promedioEsquejesPorCama = Math.round((planta.totalEsquejes / planta.totalCamas) * 100) / 100;
            }
        });

        const result = {
            viveroStats,
            rankings,
            plantasAnalisis: Object.values(plantasAnalisis).sort((a, b) => b.totalEsquejes - a.totalEsquejes),
            todasLasCamas: sortedCamas,
            calculadoEn: new Date()
        };

        console.log("✅ Estadísticas comparativas calculadas:", {
            totalCamas: viveroStats.totalCamas,
            totalEsquejes: viveroStats.totalEsquejesVivero,
            topPlanta: result.plantasAnalisis[0]?.nombrePlanta
        });

        return result;

    } catch (error) {
        console.error("❌ Error calculando estadísticas comparativas:", error.message);
        throw new Error(`Error al calcular estadísticas comparativas: ${error.message}`);
    }
};

/**
 * Obtiene tendencias temporales de producción de esquejes de una cama
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {Object} options - Opciones de análisis temporal
 * @param {string} options.periodo - Período de análisis ('diario', 'semanal', 'mensual')
 * @param {number} options.ultimosPeriodos - Número de períodos a analizar
 * @returns {Promise<Object>} Tendencias temporales
 */
export const getCamaTrendAnalysis = async (viveroId, camaId, options = {}) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        const { periodo = 'mensual', ultimosPeriodos = 12 } = options;

        console.log("📈 Analizando tendencias de cama:", camaId, "período:", periodo);

        // Obtener todos los cortes de la cama
        const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
        const q = query(cortesRef, orderBy("fecha", "asc"));
        const cortesSnapshot = await getDocs(q);

        const cortesData = [];
        cortesSnapshot.forEach((doc) => {
            const corte = doc.data();
            if (corte.fecha) {
                cortesData.push({
                    fecha: corte.fecha.toDate(),
                    cantidadEsquejes: corte.cantidadEsquejes || 0,
                    responsable: corte.responsable
                });
            }
        });

        if (cortesData.length === 0) {
            return {
                tendencias: [],
                resumen: {
                    totalPeriodos: 0,
                    promedioProgresión: 0,
                    tendenciaGeneral: 'sin_datos'
                }
            };
        }

        // Agrupar datos según el período
        const agrupados = {};
        
        cortesData.forEach(corte => {
            let periodoKey;
            const fecha = corte.fecha;

            switch (periodo) {
                case 'diario':
                    periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                    break;
                case 'semanal':
                    const startOfWeek = new Date(fecha);
                    startOfWeek.setDate(fecha.getDate() - fecha.getDay());
                    periodoKey = `${startOfWeek.getFullYear()}-S${Math.ceil(startOfWeek.getDate() / 7)}`;
                    break;
                case 'mensual':
                default:
                    periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                    break;
            }

            if (!agrupados[periodoKey]) {
                agrupados[periodoKey] = {
                    periodo: periodoKey,
                    totalEsquejes: 0,
                    totalCortes: 0,
                    fechaInicio: fecha,
                    fechaFin: fecha
                };
            }

            agrupados[periodoKey].totalEsquejes += corte.cantidadEsquejes;
            agrupados[periodoKey].totalCortes++;
            
            // Actualizar fechas de rango
            if (fecha < agrupados[periodoKey].fechaInicio) {
                agrupados[periodoKey].fechaInicio = fecha;
            }
            if (fecha > agrupados[periodoKey].fechaFin) {
                agrupados[periodoKey].fechaFin = fecha;
            }
        });

        // Convertir a array y ordenar por período
        const tendencias = Object.values(agrupados)
            .sort((a, b) => a.periodo.localeCompare(b.periodo))
            .slice(-ultimosPeriodos); // Solo los últimos períodos

        // Calcular promedios y tendencia
        const promedios = tendencias.map(t => t.totalEsquejes);
        let tendenciaGeneral = 'estable';
        let promedioProgresión = 0;

        if (promedios.length >= 2) {
            const primeraMitad = promedios.slice(0, Math.ceil(promedios.length / 2));
            const segundaMitad = promedios.slice(Math.floor(promedios.length / 2));
            
            const promedioPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
            const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
            
            promedioProgresión = Math.round(((promedioSegunda - promedioPrimera) / promedioPrimera) * 10000) / 100;
            
            if (promedioProgresión > 5) tendenciaGeneral = 'creciente';
            else if (promedioProgresión < -5) tendenciaGeneral = 'decreciente';
        }

        const result = {
            tendencias,
            resumen: {
                totalPeriodos: tendencias.length,
                promedioEsquejesPorPeriodo: tendencias.length > 0 
                    ? Math.round((tendencias.reduce((sum, t) => sum + t.totalEsquejes, 0) / tendencias.length) * 100) / 100
                    : 0,
                maxEsquejesEnPeriodo: Math.max(...tendencias.map(t => t.totalEsquejes), 0),
                minEsquejesEnPeriodo: Math.min(...tendencias.map(t => t.totalEsquejes), 0),
                promedioProgresion: promedioProgresión,
                tendenciaGeneral,
                periodoAnalisis: periodo,
                ultimosPeriodos
            },
            calculadoEn: new Date()
        };

        console.log("✅ Análisis de tendencias completado:", {
            periodos: tendencias.length,
            tendencia: tendenciaGeneral,
            progresion: `${promedioProgresión}%`
        });

        return result;

    } catch (error) {
        console.error("❌ Error analizando tendencias de cama:", error.message);
        throw new Error(`Error al analizar tendencias: ${error.message}`);
    }
};

/**
 * Recalcula estadísticas de múltiples camas
 * @param {string} viveroId - ID del vivero
 * @param {Array<string>} camaIds - Array de IDs de camas (opcional, todas si no se especifica)
 * @returns {Promise<Object>} Resultado del recálculo
 */
export const recalculateMultipleCamasStats = async (viveroId, camaIds = null) => {
    try {
        if (!viveroId) {
            throw new Error("viveroId es requerido");
        }

        console.log("🔄 Recalculando estadísticas de camas del vivero:", viveroId);

        let targetCamaIds = camaIds;

        // Si no se especifican camas, obtener todas las del vivero
        if (!targetCamaIds) {
            const camasRef = collection(db, "viveros", viveroId, "camas");
            const camasSnapshot = await getDocs(camasRef);
            targetCamaIds = camasSnapshot.docs.map(doc => doc.id);
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const camaId of targetCamaIds) {
            try {
                await calculateCamaStats(viveroId, camaId);
                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ camaId, error: error.message });
                console.error(`❌ Error recalculando cama ${camaId}:`, error.message);
            }
        }

        const result = {
            viveroId,
            total: targetCamaIds.length,
            success: successCount,
            errors: errorCount,
            errorDetails: errors
        };

        console.log(`✅ Recálculo completado: ${successCount} éxitos, ${errorCount} errores`);
        return result;

    } catch (error) {
        console.error("❌ Error en recálculo múltiple de camas:", error.message);
        throw error;
    }
};

/**
 * Obtiene un ranking de camas más productivas del sistema
 * @param {Object} options - Opciones del ranking
 * @param {number} options.limit - Límite de resultados (default: 20)
 * @param {string} options.periodo - Período para filtrar ('ultimo_mes', 'ultimos_3_meses', 'todo')
 * @param {string} options.criterio - Criterio de ranking ('total_esquejes', 'productividad_diaria', 'promedio_corte')
 * @returns {Promise<Array>} Ranking de camas más productivas
 */
export const getTopProductiveCamas = async (options = {}) => {
    try {
        const {
            limit = 20,
            periodo = 'todo',
            criterio = 'total_esquejes'
        } = options;

        console.log("🏆 Obteniendo ranking de camas más productivas...");

        // Obtener todos los viveros para acceder a todas las camas
        const viverosRef = collection(db, "viveros");
        const viverosSnapshot = await getDocs(viverosRef);

        const todasLasCamas = [];

        // Procesar cada vivero
        for (const viveroDoc of viverosSnapshot.docs) {
            const viveroId = viveroDoc.id;
            const viveroData = viveroDoc.data();

            const camasRef = collection(db, "viveros", viveroId, "camas");
            const camasSnapshot = await getDocs(camasRef);

            // Procesar cada cama del vivero
            for (const camaDoc of camasSnapshot.docs) {
                const camaData = camaDoc.data();
                const camaId = camaDoc.id;

                // Asegurar que las estadísticas estén actualizadas
                let stats = camaData.estadisticas;
                if (!stats || !stats.calculadoEn) {
                    try {
                        stats = await calculateCamaStats(viveroId, camaId);
                    } catch (error) {
                        console.warn(`⚠️ Error calculando stats de cama ${camaId}:`, error.message);
                        continue;
                    }
                }

                // Aplicar filtro de período si es necesario
                let incluirCama = true;
                if (periodo !== 'todo' && stats.ultimoCorte) {
                    const fechaUltimoCorte = stats.ultimoCorte.toDate();
                    const ahora = new Date();
                    const diferenciaDias = (ahora - fechaUltimoCorte) / (1000 * 60 * 60 * 24);

                    switch (periodo) {
                        case 'ultimo_mes':
                            incluirCama = diferenciaDias <= 30;
                            break;
                        case 'ultimos_3_meses':
                            incluirCama = diferenciaDias <= 90;
                            break;
                    }
                }

                if (incluirCama && stats.totalEsquejesHistorico > 0) {
                    todasLasCamas.push({
                        camaId,
                        viveroId,
                        viveroNombre: viveroData.nombre,
                        nombreCompleto: camaData.nombreCompleto || `${viveroData.nombre} - Cama ${camaId}`,
                        nombrePlanta: camaData.nombrePlanta,
                        cantidadPlantas: camaData.cantidadPlantas || 0,
                        estado: camaData.estado,
                        totalEsquejesHistorico: stats.totalEsquejesHistorico || 0,
                        productividadDiaria: stats.productividadDiaria || 0,
                        promedioEsquejesPorCorte: stats.promedioEsquejesPorCorte || 0,
                        totalCortes: stats.totalCortes || 0,
                        ultimoCorte: stats.ultimoCorte,
                        fechaPrimerCorte: stats.fechaPrimerCorte
                    });
                }
            }
        }

        // Ordenar según criterio
        const sortFunctions = {
            'total_esquejes': (a, b) => b.totalEsquejesHistorico - a.totalEsquejesHistorico,
            'productividad_diaria': (a, b) => b.productividadDiaria - a.productividadDiaria,
            'promedio_corte': (a, b) => b.promedioEsquejesPorCorte - a.promedioEsquejesPorCorte
        };

        const ranking = todasLasCamas
            .sort(sortFunctions[criterio] || sortFunctions['total_esquejes'])
            .slice(0, limit)
            .map((cama, index) => ({
                posicion: index + 1,
                ...cama
            }));

        console.log(`✅ Ranking calculado: ${ranking.length} camas en el top`);
        return ranking;

    } catch (error) {
        console.error("❌ Error obteniendo ranking de camas productivas:", error.message);
        throw new Error(`Error al obtener ranking: ${error.message}`);
    }
};

/**
 * Genera reporte de rendimiento de una cama específica
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @returns {Promise<Object>} Reporte completo de rendimiento
 */
export const generateCamaPerformanceReport = async (viveroId, camaId) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        console.log("📋 Generando reporte de rendimiento para cama:", camaId);

        // Obtener datos básicos de la cama
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        const camaDoc = await getDoc(camaRef);

        if (!camaDoc.exists()) {
            throw new Error(`Cama no encontrada: ${camaId} en vivero ${viveroId}`);
        }

        const camaData = camaDoc.data();

        // Calcular estadísticas actualizadas
        const stats = await calculateCamaStats(viveroId, camaId);

        // Obtener análisis de tendencias
        const tendenciasMensual = await getCamaTrendAnalysis(viveroId, camaId, {
            periodo: 'mensual',
            ultimosPeriodos: 12
        });

        // Obtener estadísticas comparativas del vivero para contexto
        const statsComparativas = await getCamasComparativeStats(viveroId);
        const posicionEnVivero = statsComparativas.todasLasCamas.findIndex(c => c.camaId === camaId) + 1;

        // Calcular métricas adicionales
        const metricas = {
            eficienciaPlanta: stats.totalEsquejesHistorico > 0 && camaData.cantidadPlantas > 0
                ? Math.round((stats.totalEsquejesHistorico / camaData.cantidadPlantas) * 100) / 100
                : 0,
            
            diasEnProduccion: stats.fechaPrimerCorte && stats.ultimoCorte
                ? Math.ceil((stats.ultimoCorte.toDate() - stats.fechaPrimerCorte.toDate()) / (1000 * 60 * 60 * 24))
                : 0,
                
            frecuenciaCorte: stats.totalCortes > 1 && stats.fechaPrimerCorte && stats.ultimoCorte
                ? Math.round((stats.totalCortes - 1) / Math.max(1, Math.ceil((stats.ultimoCorte.toDate() - stats.fechaPrimerCorte.toDate()) / (1000 * 60 * 60 * 24))) * 30 * 100) / 100
                : 0
        };

        // Determinar nivel de rendimiento
        let nivelRendimiento = 'bajo';
        if (stats.totalEsquejesHistorico >= statsComparativas.viveroStats.promedioEsquejesPorCama * 1.5) {
            nivelRendimiento = 'excelente';
        } else if (stats.totalEsquejesHistorico >= statsComparativas.viveroStats.promedioEsquejesPorCama) {
            nivelRendimiento = 'bueno';
        } else if (stats.totalEsquejesHistorico >= statsComparativas.viveroStats.promedioEsquejesPorCama * 0.5) {
            nivelRendimiento = 'regular';
        }

        const reporte = {
            // Información básica
            cama: {
                id: camaId,
                viveroId,
                nombreCompleto: camaData.nombreCompleto,
                nombrePlanta: camaData.nombrePlanta,
                cantidadPlantas: camaData.cantidadPlantas,
                estado: camaData.estado,
                sustrato: camaData.sustrato,
                fechaSiembra: camaData.fechaSiembra,
                fechaEstimadaCosecha: camaData.fechaEstimadaCosecha
            },

            // Estadísticas principales
            estadisticas: stats,

            // Métricas calculadas
            metricas,

            // Análisis de tendencias
            tendencias: tendenciasMensual,

            // Contexto comparativo
            contexto: {
                posicionEnVivero,
                totalCamasEnVivero: statsComparativas.viveroStats.totalCamas,
                promedioVivero: statsComparativas.viveroStats.promedioEsquejesPorCama,
                nivelRendimiento
            },

            // Recomendaciones básicas
            recomendaciones: generateRecommendations(camaData, stats, metricas, tendenciasMensual.resumen),

            // Metadatos del reporte
            reporteGenerado: new Date(),
            version: '1.0'
        };

        console.log("✅ Reporte de rendimiento generado:", {
            totalEsquejes: stats.totalEsquejesHistorico,
            nivelRendimiento,
            posicion: posicionEnVivero
        });

        return reporte;

    } catch (error) {
        console.error("❌ Error generando reporte de rendimiento:", error.message);
        throw error;
    }
};

/**
 * Genera recomendaciones básicas basadas en el rendimiento de la cama
 * @param {Object} camaData - Datos básicos de la cama
 * @param {Object} stats - Estadísticas de la cama
 * @param {Object} metricas - Métricas calculadas
 * @param {Object} tendencias - Resumen de tendencias
 * @returns {Array} Lista de recomendaciones
 */
const generateRecommendations = (camaData, stats, metricas, tendencias) => {
    const recomendaciones = [];

    // Recomendaciones por productividad
    if (stats.totalCortes === 0) {
        recomendaciones.push({
            tipo: 'accion',
            prioridad: 'alta',
            mensaje: 'Esta cama no tiene registros de cortes de esquejes. Considere realizar el primer corte si las plantas están listas.'
        });
    } else if (metricas.eficienciaPlanta < 5) {
        recomendaciones.push({
            tipo: 'mejora',
            prioridad: 'media',
            mensaje: 'La eficiencia por planta es baja. Revise las condiciones de cultivo y considere optimizar el sustrato o cuidados.'
        });
    }

    // Recomendaciones por frecuencia
    if (metricas.frecuenciaCorte < 1 && stats.totalCortes > 0) {
        recomendaciones.push({
            tipo: 'frecuencia',
            prioridad: 'media',
            mensaje: 'La frecuencia de cortes es baja. Considere aumentar la frecuencia si las plantas lo permiten.'
        });
    }

    // Recomendaciones por tendencia
    if (tendencias.tendenciaGeneral === 'decreciente') {
        recomendaciones.push({
            tipo: 'alerta',
            prioridad: 'alta',
            mensaje: 'La producción de esquejes muestra tendencia decreciente. Revise las condiciones de la cama.'
        });
    }

    // Recomendaciones por estado
    if (camaData.estado !== 'activa') {
        recomendaciones.push({
            tipo: 'estado',
            prioridad: 'media',
            mensaje: `La cama está en estado "${camaData.estado}". Considere activarla si está lista para producción.`
        });
    }

    // Si no hay recomendaciones, agregar una positiva
    if (recomendaciones.length === 0) {
        recomendaciones.push({
            tipo: 'felicitacion',
            prioridad: 'info',
            mensaje: 'La cama muestra un rendimiento satisfactorio. Continúe con las prácticas actuales de manejo.'
        });
    }

    return recomendaciones;
};

// Exports por defecto
export default {
    calculateCamaStats,
    getCamasComparativeStats,
    getCamaTrendAnalysis,
    recalculateMultipleCamasStats,
    getTopProductiveCamas,
    generateCamaPerformanceReport
};