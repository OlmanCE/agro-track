// src/firebase/camas/cortesService.js
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
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * ✂️ CORTES SERVICE - Gestión de Esquejes
 * ============================================================================
 * Responsabilidad: Gestión completa de cortes de esquejes
 * - CRUD de cortes de esquejes dentro de camas
 * - Tracking dinámico de producción
 * - Validaciones de datos y fechas
 * - Operaciones de lote para múltiples cortes
 * ============================================================================
 */

/**
 * Crea un nuevo corte de esquejes en una cama específica
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {Object} corteData - Datos del corte
 * @param {Date|Timestamp} corteData.fecha - Fecha del corte
 * @param {number} corteData.cantidadEsquejes - Cantidad de esquejes cortados
 * @param {string} corteData.observaciones - Observaciones del corte
 * @param {string} corteData.responsable - Nombre del responsable del corte
 * @param {string} createdBy - Email del usuario que registra el corte
 * @returns {Promise<string>} ID del corte creado
 */
export const createCorte = async (viveroId, camaId, corteData, createdBy) => {
    try {
        const { fecha, cantidadEsquejes, observaciones, responsable } = corteData;

        // Validar datos requeridos
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        if (!fecha || !cantidadEsquejes || cantidadEsquejes <= 0) {
            throw new Error("Fecha y cantidad de esquejes son requeridos (cantidad > 0)");
        }

        // Verificar que la cama existe
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        const camaDoc = await getDoc(camaRef);

        if (!camaDoc.exists()) {
            throw new Error(`Cama no encontrada: ${camaId} en vivero ${viveroId}`);
        }

        // Convertir fecha si es necesario
        const fechaTimestamp = fecha instanceof Timestamp ? fecha : Timestamp.fromDate(new Date(fecha));

        // Generar ID único para el corte basado en fecha y timestamp
        const fechaStr = fechaTimestamp.toDate().toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = Date.now().toString().slice(-3);
        const corteId = `corte_${fechaStr}_${timeStr}`;

        console.log("✂️ Creando nuevo corte:", corteId, "- Esquejes:", cantidadEsquejes);

        // Estructura del corte según documentación v2.0
        const corteDocument = {
            id: corteId,
            fecha: fechaTimestamp,
            cantidadEsquejes: parseInt(cantidadEsquejes),
            observaciones: observaciones || "",
            responsable: responsable || "",
            createdAt: serverTimestamp(),
            createdBy
        };

        // Crear el corte
        const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);
        await setDoc(corteRef, corteDocument);

        console.log("✅ Corte creado exitosamente:", corteId);
        return corteId;

    } catch (error) {
        console.error("❌ Error creando corte:", error.message);
        throw new Error(`Error al crear corte: ${error.message}`);
    }
};

/**
 * Obtiene un corte específico
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {string} corteId - ID del corte
 * @returns {Promise<Object|null>} Datos del corte o null si no existe
 */
export const getCorte = async (viveroId, camaId, corteId) => {
    try {
        if (!viveroId || !camaId || !corteId) {
            throw new Error("viveroId, camaId y corteId son requeridos");
        }

        const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);
        const corteDoc = await getDoc(corteRef);

        if (!corteDoc.exists()) {
            console.log("❌ Corte no encontrado:", corteId);
            return null;
        }

        const corteData = { id: corteDoc.id, ...corteDoc.data() };
        console.log("📄 Corte obtenido:", corteData.id, "- Esquejes:", corteData.cantidadEsquejes);
        return corteData;

    } catch (error) {
        console.error("❌ Error obteniendo corte:", error.message);
        throw new Error(`Error al obtener corte: ${error.message}`);
    }
};

/**
 * Obtiene todos los cortes de una cama
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {Object} options - Opciones de filtrado
 * @param {Date} options.fechaDesde - Filtrar desde fecha
 * @param {Date} options.fechaHasta - Filtrar hasta fecha
 * @param {number} options.limitResults - Límite de resultados
 * @param {string} options.orderBy - Campo para ordenar ('fecha', 'cantidadEsquejes')
 * @param {string} options.orderDirection - Dirección del orden ('asc', 'desc')
 * @returns {Promise<Array>} Lista de cortes de la cama
 */
