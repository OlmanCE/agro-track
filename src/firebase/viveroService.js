// src/firebase/viveroService.js
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
    writeBatch,
    runTransaction
} from "firebase/firestore"
import { db } from "./config"

// ===================================
// 🏡 VIVERO SERVICES
// ===================================

export const viveroService = {
    // 📋 Obtener todos los viveros
    getAllViveros: async () => {
        try {
            const viverosCollection = collection(db, "viveros")
            const q = query(viverosCollection, orderBy("createdAt", "desc"))
            const viverosSnapshot = await getDocs(q)
            
            const viveros = viverosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))
            
            return { success: true, data: viveros }
        } catch (error) {
            console.error("❌ Error obteniendo viveros:", error)
            return { success: false, error: "Error al cargar viveros" }
        }
    },

    // 🔍 Obtener un vivero específico
    getVivero: async (viveroId) => {
        try {
            const viveroDocRef = doc(db, "viveros", viveroId)
            const viveroDoc = await getDoc(viveroDocRef)
            
            if (viveroDoc.exists()) {
                const viveroData = {
                    id: viveroDoc.id,
                    ...viveroDoc.data(),
                    createdAt: viveroDoc.data().createdAt?.toDate(),
                    updatedAt: viveroDoc.data().updatedAt?.toDate()
                }
                return { success: true, data: viveroData }
            } else {
                return { success: false, error: "Vivero no encontrado" }
            }
        } catch (error) {
            console.error("❌ Error al obtener vivero:", error)
            return { success: false, error: "Error al cargar el vivero" }
        }
    },

    // ✨ Crear nuevo vivero
    createVivero: async (viveroId, viveroData) => {
        try {
            const viveroDocRef = doc(db, "viveros", viveroId)
            
            // Verificar si ya existe
            const existingVivero = await getDoc(viveroDocRef)
            if (existingVivero.exists()) {
                return { success: false, error: "Ya existe un vivero con este ID" }
            }

            // Procesar ubicación
            const ubicacionProcesada = await processUbicacion(viveroData.ubicacion)

            const newViveroData = {
                id: viveroId,
                nombre: viveroData.nombre,
                descripcion: viveroData.descripcion || "",
                ubicacion: ubicacionProcesada,
                responsable: viveroData.responsable || "",
                configuracion: {
                    permitirQRPublico: viveroData.configuracion?.permitirQRPublico ?? true,
                    mostrarEnListaPublica: viveroData.configuracion?.mostrarEnListaPublica ?? true,
                    tipoVivero: viveroData.configuracion?.tipoVivero || "exterior"
                },
                estadisticas: {
                    totalCamas: 0,
                    camasOcupadas: 0,
                    camasLibres: 0,
                    totalPlantas: 0,
                    totalEsquejesHistorico: 0,
                    ultimaActualizacion: serverTimestamp()
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: viveroData.createdBy || "system"
            }
            
            await setDoc(viveroDocRef, newViveroData)
            console.log("✅ Vivero creado:", viveroId)
            return { success: true, data: { id: viveroId, ...newViveroData } }
        } catch (error) {
            console.error("❌ Error al crear vivero:", error)
            return { success: false, error: "Error al crear el vivero" }
        }
    },

    // 🔄 Actualizar vivero existente
    updateVivero: async (viveroId, updates) => {
        try {
            const viveroDocRef = doc(db, "viveros", viveroId)
            
            // Procesar ubicación si viene en los updates
            if (updates.ubicacion) {
                updates.ubicacion = await processUbicacion(updates.ubicacion)
            }

            await updateDoc(viveroDocRef, {
                ...updates,
                updatedAt: serverTimestamp()
            })
            
            console.log("✅ Vivero actualizado:", viveroId)
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar vivero:", error)
            return { success: false, error: "Error al actualizar el vivero" }
        }
    },

    // 🗑️ Eliminar vivero (con todas sus camas)
    deleteVivero: async (viveroId) => {
        try {
            return await runTransaction(db, async (transaction) => {
                const viveroDocRef = doc(db, "viveros", viveroId)
                
                // Verificar que existe
                const viveroDoc = await transaction.get(viveroDocRef)
                if (!viveroDoc.exists()) {
                    throw new Error("Vivero no encontrado")
                }

                // Obtener todas las camas del vivero
                const camasCollection = collection(db, "viveros", viveroId, "camas")
                const camasSnapshot = await getDocs(camasCollection)
                
                // Eliminar todas las camas y sus subcollections
                for (const camaDoc of camasSnapshot.docs) {
                    const camaId = camaDoc.id
                    
                    // Eliminar cortes de esquejes de la cama
                    const cortesCollection = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes")
                    const cortesSnapshot = await getDocs(cortesCollection)
                    
                    cortesSnapshot.docs.forEach(corteDoc => {
                        transaction.delete(corteDoc.ref)
                    })
                    
                    // Eliminar la cama
                    transaction.delete(camaDoc.ref)
                }
                
                // Eliminar el vivero
                transaction.delete(viveroDocRef)
                
                console.log("✅ Vivero eliminado:", viveroId)
                return { success: true }
            })
        } catch (error) {
            console.error("❌ Error al eliminar vivero:", error)
            return { success: false, error: error.message || "Error al eliminar el vivero" }
        }
    },

    // 📊 Obtener estadísticas del vivero
    getViveroStats: async (viveroId) => {
        try {
            const camasCollection = collection(db, "viveros", viveroId, "camas")
            const camasSnapshot = await getDocs(camasCollection)
            
            let totalCamas = camasSnapshot.docs.length
            let camasOcupadas = 0
            let totalPlantas = 0
            let totalEsquejesHistorico = 0
            
            for (const camaDoc of camasSnapshot.docs) {
                const camaData = camaDoc.data()
                
                if (camaData.estado === "activa") {
                    camasOcupadas++
                }
                
                totalPlantas += camaData.cantidadPlantas || 0
                totalEsquejesHistorico += camaData.estadisticas?.totalEsquejesHistorico || 0
            }

            const stats = {
                totalCamas,
                camasOcupadas,
                camasLibres: totalCamas - camasOcupadas,
                totalPlantas,
                totalEsquejesHistorico,
                ultimaActualizacion: serverTimestamp()
            }

            return { success: true, data: stats }
        } catch (error) {
            console.error("❌ Error al obtener estadísticas:", error)
            return { success: false, error: "Error al cargar estadísticas" }
        }
    },

    // 🔄 Actualizar estadísticas del vivero
    updateViveroStats: async (viveroId) => {
        try {
            const statsResult = await viveroService.getViveroStats(viveroId)
            if (!statsResult.success) {
                return statsResult
            }

            const viveroDocRef = doc(db, "viveros", viveroId)
            await updateDoc(viveroDocRef, {
                estadisticas: statsResult.data,
                updatedAt: serverTimestamp()
            })

            return { success: true, data: statsResult.data }
        } catch (error) {
            console.error("❌ Error al actualizar estadísticas:", error)
            return { success: false, error: "Error al actualizar estadísticas" }
        }
    },

    // 🌱 Obtener camas del vivero
    getCamasFromVivero: async (viveroId) => {
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
            console.error("❌ Error al obtener camas:", error)
            return { success: false, error: "Error al cargar camas del vivero" }
        }
    },

    // 🔢 Contar camas del vivero
    getCamaCount: async (viveroId) => {
        try {
            const camasCollection = collection(db, "viveros", viveroId, "camas")
            const camasSnapshot = await getDocs(camasCollection)
            return { success: true, data: camasSnapshot.docs.length }
        } catch (error) {
            console.error("❌ Error al contar camas:", error)
            return { success: false, error: "Error al contar camas" }
        }
    },

    // 🔍 Buscar viveros por nombre
    searchViveros: async (searchTerm) => {
        try {
            const viverosCollection = collection(db, "viveros")
            const q = query(
                viverosCollection, 
                where("nombre", ">=", searchTerm),
                where("nombre", "<=", searchTerm + '\uf8ff'),
                orderBy("nombre")
            )
            const querySnapshot = await getDocs(q)
            
            const viveros = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))
            
            return { success: true, data: viveros }
        } catch (error) {
            console.error("❌ Error en búsqueda:", error)
            return { success: false, error: "Error al buscar viveros" }
        }
    }
}

