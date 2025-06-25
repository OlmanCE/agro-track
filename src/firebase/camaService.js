// src/firebase/camaService.js (ACTUALIZADO para Viveros)
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction,
    collectionGroup
} from "firebase/firestore"
import { db } from "./config"
import { viveroService } from "./viveroService"

// ===================================
// 🌱 CAMAS SERVICES (V2.0 con Viveros)
// ===================================

export const camaService = {
    // 📋 Obtener todas las camas de un vivero
    getAllCamasFromVivero: async (viveroId) => {
        try {
            const camasCollection = collection(db, "viveros", viveroId, "camas")
            const q = query(camasCollection, orderBy("createdAt", "desc"))
            const camasSnapshot = await getDocs(q)
            
            const camas = camasSnapshot.docs.map(doc => ({
                id: doc.id,
                viveroId: viveroId,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))
            
            return { success: true, data: camas }
        } catch (error) {
            console.error("❌ Error obteniendo camas:", error)
            return { success: false, error: "Error al cargar camas" }
        }
    },

    // 🌐 Obtener todas las camas de todos los viveros (para búsquedas globales)
    getAllCamasGlobal: async () => {
        try {
            const camasQuery = collectionGroup(db, "camas")
            const q = query(camasQuery, orderBy("createdAt", "desc"))
            const camasSnapshot = await getDocs(q)
            
            const camas = camasSnapshot.docs.map(doc => {
                const docPath = doc.ref.path
                const viveroId = docPath.split('/')[1] // viveros/{viveroId}/camas/{camaId}
                
                return {
                    id: doc.id,
                    viveroId: viveroId,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }
            })
            
            return { success: true, data: camas }
        } catch (error) {
            console.error("❌ Error obteniendo camas globales:", error)
            return { success: false, error: "Error al cargar todas las camas" }
        }
    },

    // 🔍 Obtener una cama específica
    getCama: async (viveroId, camaId) => {
        try {
            const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
            const camaDoc = await getDoc(camaDocRef)
            
            if (camaDoc.exists()) {
                return { 
                    success: true, 
                    data: { 
                        id: camaDoc.id, 
                        viveroId: viveroId,
                        ...camaDoc.data(),
                        createdAt: camaDoc.data().createdAt?.toDate(),
                        updatedAt: camaDoc.data().updatedAt?.toDate()
                    } 
                }
            } else {
                return { success: false, error: "Cama no encontrada" }
            }
        } catch (error) {
            console.error("❌ Error al obtener cama:", error)
            return { success: false, error: "Error al cargar la cama" }
        }
    },

    // ✨ Crear nueva cama
    createCama: async (viveroId, camaId, camaData) => {
        try {
            return await runTransaction(db, async (transaction) => {
                const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
                const viveroDocRef = doc(db, "viveros", viveroId)
                
                // Verificar que el vivero existe
                const viveroDoc = await transaction.get(viveroDocRef)
                if (!viveroDoc.exists()) {
                    throw new Error("Vivero no encontrado")
                }

                // Verificar que la cama no existe
                const existingCama = await transaction.get(camaDocRef)
                if (existingCama.exists()) {
                    throw new Error("Ya existe una cama con este ID en el vivero")
                }

                const viveroData = viveroDoc.data()
                const newCamaData = {
                    id: camaId,
                    viveroId: viveroId,
                    nombreCompleto: `${viveroData.nombre} - Cama ${camaId}`,
                    nombrePlanta: camaData.nombrePlanta,
                    cantidadPlantas: camaData.cantidadPlantas,
                    sustrato: camaData.sustrato,
                    tarroSize: camaData.tarroSize,
                    tarroUnidad: camaData.tarroUnidad,
                    estado: camaData.estado || "activa",
                    observaciones: camaData.observaciones || "",
                    fechaSiembra: camaData.fechaSiembra || serverTimestamp(),
                    fechaEstimadaCosecha: camaData.fechaEstimadaCosecha || null,
                    estadisticas: {
                        totalEsquejesHistorico: 0,
                        ultimoCorte: null,
                        totalCortes: 0
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: camaData.createdBy || "system"
                }
                
                // Crear la cama
                transaction.set(camaDocRef, newCamaData)
                
                console.log("✅ Cama creada:", `${viveroId}/${camaId}`)
                return { success: true, data: { id: camaId, ...newCamaData } }
            })
        } catch (error) {
            console.error("❌ Error al crear cama:", error)
            return { success: false, error: error.message || "Error al crear la cama" }
        }
    },

    // 🔄 Actualizar cama existente
    updateCama: async (viveroId, camaId, updates) => {
        try {
            return await runTransaction(db, async (transaction) => {
                const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
                const viveroDocRef = doc(db, "viveros", viveroId)
                
                // Verificar que la cama existe
                const camaDoc = await transaction.get(camaDocRef)
                if (!camaDoc.exists()) {
                    throw new Error("Cama no encontrada")
                }

                // Si se cambió el nombre de planta, actualizar nombreCompleto
                if (updates.nombrePlanta) {
                    const viveroDoc = await transaction.get(viveroDocRef)
                    if (viveroDoc.exists()) {
                        const viveroData = viveroDoc.data()
                        updates.nombreCompleto = `${viveroData.nombre} - Cama ${camaId}`
                    }
                }

                // Actualizar la cama
                transaction.update(camaDocRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                })
                
                console.log("✅ Cama actualizada:", `${viveroId}/${camaId}`)
                return { success: true }
            })
        } catch (error) {
            console.error("❌ Error al actualizar cama:", error)
            return { success: false, error: error.message || "Error al actualizar la cama" }
        }
    },

    // 🗑️ Eliminar cama (con todos sus cortes)
    deleteCama: async (viveroId, camaId) => {
        try {
            return await runTransaction(db, async (transaction) => {
                const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
                
                // Verificar que la cama existe
                const camaDoc = await transaction.get(camaDocRef)
                if (!camaDoc.exists()) {
                    throw new Error("Cama no encontrada")
                }

                // Obtener todos los cortes de esquejes
                const cortesCollection = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes")
                const cortesSnapshot = await getDocs(cortesCollection)
                
                // Eliminar todos los cortes
                cortesSnapshot.docs.forEach(corteDoc => {
                    transaction.delete(corteDoc.ref)
                })
                
                // Eliminar la cama
                transaction.delete(camaDocRef)
                
                console.log("✅ Cama eliminada:", `${viveroId}/${camaId}`)
                return { success: true }
            })
        } catch (error) {
            console.error("❌ Error al eliminar cama:", error)
            return { success: false, error: error.message || "Error al eliminar la cama" }
        }
    },

    // ✂️ Agregar corte de esquejes
    addCorteEsquejes: async (viveroId, camaId, corteData) => {
        try {
            return await runTransaction(db, async (transaction) => {
                const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
                const cortesCollection = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes")
                
                // Verificar que la cama existe
                const camaDoc = await transaction.get(camaDocRef)
                if (!camaDoc.exists()) {
                    throw new Error("Cama no encontrada")
                }

                const camaActual = camaDoc.data()
                
                // Crear el corte
                const corteId = `corte_${new Date().getTime()}`
                const nuevoCorte = {
                    id: corteId,
                    fecha: corteData.fecha || serverTimestamp(),
                    cantidadEsquejes: corteData.cantidadEsquejes,
                    observaciones: corteData.observaciones || "",
                    responsable: corteData.responsable || "",
                    calidad: corteData.calidad || "buena",
                    createdAt: serverTimestamp(),
                    createdBy: corteData.createdBy || "system"
                }

                // Agregar el corte
                const corteDocRef = doc(cortesCollection, corteId)
                transaction.set(corteDocRef, nuevoCorte)

                // Actualizar estadísticas de la cama
                const nuevasEstadisticas = {
                    totalEsquejesHistorico: (camaActual.estadisticas?.totalEsquejesHistorico || 0) + corteData.cantidadEsquejes,
                    ultimoCorte: nuevoCorte.fecha,
                    totalCortes: (camaActual.estadisticas?.totalCortes || 0) + 1
                }

                transaction.update(camaDocRef, {
                    estadisticas: nuevasEstadisticas,
                    updatedAt: serverTimestamp()
                })

                console.log("✅ Corte agregado:", `${viveroId}/${camaId}/${corteId}`)
                return { success: true, data: nuevoCorte }
            })
        } catch (error) {
            console.error("❌ Error al agregar corte:", error)
            return { success: false, error: error.message || "Error al agregar corte de esquejes" }
        }
    },

    // 📊 Obtener historial de cortes
    getHistorialCortes: async (viveroId, camaId, limite = 50) => {
        try {
            const cortesCollection = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes")
            const q = query(cortesCollection, orderBy("fecha", "desc"), limit(limite))
            const cortesSnapshot = await getDocs(q)
            
            const cortes = cortesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            }))
            
            return { success: true, data: cortes }
        } catch (error) {
            console.error("❌ Error al obtener historial:", error)
            return { success: false, error: "Error al cargar historial de cortes" }
        }
    },

    // 📈 Obtener estadísticas de una cama
    getCamaStats: async (viveroId, camaId) => {
        try {
            const camaResult = await camaService.getCama(viveroId, camaId)
            if (!camaResult.success) {
                return camaResult
            }

            const camaData = camaResult.data
            const historialResult = await camaService.getHistorialCortes(viveroId, camaId)
            
            const stats = {
                totalEsquejesHistorico: camaData.estadisticas?.totalEsquejesHistorico || 0,
                totalCortes: camaData.estadisticas?.totalCortes || 0,
                ultimoCorte: camaData.estadisticas?.ultimoCorte,
                promedioEsquejesPorCorte: camaData.estadisticas?.totalCortes > 0 
                    ? Math.round((camaData.estadisticas?.totalEsquejesHistorico || 0) / camaData.estadisticas.totalCortes)
                    : 0,
                historialReciente: historialResult.success ? historialResult.data.slice(0, 5) : []
            }

            return { success: true, data: stats }
        } catch (error) {
            console.error("❌ Error al obtener estadísticas:", error)
            return { success: false, error: "Error al cargar estadísticas de la cama" }
        }
    },

    // 🔍 Buscar camas por nombre de planta
    searchCamasByPlant: async (plantName, viveroId = null) => {
        try {
            let camas = []
            
            if (viveroId) {
                // Buscar solo en un vivero específico
                const camasCollection = collection(db, "viveros", viveroId, "camas")
                const q = query(
                    camasCollection,
                    where("nombrePlanta", ">=", plantName),
                    where("nombrePlanta", "<=", plantName + '\uf8ff')
                )
                const querySnapshot = await getDocs(q)
                
                camas = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    viveroId: viveroId,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }))
            } else {
                // Buscar en todos los viveros usando collectionGroup
                const camasQuery = collectionGroup(db, "camas")
                const q = query(
                    camasQuery,
                    where("nombrePlanta", ">=", plantName),
                    where("nombrePlanta", "<=", plantName + '\uf8ff')
                )
                const querySnapshot = await getDocs(q)
                
                camas = querySnapshot.docs.map(doc => {
                    const docPath = doc.ref.path
                    const viveroId = docPath.split('/')[1] // viveros/{viveroId}/camas/{camaId}
                    
                    return {
                        id: doc.id,
                        viveroId: viveroId,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate(),
                        updatedAt: doc.data().updatedAt?.toDate()
                    }
                })
            }
            
            return { success: true, data: camas }
        } catch (error) {
            console.error("❌ Error en búsqueda:", error)
            return { success: false, error: "Error al buscar camas" }
        }
    },

    // 🌐 Búsqueda global de camas (por cualquier campo)
    searchCamasGlobal: async (searchTerm) => {
        try {
            const camasQuery = collectionGroup(db, "camas")
            const queries = [
                // Buscar por nombre de planta
                query(
                    camasQuery,
                    where("nombrePlanta", ">=", searchTerm),
                    where("nombrePlanta", "<=", searchTerm + '\uf8ff')
                ),
                // Buscar por sustrato
                query(
                    camasQuery,
                    where("sustrato", ">=", searchTerm),
                    where("sustrato", "<=", searchTerm + '\uf8ff')
                ),
                // Buscar por estado
                query(
                    camasQuery,
                    where("estado", "==", searchTerm.toLowerCase())
                )
            ]

            const allResults = []
            
            for (const q of queries) {
                try {
                    const querySnapshot = await getDocs(q)
                    const results = querySnapshot.docs.map(doc => {
                        const docPath = doc.ref.path
                        const viveroId = docPath.split('/')[1]
                        
                        return {
                            id: doc.id,
                            viveroId: viveroId,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate(),
                            updatedAt: doc.data().updatedAt?.toDate()
                        }
                    })
                    allResults.push(...results)
                } catch (queryError) {
                    console.warn("Query falló, continuando:", queryError)
                }
            }

            // Eliminar duplicados basados en viveroId + camaId
            const uniqueResults = allResults.filter((cama, index, self) => 
                index === self.findIndex(c => c.viveroId === cama.viveroId && c.id === cama.id)
            )

            return { success: true, data: uniqueResults }
        } catch (error) {
            console.error("❌ Error en búsqueda global:", error)
            return { success: false, error: "Error al buscar camas" }
        }
    },

    // 🔄 Recalcular estadísticas de una cama
    recalcularEstadisticasCama: async (viveroId, camaId) => {
        try {
            const cortesResult = await camaService.getHistorialCortes(viveroId, camaId)
            if (!cortesResult.success) {
                return cortesResult
            }

            const cortes = cortesResult.data
            const totalEsquejesHistorico = cortes.reduce((sum, corte) => sum + corte.cantidadEsquejes, 0)
            const totalCortes = cortes.length
            const ultimoCorte = cortes.length > 0 ? cortes[0].fecha : null

            const nuevasEstadisticas = {
                totalEsquejesHistorico,
                totalCortes,
                ultimoCorte
            }

            const camaDocRef = doc(db, "viveros", viveroId, "camas", camaId)
            await updateDoc(camaDocRef, {
                estadisticas: nuevasEstadisticas,
                updatedAt: serverTimestamp()
            })

            return { success: true, data: nuevasEstadisticas }
        } catch (error) {
            console.error("❌ Error al recalcular estadísticas:", error)
            return { success: false, error: "Error al recalcular estadísticas" }
        }
    },

    // 🔄 Actualizar todas las estadísticas de un vivero
    recalcularEstadisticasVivero: async (viveroId) => {
        try {
            const camasResult = await camaService.getAllCamasFromVivero(viveroId)
            if (!camasResult.success) {
                return camasResult
            }

            const camas = camasResult.data
            let totalEsquejesVivero = 0

            // Recalcular estadísticas de cada cama
            for (const cama of camas) {
                const recalcResult = await camaService.recalcularEstadisticasCama(viveroId, cama.id)
                if (recalcResult.success) {
                    totalEsquejesVivero += recalcResult.data.totalEsquejesHistorico
                }
            }

            // Actualizar estadísticas del vivero
            await viveroService.updateViveroStats(viveroId)

            return { 
                success: true, 
                data: { 
                    camasRecalculadas: camas.length,
                    totalEsquejesVivero 
                }
            }
        } catch (error) {
            console.error("❌ Error al recalcular estadísticas del vivero:", error)
            return { success: false, error: "Error al recalcular estadísticas del vivero" }
        }
    }
}

