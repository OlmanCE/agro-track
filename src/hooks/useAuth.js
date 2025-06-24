import { useState, useEffect } from "react"
import { authService, userService } from "../firebase/firebaseService"

export const useAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [authError, setAuthError] = useState(null)

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
            setAuthError(null) // Reset error state
            
            if (firebaseUser) {
                try {
                    // Verificar si el usuario existe en Firestore
                    const userResult = await userService.getUserData(firebaseUser.uid)

                    if (!userResult.success) {
                        // Crear documento de usuario si no existe
                        const userData = {
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
                        }
                        
                        const createResult = await userService.createUser(firebaseUser.uid, userData)
                        if (createResult.success) {
                            setIsAdmin(false)
                            console.log("✅ Usuario creado automáticamente")
                        } else {
                            throw new Error(createResult.error)
                        }
                    } else {
                        // Usuario existe, obtener rol y actualizar lastLogin
                        const userData = userResult.data
                        setIsAdmin(userData.isAdmin || false)
                        
                        // Actualizar último login (sin esperar respuesta)
                        userService.updateLastLogin(firebaseUser.uid)
                        console.log("✅ Usuario autenticado:", userData.email)
                    }

                    setUser(firebaseUser)
                } catch (error) {
                    console.error("❌ Error al configurar usuario:", error)
                    setAuthError("Error al configurar usuario. Intenta de nuevo.")
                }
            } else {
                setUser(null)
                setIsAdmin(false)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Función para login con Google
    const loginWithGoogle = async () => {
        try {
            setLoading(true)
            setAuthError(null)
            
            const result = await authService.loginWithGoogle()
            if (!result.success) {
                setAuthError(result.error)
                return null
            }
            
            return result.user
        } catch (error) {
            console.error("❌ Error inesperado en login:", error)
            setAuthError("Error inesperado. Intenta de nuevo.")
            return null
        } finally {
            setLoading(false)
        }
    }

    // Función para logout
    const logout = async () => {
        try {
            setLoading(true)
            const result = await authService.logout()
            
            if (!result.success) {
                setAuthError(result.error)
            }
        } catch (error) {
            console.error("❌ Error inesperado en logout:", error)
            setAuthError("Error al cerrar sesión")
        } finally {
            setLoading(false)
        }
    }

    // Función para refrescar datos del usuario
    const refreshUserData = async () => {
        if (!user) return null
        
        try {
            const result = await userService.getUserData(user.uid)
            if (result.success) {
                setIsAdmin(result.data.isAdmin || false)
                return result.data
            }
            return null
        } catch (error) {
            console.error("❌ Error al refrescar datos:", error)
            return null
        }
    }

    // Función para actualizar datos del usuario actual
    const updateCurrentUser = async (updates) => {
        if (!user) return { success: false, error: "Usuario no autenticado" }
        
        try {
            const result = await userService.updateUser(user.uid, updates)
            if (result.success) {
                // Refrescar datos locales
                await refreshUserData()
            }
            return result
        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error)
            return { success: false, error: "Error al actualizar datos" }
        }
    }

    return {
        // Estados
        user,
        isAdmin,
        loading,
        authError,
        isAuthenticated: !!user,
        
        // Funciones
        loginWithGoogle,
        logout,
        refreshUserData,
        updateCurrentUser,
        
        // Datos computados útiles
        userEmail: user?.email || null,
        userName: user?.displayName || user?.email?.split('@')[0] || null,
        userPhoto: user?.photoURL || null,
        userId: user?.uid || null,
        
        // Helpers
        clearError: () => setAuthError(null)
    }
}