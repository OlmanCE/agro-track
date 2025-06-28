import { 
    signInWithPopup, 
    signOut,
    onAuthStateChanged 
} from "firebase/auth"
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
    serverTimestamp
} from "firebase/firestore"
import { auth, db, googleProvider } from "./config"

// ===================================
// 📦 IMPORTAR NUEVOS SERVICIOS
// ===================================
import { viveroService } from "./viveroService"
import { camaService } from "./camaService"
import { chartService } from "./chartService"

// ===================================
// 🔐 AUTH SERVICES
// ===================================

export const authService = {
    // Login con Google
    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            console.log("✅ Login exitoso:", result.user.email)
            return { success: true, user: result.user }
        } catch (error) {
            console.error("❌ Error en login:", error)
            
            let errorMessage = "Error al iniciar sesión"
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Login cancelado por el usuario"
                    break
                case 'auth/popup-blocked':
                    errorMessage = "Popup bloqueado. Permite popups y intenta de nuevo"
                    break
                case 'auth/network-request-failed':
                    errorMessage = "Error de conexión. Verifica tu internet"
                    break
                default:
                    errorMessage = "Error al iniciar sesión. Intenta de nuevo"
            }
            
            return { success: false, error: errorMessage }
        }
    },

    // Logout
    logout: async () => {
        try {
            await signOut(auth)
            console.log("✅ Logout exitoso")
            return { success: true }
        } catch (error) {
            console.error("❌ Error en logout:", error)
            return { success: false, error: "Error al cerrar sesión" }
        }
    },

    // Observer de cambios de autenticación
    onAuthStateChange: (callback) => {
        return onAuthStateChanged(auth, callback)
    }
}

// ===================================
// 👤 USER SERVICES - VERSIÓN MEJORADA
// ===================================

export const userService = {
    // Obtener datos del usuario
    getUserData: async (uid) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const userDoc = await getDoc(userDocRef)
            
            if (userDoc.exists()) {
                return { success: true, data: userDoc.data() }
            } else {
                return { success: false, error: "Usuario no encontrado" }
            }
        } catch (error) {
            console.error("❌ Error al obtener usuario:", error)
            return { success: false, error: "Error al obtener datos del usuario" }
        }
    },

    // 🔧 MEJORADO: Crear nuevo usuario SOLO si no existe
    createUser: async (uid, userData) => {
        try {
            const userDocRef = doc(db, "users", uid)
            
            // ✅ Verificar si ya existe antes de crear
            const existingUser = await getDoc(userDocRef)
            if (existingUser.exists()) {
                console.log("⚠️ Usuario ya existe, no se sobrescribe:", uid)
                return { 
                    success: false, 
                    error: "El usuario ya existe", 
                    data: existingUser.data(),
                    alreadyExists: true 
                }
            }

            // Crear solo si NO existe
            const newUserData = {
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                isAdmin: false,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                ...userData
            }
            
            await setDoc(userDocRef, newUserData)
            console.log("✅ Usuario creado:", newUserData)
            return { success: true, data: newUserData }
        } catch (error) {
            console.error("❌ Error al crear usuario:", error)
            return { success: false, error: "Error al crear usuario" }
        }
    },

    // 🆕 NUEVO: Crear o actualizar usuario (ideal para login)
    createOrUpdateUser: async (uid, userData) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const existingUser = await getDoc(userDocRef)
            
            if (existingUser.exists()) {
                // Usuario existe: solo actualizar lastLogin y datos opcionales
                const updateData = {
                    lastLogin: serverTimestamp(),
                    // Solo actualizar campos que pueden cambiar
                    ...(userData.name && { name: userData.name }),
                    ...(userData.email && { email: userData.email })
                }
                
                await setDoc(userDocRef, updateData, { merge: true })
                console.log("🔄 Usuario actualizado:", uid)
                
                const updatedData = { ...existingUser.data(), ...updateData }
                return { 
                    success: true, 
                    data: updatedData, 
                    wasUpdated: true 
                }
            } else {
                // Usuario no existe: crear nuevo
                const newUserData = {
                    email: userData.email,
                    name: userData.name || userData.email.split('@')[0],
                    isAdmin: false,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    ...userData
                }
                
                await setDoc(userDocRef, newUserData)
                console.log("✅ Usuario creado:", newUserData)
                return { 
                    success: true, 
                    data: newUserData, 
                    wasCreated: true 
                }
            }
        } catch (error) {
            console.error("❌ Error en createOrUpdateUser:", error)
            return { success: false, error: "Error al procesar usuario" }
        }
    },

    // 🔧 MEJORADO: Actualizar último login con merge
    updateLastLogin: async (uid) => {
        try {
            const userDocRef = doc(db, "users", uid)
            await setDoc(userDocRef, { 
                lastLogin: serverTimestamp() 
            }, { merge: true })  // ← IMPORTANTE: merge: true
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar lastLogin:", error)
            return { success: false, error: "Error al actualizar último acceso" }
        }
    },

    // 🔧 MEJORADO: Actualizar datos del usuario con campos filtrados
    updateUser: async (uid, updates) => {
        try {
            const userDocRef = doc(db, "users", uid)
            
            // Filtrar solo campos permitidos para actualizar
            const allowedFields = ['name', 'isAdmin', 'lastLogin']
            const filteredUpdates = Object.keys(updates)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updates[key]
                    return obj
                }, {})

            await setDoc(userDocRef, {
                ...filteredUpdates,
                updatedAt: serverTimestamp()
            }, { merge: true })  // ← IMPORTANTE: merge: true
            
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error)
            return { success: false, error: "Error al actualizar usuario" }
        }
    },

    // 🆕 NUEVO: Verificar si un usuario existe
    userExists: async (uid) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const userDoc = await getDoc(userDocRef)
            return userDoc.exists()
        } catch (error) {
            console.error("❌ Error al verificar usuario:", error)
            return false
        }
    }
}

