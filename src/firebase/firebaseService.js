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
// 👤 USER SERVICES
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

    // Crear nuevo usuario
    createUser: async (uid, userData) => {
        try {
            const userDocRef = doc(db, "users", uid)
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

    // Actualizar último login
    updateLastLogin: async (uid) => {
        try {
            const userDocRef = doc(db, "users", uid)
            await setDoc(userDocRef, { 
                lastLogin: serverTimestamp() 
            }, { merge: true })
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar lastLogin:", error)
            return { success: false, error: "Error al actualizar último acceso" }
        }
    },

    // Actualizar datos del usuario
    updateUser: async (uid, updates) => {
        try {
            const userDocRef = doc(db, "users", uid)
            await updateDoc(userDocRef, {
                ...updates,
                updatedAt: serverTimestamp()
            })
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error)
            return { success: false, error: "Error al actualizar usuario" }
        }
    }
}

// ===================================
// 🌱 CAMAS SERVICES
// ===================================

export const camasService = {
    // Obtener todas las camas
    getAllCamas: async () => {
        try {
            const camasCollection = collection(db, "camas")
            const camasSnapshot = await getDocs(camasCollection)
            const camas = camasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            return { success: true, data: camas }
        } catch (error) {
            console.error("❌ Error al obtener camas:", error)
            return { success: false, error: "Error al cargar las camas" }
        }
    },

    // Obtener una cama específica
    getCama: async (camaId) => {
        try {
            const camaDocRef = doc(db, "camas", camaId)
            const camaDoc = await getDoc(camaDocRef)
            
            if (camaDoc.exists()) {
                return { 
                    success: true, 
                    data: { id: camaDoc.id, ...camaDoc.data() } 
                }
            } else {
                return { success: false, error: "Cama no encontrada" }
            }
        } catch (error) {
            console.error("❌ Error al obtener cama:", error)
            return { success: false, error: "Error al cargar la cama" }
        }
    },

    // Crear nueva cama
    createCama: async (camaId, camaData) => {
        try {
            const camaDocRef = doc(db, "camas", camaId)
            
            // Verificar si ya existe
            const existingCama = await getDoc(camaDocRef)
            if (existingCama.exists()) {
                return { success: false, error: "Ya existe una cama con este ID" }
            }

            const newCamaData = {
                nombrePlanta: camaData.nombrePlanta,
                cantidadPlantas: camaData.cantidadPlantas,
                esquejes: camaData.esquejes,
                sustrato: camaData.sustrato,
                tarroSize: camaData.tarroSize,
                tarroUnidad: camaData.tarroUnidad,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
            
            await setDoc(camaDocRef, newCamaData)
            console.log("✅ Cama creada:", camaId)
            return { success: true, data: { id: camaId, ...newCamaData } }
        } catch (error) {
            console.error("❌ Error al crear cama:", error)
            return { success: false, error: "Error al crear la cama" }
        }
    },

    // Actualizar cama existente
    updateCama: async (camaId, updates) => {
        try {
            const camaDocRef = doc(db, "camas", camaId)
            await updateDoc(camaDocRef, {
                ...updates,
                updatedAt: serverTimestamp()
            })
            console.log("✅ Cama actualizada:", camaId)
            return { success: true }
        } catch (error) {
            console.error("❌ Error al actualizar cama:", error)
            return { success: false, error: "Error al actualizar la cama" }
        }
    },

    // Eliminar cama
    deleteCama: async (camaId) => {
        try {
            const camaDocRef = doc(db, "camas", camaId)
            await deleteDoc(camaDocRef)
            console.log("✅ Cama eliminada:", camaId)
            return { success: true }
        } catch (error) {
            console.error("❌ Error al eliminar cama:", error)
            return { success: false, error: "Error al eliminar la cama" }
        }
    },

    // Buscar camas por nombre de planta
    searchCamasByPlant: async (plantName) => {
        try {
            const camasCollection = collection(db, "camas")
            const q = query(
                camasCollection, 
                where("nombrePlanta", ">=", plantName),
                where("nombrePlanta", "<=", plantName + '\uf8ff')
            )
            const querySnapshot = await getDocs(q)
            const camas = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            return { success: true, data: camas }
        } catch (error) {
            console.error("❌ Error en búsqueda:", error)
            return { success: false, error: "Error al buscar camas" }
        }
    }
}

// ===================================
// 🔧 UTILITY FUNCTIONS
// ===================================

export const firebaseUtils = {
    // Verificar si un documento existe
    documentExists: async (collection, docId) => {
        try {
            const docRef = doc(db, collection, docId)
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