export const getCortesFromCama = async (viveroId, camaId, options = {}) => {
    try {
        if (!viveroId || !camaId) {
            throw new Error("viveroId y camaId son requeridos");
        }

        const {
            fechaDesde = null,
            fechaHasta = null,
            limitResults = null,
            orderBy: orderField = "fecha",
            orderDirection = "desc"
        } = options;

        console.log("📋 Obteniendo cortes de cama:", camaId, "en vivero:", viveroId);

        const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
        let q = query(cortesRef, orderBy(orderField, orderDirection));

        // Filtrar por rango de fechas si se especifica
        if (fechaDesde) {
            const fechaDesdeTimestamp = Timestamp.fromDate(new Date(fechaDesde));
            q = query(q, where("fecha", ">=", fechaDesdeTimestamp));
        }

        if (fechaHasta) {
            const fechaHastaTimestamp = Timestamp.fromDate(new Date(fechaHasta));
            q = query(q, where("fecha", "<=", fechaHastaTimestamp));
        }

        // Aplicar límite si se especifica
        if (limitResults) {
            q = query(q, limit(limitResults));
        }

        const querySnapshot = await getDocs(q);
        const cortes = [];

        querySnapshot.forEach((doc) => {
            cortes.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ ${cortes.length} cortes obtenidos de la cama ${camaId}`);
        return cortes;

    } catch (error) {
        console.error("❌ Error obteniendo cortes de la cama:", error.message);
        throw new Error(`Error al obtener cortes: ${error.message}`);
    }
};

/**
 * Obtiene todos los cortes de un vivero (de todas sus camas)
 * @param {string} viveroId - ID del vivero
 * @param {Object} options - Opciones de filtrado
 * @param {Date} options.fechaDesde - Filtrar desde fecha
 * @param {Date} options.fechaHasta - Filtrar hasta fecha
 * @param {number} options.limitResults - Límite de resultados
 * @param {string} options.responsable - Filtrar por responsable
 * @returns {Promise<Array>} Lista de cortes del vivero con información de cama
 */
export const getCortesFromVivero = async (viveroId, options = {}) => {
    try {
        if (!viveroId) {
            throw new Error("viveroId es requerido");
        }

        const {
            fechaDesde = null,
            fechaHasta = null,
            limitResults = 100,
            responsable = null
        } = options;

        console.log("🌍 Obteniendo todos los cortes del vivero:", viveroId);

        // Obtener todas las camas del vivero
        const camasRef = collection(db, "viveros", viveroId, "camas");
        const camasSnapshot = await getDocs(camasRef);

        const todosLosCortes = [];

        // Para cada cama, obtener sus cortes
        for (const camaDoc of camasSnapshot.docs) {
            const camaId = camaDoc.id;
            const camaData = camaDoc.data();

            try {
                const cortesCama = await getCortesFromCama(viveroId, camaId, {
                    fechaDesde,
                    fechaHasta,
                    limitResults: null // Obtenemos todos y luego limitamos globalmente
                });

                // Agregar información de la cama a cada corte
                cortesCama.forEach(corte => {
                    if (!responsable || corte.responsable === responsable) {
                        todosLosCortes.push({
                            ...corte,
                            camaId,
                            viveroId,
                            nombrePlanta: camaData.nombrePlanta,
                            nombreCompleto: camaData.nombreCompleto
                        });
                    }
                });
            } catch (error) {
                console.warn(`⚠️ Error obteniendo cortes de cama ${camaId}:`, error.message);
                continue;
            }
        }

        // Ordenar por fecha (más reciente primero) y aplicar límite
        const cortesOrdenados = todosLosCortes
            .sort((a, b) => {
                const fechaA = a.fecha?.toDate() || new Date(0);
                const fechaB = b.fecha?.toDate() || new Date(0);
                return fechaB - fechaA;
            })
            .slice(0, limitResults);

        console.log(`✅ ${cortesOrdenados.length} cortes obtenidos del vivero ${viveroId}`);
        return cortesOrdenados;

    } catch (error) {
        console.error("❌ Error obteniendo cortes del vivero:", error.message);
        throw new Error(`Error al obtener cortes del vivero: ${error.message}`);
    }
};

/**
 * Actualiza un corte existente
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {string} corteId - ID del corte
 * @param {Object} updateData - Datos a actualizar
 * @param {string} updatedBy - Email del usuario que actualiza
 * @returns {Promise<void>}
 */
export const updateCorte = async (viveroId, camaId, corteId, updateData, updatedBy) => {
    try {
        if (!viveroId || !camaId || !corteId) {
            throw new Error("viveroId, camaId y corteId son requeridos");
        }

        const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);

        // Verificar que el corte existe
        const corteDoc = await getDoc(corteRef);
        if (!corteDoc.exists()) {
            throw new Error(`Corte no encontrado: ${corteId}`);
        }

        console.log("🔄 Actualizando corte:", corteId);

        // Preparar datos de actualización
        const updatePayload = {
            ...updateData,
            updatedAt: serverTimestamp(),
            updatedBy
        };

        // No permitir actualizar ciertos campos críticos
        delete updatePayload.id;
        delete updatePayload.createdAt;
        delete updatePayload.createdBy;

        // Convertir fecha si se está actualizando
        if (updateData.fecha && !(updateData.fecha instanceof Timestamp)) {
            updatePayload.fecha = Timestamp.fromDate(new Date(updateData.fecha));
        }

        // Validar cantidad de esquejes si se está actualizando
        if (updateData.cantidadEsquejes !== undefined) {
            const cantidad = parseInt(updateData.cantidadEsquejes);
            if (cantidad <= 0) {
                throw new Error("La cantidad de esquejes debe ser mayor a 0");
            }
            updatePayload.cantidadEsquejes = cantidad;
        }

        await updateDoc(corteRef, updatePayload);

        console.log("✅ Corte actualizado exitosamente");

    } catch (error) {
        console.error("❌ Error actualizando corte:", error.message);
        throw new Error(`Error al actualizar corte: ${error.message}`);
    }
};

/**
 * Elimina un corte específico
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {string} corteId - ID del corte a eliminar
 * @returns {Promise<void>}
 */
export const deleteCorte = async (viveroId, camaId, corteId) => {
    try {
        if (!viveroId || !camaId || !corteId) {
            throw new Error("viveroId, camaId y corteId son requeridos");
        }

        console.log("🗑️ Eliminando corte:", corteId, "de cama:", camaId);

        const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);

        // Verificar que el corte existe
        const corteDoc = await getDoc(corteRef);
        if (!corteDoc.exists()) {
            throw new Error(`Corte no encontrado: ${corteId}`);
        }

        await deleteDoc(corteRef);

        console.log("✅ Corte eliminado exitosamente");

    } catch (error) {
        console.error("❌ Error eliminando corte:", error.message);
        throw new Error(`Error al eliminar corte: ${error.message}`);
    }
};

/**
 * Crea múltiples cortes de una sola vez (operación de lote)
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {Array<Object>} cortesData - Array de datos de cortes
 * @param {string} createdBy - Email del usuario que crea los cortes
 * @returns {Promise<Object>} Resultado de la operación de lote
 */
export const createMultipleCortes = async (viveroId, camaId, cortesData, createdBy) => {
    try {
        if (!viveroId || !camaId || !Array.isArray(cortesData) || cortesData.length === 0) {
            throw new Error("viveroId, camaId y array de cortesData son requeridos");
        }

        console.log(`✂️ Creando ${cortesData.length} cortes en lote para cama: ${camaId}`);

        const batch = writeBatch(db);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        const createdIds = [];

        // Verificar que la cama existe antes de procesar todos los cortes
        const camaRef = doc(db, "viveros", viveroId, "camas", camaId);
        const camaDoc = await getDoc(camaRef);

        if (!camaDoc.exists()) {
            throw new Error(`Cama no encontrada: ${camaId} en vivero ${viveroId}`);
        }

        for (const [index, corteData] of cortesData.entries()) {
            try {
                const { fecha, cantidadEsquejes, observaciones, responsable } = corteData;

                // Validar cada corte
                if (!fecha || !cantidadEsquejes || cantidadEsquejes <= 0) {
                    throw new Error(`Corte ${index + 1}: Fecha y cantidad válida de esquejes son requeridos`);
                }

                // Generar ID único
                const fechaTimestamp = fecha instanceof Timestamp ? fecha : Timestamp.fromDate(new Date(fecha));
                const fechaStr = fechaTimestamp.toDate().toISOString().split('T')[0].replace(/-/g, '');
                const timeStr = Date.now().toString().slice(-3) + index.toString().padStart(2, '0');
                const corteId = `corte_${fechaStr}_${timeStr}`;

                const corteDocument = {
                    id: corteId,
                    fecha: fechaTimestamp,
                    cantidadEsquejes: parseInt(cantidadEsquejes),
                    observaciones: observaciones || "",
                    responsable: responsable || "",
                    createdAt: serverTimestamp(),
                    createdBy
                };

                const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);
                batch.set(corteRef, corteDocument);

                createdIds.push(corteId);
                successCount++;

            } catch (error) {
                errorCount++;
                errors.push({ index: index + 1, error: error.message });
                console.error(`❌ Error procesando corte ${index + 1}:`, error.message);
            }
        }

        // Ejecutar todas las operaciones
        if (successCount > 0) {
            await batch.commit();
        }

        const result = {
            total: cortesData.length,
            success: successCount,
            errors: errorCount,
            createdIds,
            errorDetails: errors
        };

        console.log(`✅ Operación de lote completada: ${successCount} éxitos, ${errorCount} errores`);
        return result;

    } catch (error) {
        console.error("❌ Error en creación múltiple de cortes:", error.message);
        throw error;
    }
};

/**
 * Obtiene estadísticas de producción de esquejes por período
 * @param {string} viveroId - ID del vivero (opcional, si no se especifica busca en todo el sistema)
 * @param {string} camaId - ID de la cama (opcional)
 * @param {Object} options - Opciones de análisis
 * @param {Date} options.fechaDesde - Fecha inicio del análisis
 * @param {Date} options.fechaHasta - Fecha fin del análisis
 * @param {string} options.agrupacion - Agrupación temporal ('diario', 'semanal', 'mensual')
 * @returns {Promise<Object>} Estadísticas de producción por período
 */
export const getProduccionStats = async (viveroId = null, camaId = null, options = {}) => {
    try {
        const {
            fechaDesde = new Date(new Date().setMonth(new Date().getMonth() - 3)), // 3 meses atrás por defecto
            fechaHasta = new Date(),
            agrupacion = 'mensual'
        } = options;

        console.log("📊 Calculando estadísticas de producción...");

        let cortes = [];

        if (camaId && viveroId) {
            // Obtener cortes de una cama específica
            cortes = await getCortesFromCama(viveroId, camaId, { fechaDesde, fechaHasta });
        } else if (viveroId) {
            // Obtener cortes de un vivero específico
            cortes = await getCortesFromVivero(viveroId, { fechaDesde, fechaHasta });
        } else {
            // Obtener cortes de todo el sistema
            cortes = await getAllCortes({ fechaDesde, fechaHasta });
        }

        // Agrupar por período
        const produccionPorPeriodo = {};

        cortes.forEach(corte => {
            if (corte.fecha) {
                const fecha = corte.fecha.toDate();
                let periodoKey;

                switch (agrupacion) {
                    case 'diario':
                        periodoKey = fecha.toISOString().split('T')[0];
                        break;
                    case 'semanal':
                        const startOfWeek = new Date(fecha);
                        startOfWeek.setDate(fecha.getDate() - fecha.getDay());
                        periodoKey = startOfWeek.toISOString().split('T')[0] + '_semana';
                        break;
                    case 'mensual':
                    default:
                        periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                        break;
                }

                if (!produccionPorPeriodo[periodoKey]) {
                    produccionPorPeriodo[periodoKey] = {
                        periodo: periodoKey,
                        totalEsquejes: 0,
                        totalCortes: 0,
                        fechaInicio: fecha,
                        fechaFin: fecha
                    };
                }

                produccionPorPeriodo[periodoKey].totalEsquejes += corte.cantidadEsquejes || 0;
                produccionPorPeriodo[periodoKey].totalCortes++;

                // Actualizar rango de fechas del período
                if (fecha < produccionPorPeriodo[periodoKey].fechaInicio) {
                    produccionPorPeriodo[periodoKey].fechaInicio = fecha;
                }
                if (fecha > produccionPorPeriodo[periodoKey].fechaFin) {
                    produccionPorPeriodo[periodoKey].fechaFin = fecha;
                }
            }
        });

        // Convertir a array y ordenar
        const produccionArray = Object.values(produccionPorPeriodo)
            .sort((a, b) => a.periodo.localeCompare(b.periodo));

        // Calcular estadísticas generales
        const totalEsquejes = cortes.reduce((sum, corte) => sum + (corte.cantidadEsquejes || 0), 0);
        const totalCortes = cortes.length;
        const promedioEsquejesPorCorte = totalCortes > 0 ? Math.round((totalEsquejes / totalCortes) * 100) / 100 : 0;

        const stats = {
            resumen: {
                totalEsquejes,
                totalCortes,
                promedioEsquejesPorCorte,
                fechaDesde,
                fechaHasta,
                agrupacion
            },
            produccionPorPeriodo: produccionArray,
            calculadoEn: new Date()
        };

        console.log("✅ Estadísticas de producción calculadas:", {
            totalEsquejes,
            totalCortes,
            periodos: produccionArray.length
        });

        return stats;

    } catch (error) {
        console.error("❌ Error calculando estadísticas de producción:", error.message);
        throw error;
    }
};

/**
 * Obtiene todos los cortes del sistema (función auxiliar para búsquedas globales)
 * @param {Object} options - Opciones de filtrado
 * @param {Date} options.fechaDesde - Filtrar desde fecha
 * @param {Date} options.fechaHasta - Filtrar hasta fecha
 * @param {number} options.limitResults - Límite de resultados
 * @returns {Promise<Array>} Lista de todos los cortes del sistema
 */
export const getAllCortes = async (options = {}) => {
    try {
        const { fechaDesde = null, fechaHasta = null, limitResults = 1000 } = options;

        console.log("🌍 Obteniendo todos los cortes del sistema...");

        // Obtener todos los viveros
        const viverosRef = collection(db, "viveros");
        const viverosSnapshot = await getDocs(viverosRef);

        const todosLosCortes = [];

        // Para cada vivero, obtener todos sus cortes
        for (const viveroDoc of viverosSnapshot.docs) {
            const viveroId = viveroDoc.id;

            try {
                const cortesVivero = await getCortesFromVivero(viveroId, {
                    fechaDesde,
                    fechaHasta
                });

                todosLosCortes.push(...cortesVivero);
            } catch (error) {
                console.warn(`⚠️ Error obteniendo cortes del vivero ${viveroId}:`, error.message);
                continue;
            }
        }

        // Ordenar por fecha (más reciente primero) y aplicar límite
        const cortesOrdenados = todosLosCortes
            .sort((a, b) => {
                const fechaA = a.fecha?.toDate() || new Date(0);
                const fechaB = b.fecha?.toDate() || new Date(0);
                return fechaB - fechaA;
            })
            .slice(0, limitResults);

        console.log(`✅ ${cortesOrdenados.length} cortes obtenidos de todo el sistema`);
        return cortesOrdenados;

    } catch (error) {
        console.error("❌ Error obteniendo todos los cortes:", error.message);
        throw error;
    }
};

/**
 * Verifica si un corte existe
 * @param {string} viveroId - ID del vivero
 * @param {string} camaId - ID de la cama
 * @param {string} corteId - ID del corte
 * @returns {Promise<boolean>} Si el corte existe
 */
export const corteExists = async (viveroId, camaId, corteId) => {
    try {
        if (!viveroId || !camaId || !corteId) {
            return false;
        }

        const corteRef = doc(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes", corteId);
        const corteDoc = await getDoc(corteRef);
        return corteDoc.exists();
    } catch (error) {
        console.error("❌ Error verificando existencia del corte:", error.message);
        return false;
    }
};

/**
 * Obtiene el resumen de cortes de los últimos días
 * @param {number} ultimosDias - Número de días a analizar (default: 30)
 * @param {string} viveroId - ID del vivero (opcional)
 * @returns {Promise<Object>} Resumen de actividad reciente
 */
export const getRecentActivity = async (ultimosDias = 30, viveroId = null) => {
    try {
        console.log(`📈 Obteniendo actividad reciente de ${ultimosDias} días...`);

        const fechaDesde = new Date();
        fechaDesde.setDate(fechaDesde.getDate() - ultimosDias);

        let cortes = [];

        if (viveroId) {
            cortes = await getCortesFromVivero(viveroId, { fechaDesde });
        } else {
            cortes = await getAllCortes({ fechaDesde });
        }

        // Agrupar por día
        const actividadPorDia = {};
        cortes.forEach(corte => {
            if (corte.fecha) {
                const diaKey = corte.fecha.toDate().toISOString().split('T')[0];

                if (!actividadPorDia[diaKey]) {
                    actividadPorDia[diaKey] = {
                        fecha: diaKey,
                        totalEsquejes: 0,
                        totalCortes: 0,
                        responsables: new Set()
                    };
                }

                actividadPorDia[diaKey].totalEsquejes += corte.cantidadEsquejes || 0;
                actividadPorDia[diaKey].totalCortes++;

                if (corte.responsable) {
                    actividadPorDia[diaKey].responsables.add(corte.responsable);
                }
            }
        });

        // Convertir a array y procesar
        const actividadArray = Object.values(actividadPorDia).map(dia => ({
            ...dia,
            responsables: Array.from(dia.responsables)
        })).sort((a, b) => b.fecha.localeCompare(a.fecha));

        // Calcular estadísticas del período
        const totalEsquejes = cortes.reduce((sum, corte) => sum + (corte.cantidadEsquejes || 0), 0);
        const totalCortes = cortes.length;
        const diasConActividad = actividadArray.length;
        const promedioEsquejesPorDia = diasConActividad > 0 ? Math.round((totalEsquejes / diasConActividad) * 100) / 100 : 0;

        const resumen = {
            periodo: {
                ultimosDias,
                fechaDesde,
                fechaHasta: new Date()
            },
            estadisticas: {
                totalEsquejes,
                totalCortes,
                diasConActividad,
                promedioEsquejesPorDia,
                promedioCortesPorDia: diasConActividad > 0 ? Math.round((totalCortes / diasConActividad) * 100) / 100 : 0
            },
            actividadPorDia: actividadArray,
            calculadoEn: new Date()
        };

        console.log(`✅ Actividad reciente calculada: ${totalEsquejes} esquejes en ${diasConActividad} días activos`);
        return resumen;

    } catch (error) {
        console.error("❌ Error obteniendo actividad reciente:", error.message);
        throw error;
    }
};

/**
 * Valida datos de corte antes de crear/actualizar
 * @param {Object} corteData - Datos del corte a validar
 * @returns {Object} Resultado de validación {valid, errors}
 */
export const validateCorteData = (corteData) => {
    const errors = [];

    if (!corteData || typeof corteData !== 'object') {
        errors.push("Datos de corte requeridos");
        return { valid: false, errors };
    }

    const { fecha, cantidadEsquejes, responsable } = corteData;

    // Validar fecha
    if (!fecha) {
        errors.push("Fecha del corte es requerida");
    } else {
        try {
            const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
            if (isNaN(fechaObj.getTime())) {
                errors.push("Fecha del corte no es válida");
            } else if (fechaObj > new Date()) {
                errors.push("La fecha del corte no puede ser futura");
            }
        } catch (error) {
            errors.push("Formato de fecha inválido");
        }
    }

    // Validar cantidad de esquejes
    if (!cantidadEsquejes) {
        errors.push("Cantidad de esquejes es requerida");
    } else {
        const cantidad = parseInt(cantidadEsquejes);
        if (isNaN(cantidad) || cantidad <= 0) {
            errors.push("La cantidad de esquejes debe ser un número mayor a 0");
        } else if (cantidad > 10000) {
            errors.push("La cantidad de esquejes parece excesiva (máximo 10,000)");
        }
    }

    // Validar responsable (opcional pero si está debe ser válido)
    if (responsable && typeof responsable !== 'string') {
        errors.push("El responsable debe ser texto");
    } else if (responsable && responsable.length > 100) {
        errors.push("El nombre del responsable no puede exceder 100 caracteres");
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// Exports por defecto
export default {
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