// ===================================
// 🌱 CAMAS SERVICES - LEGACY (COMPATIBILIDAD)
// ===================================
// NOTA: Mantenemos estos servicios para compatibilidad con código existente
// pero se recomienda usar camaService para nuevas funcionalidades

export const camasService = {
    // 🔄 LEGACY: Obtener todas las camas (ahora usa el nuevo camaService)
    getAllCamas: async () => {
        try {
            // Para compatibilidad, obtenemos todas las camas de todos los viveros
            return await camaService.getAllCamasGlobal()
        } catch (error) {
            console.error("❌ Error al obtener camas (legacy):", error)
            return { success: false, error: "Error al cargar las camas" }
        }
    },

    // 🔄 LEGACY: Obtener una cama específica
    getCama: async (camaId) => {
        try {
            // PROBLEMA: No sabemos el viveroId, así que buscamos globalmente
            const allCamasResult = await camaService.getAllCamasGlobal()
            if (!allCamasResult.success) {
                return allCamasResult
            }

            const cama = allCamasResult.data.find(c => c.id === camaId)
            if (cama) {
                return { success: true, data: cama }
            } else {
                return { success: false, error: "Cama no encontrada" }
            }
        } catch (error) {
            console.error("❌ Error al obtener cama (legacy):", error)
            return { success: false, error: "Error al cargar la cama" }
        }
    },

    // 🚨 DEPRECATED: Crear nueva cama (usar camaService.createCama)
    createCama: async (camaId, camaData) => {
        console.warn("⚠️ DEPRECATED: Usar camaService.createCama(viveroId, camaId, camaData)")
        return { success: false, error: "Método deprecado. Especifica el viveroId." }
    },

    // 🚨 DEPRECATED: Actualizar cama (usar camaService.updateCama)
    updateCama: async (camaId, updates) => {
        console.warn("⚠️ DEPRECATED: Usar camaService.updateCama(viveroId, camaId, updates)")
        return { success: false, error: "Método deprecado. Especifica el viveroId." }
    },

    // 🚨 DEPRECATED: Eliminar cama (usar camaService.deleteCama)
    deleteCama: async (camaId) => {
        console.warn("⚠️ DEPRECATED: Usar camaService.deleteCama(viveroId, camaId)")
        return { success: false, error: "Método deprecado. Especifica el viveroId." }
    },

    // 🔄 LEGACY: Buscar camas por nombre de planta
    searchCamasByPlant: async (plantName) => {
        try {
            return await camaService.searchCamasByPlant(plantName)
        } catch (error) {
            console.error("❌ Error en búsqueda (legacy):", error)
            return { success: false, error: "Error al buscar camas" }
        }
    }
}

// ===================================
// 👨‍💼 ADMIN USER MANAGEMENT SERVICES
// ===================================