// ===================================
// 🛠️ HELPER FUNCTIONS
// ===================================

// Generar ID único para corte
export const generateCorteId = () => {
    const now = new Date()
    const fecha = now.toISOString().split('T')[0].replace(/-/g, '_')
    const hora = now.toTimeString().split(' ')[0].replace(/:/g, '')
    return `corte_${fecha}_${hora}_${Math.random().toString(36).substr(2, 4)}`
}

// Validar datos de cama
export const validateCamaData = (camaData) => {
    const errors = {}

    if (!camaData.nombrePlanta?.trim()) {
        errors.nombrePlanta = 'El nombre de la planta es requerido'
    }

    if (!camaData.cantidadPlantas || camaData.cantidadPlantas <= 0) {
        errors.cantidadPlantas = 'La cantidad de plantas debe ser mayor a 0'
    }

    if (!camaData.sustrato?.trim()) {
        errors.sustrato = 'El sustrato es requerido'
    }

    if (!camaData.tarroSize || camaData.tarroSize <= 0) {
        errors.tarroSize = 'El tamaño del tarro debe ser mayor a 0'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

// Validar datos de corte
export const validateCorteData = (corteData) => {
    const errors = {}

    if (!corteData.cantidadEsquejes || corteData.cantidadEsquejes <= 0) {
        errors.cantidadEsquejes = 'La cantidad de esquejes debe ser mayor a 0'
    }

    if (corteData.cantidadEsquejes > 10000) {
        errors.cantidadEsquejes = 'La cantidad parece muy alta, verifica el número'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}