// ===================================
// 🛠️ HELPER FUNCTIONS
// ===================================

// Procesar ubicación (GPS o manual)
const processUbicacion = async (ubicacionInput) => {
    if (!ubicacionInput) {
        return {
            tipo: "vacio",
            direccion: "",
            timestamp: serverTimestamp()
        }
    }

    // Si viene con coordenadas (GPS)
    if (ubicacionInput.coordenadas) {
        return {
            tipo: "gps",
            coordenadas: {
                lat: ubicacionInput.coordenadas.lat,
                lng: ubicacionInput.coordenadas.lng
            },
            direccion: ubicacionInput.direccion || "Ubicación GPS",
            timestamp: serverTimestamp()
        }
    }

    // Si es texto manual
    return {
        tipo: "manual",
        direccion: ubicacionInput.direccion || ubicacionInput,
        timestamp: serverTimestamp()
    }
}

// Obtener ubicación GPS actual
export const getLocationHelper = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada"))
            return
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    coordenadas: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    direccion: "Ubicación GPS obtenida",
                    precision: position.coords.accuracy
                })
            },
            (error) => {
                let errorMessage = "Error al obtener ubicación"
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permisos de ubicación denegados"
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Ubicación no disponible"
                        break
                    case error.TIMEOUT:
                        errorMessage = "Tiempo de espera agotado"
                        break
                }
                reject(new Error(errorMessage))
            },
            options
        )
    })
}