export const adminUserService = {
    // 📋 Obtener todos los usuarios (solo para admins)
    getAllUsers: async () => {
        try {
            const usersCollection = collection(db, "users")
            const q = query(usersCollection, orderBy("createdAt", "desc"))
            const usersSnapshot = await getDocs(q)
            
            const users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                lastLogin: doc.data().lastLogin?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))
            
            return { success: true, data: users }
        } catch (error) {
            console.error("❌ Error obteniendo usuarios:", error)
            return { success: false, error: "Error al cargar usuarios" }
        }
    },

    // ⏳ Obtener usuarios pendientes de aprobación
    getPendingUsers: async () => {
        try {
            const usersCollection = collection(db, "users")
            const q = query(
                usersCollection, 
                where("status", "==", "pending_approval"),
                orderBy("createdAt", "desc")
            )
            const usersSnapshot = await getDocs(q)
            
            const pendingUsers = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }))
            
            return { success: true, data: pendingUsers }
        } catch (error) {
            console.error("❌ Error obteniendo usuarios pendientes:", error)
            return { success: false, error: "Error al cargar usuarios pendientes" }
        }
    },

    // ✅ Aprobar usuario
    approveUser: async (uid, approvedBy, isAdmin = false) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const updateData = {
                status: 'active',
                isAdmin: isAdmin,
                needsApproval: false,
                approvedAt: serverTimestamp(),
                approvedBy: approvedBy,
                updatedAt: serverTimestamp()
            }
            
            await setDoc(userDocRef, updateData, { merge: true })
            console.log("✅ Usuario aprobado:", uid)
            
            return { 
                success: true, 
                message: `Usuario ${isAdmin ? 'aprobado como admin' : 'aprobado'} exitosamente` 
            }
        } catch (error) {
            console.error("❌ Error aprobando usuario:", error)
            return { success: false, error: "Error al aprobar usuario" }
        }
    },

    // ❌ Rechazar/eliminar usuario
    rejectUser: async (uid, rejectedBy, reason = "No especificado") => {
        try {
            // Opción 1: Eliminar completamente
            const userDocRef = doc(db, "users", uid)
            await deleteDoc(userDocRef)
            
            // Opción 2: Guardar registro de rechazo (opcional)
            const rejectionData = {
                uid: uid,
                rejectedBy: rejectedBy,
                reason: reason,
                rejectedAt: serverTimestamp()
            }
            await addDoc(collection(db, "user_rejections"), rejectionData)
            
            console.log("❌ Usuario rechazado y eliminado:", uid)
            return { success: true, message: "Usuario rechazado exitosamente" }
        } catch (error) {
            console.error("❌ Error rechazando usuario:", error)
            return { success: false, error: "Error al rechazar usuario" }
        }
    },

    // 🚫 Desactivar usuario existente
    deactivateUser: async (uid, deactivatedBy, reason = "No especificado") => {
        try {
            const userDocRef = doc(db, "users", uid)
            const updateData = {
                status: 'deactivated',
                isAdmin: false, // Remover permisos de admin
                deactivatedAt: serverTimestamp(),
                deactivatedBy: deactivatedBy,
                deactivationReason: reason,
                updatedAt: serverTimestamp()
            }
            
            await setDoc(userDocRef, updateData, { merge: true })
            console.log("🚫 Usuario desactivado:", uid)
            
            return { success: true, message: "Usuario desactivado exitosamente" }
        } catch (error) {
            console.error("❌ Error desactivando usuario:", error)
            return { success: false, error: "Error al desactivar usuario" }
        }
    },

    // 🔄 Reactivar usuario
    reactivateUser: async (uid, reactivatedBy) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const updateData = {
                status: 'active',
                needsApproval: false,
                reactivatedAt: serverTimestamp(),
                reactivatedBy: reactivatedBy,
                deactivatedAt: null,
                deactivationReason: null,
                updatedAt: serverTimestamp()
            }
            
            await setDoc(userDocRef, updateData, { merge: true })
            console.log("🔄 Usuario reactivado:", uid)
            
            return { success: true, message: "Usuario reactivado exitosamente" }
        } catch (error) {
            console.error("❌ Error reactivando usuario:", error)
            return { success: false, error: "Error al reactivar usuario" }
        }
    },

    // 👨‍💼 Cambiar permisos de admin
    toggleAdminPermission: async (uid, isAdmin, changedBy) => {
        try {
            const userDocRef = doc(db, "users", uid)
            const updateData = {
                isAdmin: isAdmin,
                adminChangedAt: serverTimestamp(),
                adminChangedBy: changedBy,
                updatedAt: serverTimestamp()
            }
            
            await setDoc(userDocRef, updateData, { merge: true })
            
            const action = isAdmin ? "otorgados" : "removidos"
            console.log(`👨‍💼 Permisos de admin ${action}:`, uid)
            
            return { 
                success: true, 
                message: `Permisos de admin ${action} exitosamente` 
            }
        } catch (error) {
            console.error("❌ Error cambiando permisos:", error)
            return { success: false, error: "Error al cambiar permisos" }
        }
    },

    // 📊 Obtener estadísticas de usuarios
    getUserStats: async () => {
        try {
            const usersCollection = collection(db, "users")
            const usersSnapshot = await getDocs(usersCollection)
            
            let stats = {
                total: 0,
                active: 0,
                pending: 0,
                deactivated: 0,
                admins: 0
            }
            
            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data()
                stats.total++
                
                if (userData.status === 'active') stats.active++
                else if (userData.status === 'pending_approval') stats.pending++
                else if (userData.status === 'deactivated') stats.deactivated++
                
                if (userData.isAdmin) stats.admins++
            })
            
            return { success: true, data: stats }
        } catch (error) {
            console.error("❌ Error obteniendo estadísticas:", error)
            return { success: false, error: "Error al cargar estadísticas" }
        }
    }
}

// ===================================
// 🔧 UTILITY FUNCTIONS
// ===================================

export const firebaseUtils = {
    // Verificar si un documento existe
    documentExists: async (collectionName, docId) => {
        try {
            const docRef = doc(db, collectionName, docId)
            const docSnap = await getDoc(docRef)
            return docSnap.exists()
        } catch (error) {
            console.error("❌ Error al verificar documento:", error)
            return false
        }
    },

    // Obtener timestamp del servidor
    getServerTimestamp: () => serverTimestamp(),

    // Formatear fecha de Firestore
    formatFirebaseDate: (timestamp) => {
        if (!timestamp) return null
        return timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    }
}
