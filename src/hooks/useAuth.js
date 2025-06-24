import { useState, useEffect } from "react"
import { authService, userService } from "../firebase/firebaseService"

export const useAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [authError, setAuthError] = useState(null)
    const [needsApproval, setNeedsApproval] = useState(false)

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
            setAuthError(null)
            setNeedsApproval(false)
            
            if (firebaseUser) {
                try {
                    // Verificar si el usuario existe en Firestore
                    const userResult = await userService.getUserData(firebaseUser.uid)

                    if (!userResult.success) {
                        // 🚨 USUARIO SIN DOCUMENTO EN FIRESTORE
                        const isFirstTime = await isFirstTimeLogin(firebaseUser)
                        
                        if (isFirstTime) {
                            // ✅ Primera vez: crear usuario
                            
                            // 🔧 MODO DESARROLLO: Auto-admin para testing
                            const isDeveloper = firebaseUser.email === "olmancastro57@gmail.com"
                            
                            console.log(isDeveloper ? "🔧 MODO DEV: Creando admin automático" : "✅ Creando usuario normal")
                            
                            const userData = {
                                email: firebaseUser.email,
                                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                                status: isDeveloper ? 'active' : 'pending_approval',
                                isAdmin: isDeveloper, // ← Auto-admin si es tu email
                                needsApproval: !isDeveloper // ← No necesita aprobación si es dev
                            }
                            
                            const createResult = await userService.createOrUpdateUser(firebaseUser.uid, userData)
                            if (createResult.success) {
                                setUser(firebaseUser)
                                setIsAdmin(isDeveloper)
                                setNeedsApproval(!isDeveloper)
                                console.log(isDeveloper ? "✅ Admin automático creado" : "✅ Usuario pendiente creado")
                            } else {
                                throw new Error(createResult.error)
                            }
                        } else {
                            // ❌ Usuario eliminado: NO permitir acceso
                            console.error("❌ Usuario eliminado del sistema")
                            setAuthError("Tu cuenta ha sido eliminada. Contacta al administrador para solicitar reactivación.")
                            await authService.logout()
                            setUser(null)
                            setIsAdmin(false)
                        }
                    } else {
                        // Usuario existe: verificar estado
                        const userData = userResult.data
                        
                        // Verificar si está activo
                        if (userData.status === 'pending_approval') {
                            setUser(firebaseUser)
                            setIsAdmin(false)
                            setNeedsApproval(true)
                            console.log("⏳ Usuario pendiente de aprobación")
                        } else if (userData.status === 'deactivated') {
                            setAuthError("Tu cuenta está desactivada. Contacta al administrador.")
                            await authService.logout()
                            setUser(null)
                            setIsAdmin(false)
                        } else {
                            // Usuario activo normal
                            setIsAdmin(userData.isAdmin || false)
                            setUser(firebaseUser)
                            setNeedsApproval(false)
                            
                            // Actualizar último login
                            userService.updateLastLogin(firebaseUser.uid)
                            console.log("✅ Usuario autenticado:", userData.email)
                        }
                    }
                } catch (error) {
                    console.error("❌ Error al verificar usuario:", error)
                    setAuthError("Error al verificar tu cuenta. Intenta de nuevo.")
                    await authService.logout()
                }
            } else {
                setUser(null)
                setIsAdmin(false)
                setNeedsApproval(false)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Detectar si es primera vez (más generoso para testing)
    const isFirstTimeLogin = async (firebaseUser) => {
        try {
            const metadata = firebaseUser.metadata
            const creationTime = new Date(metadata.creationTime)
            const now = new Date()
            const timeDiff = now - creationTime
            
            // 🔧 MODO DESARROLLO: Si es tu email, siempre permitir
            if (firebaseUser.email === "olmancastro57@gmail.com") {
                console.log("🔧 Email de desarrollador detectado - Permitiendo acceso")
                return true
            }
            
            // Primera vez si la cuenta se creó hace menos de 5 minutos (más generoso)
            return timeDiff < 300000 // 5 minutos
        } catch (error) {
            console.error("❌ Error detectando primer login:", error)
            // Para tu email, siempre retornar true
            return firebaseUser.email === "olmancastro57@gmail.com"
        }
    }

    // Resto de funciones...
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

    const refreshUserData = async () => {
        if (!user) return null
        
        try {
            const result = await userService.getUserData(user.uid)
            if (result.success) {
                const userData = result.data
                
                if (userData.status === 'pending_approval') {
                    setNeedsApproval(true)
                    setIsAdmin(false)
                } else if (userData.status === 'deactivated') {
                    setAuthError("Tu cuenta ha sido desactivada.")
                    await logout()
                    return null
                } else {
                    setIsAdmin(userData.isAdmin || false)
                    setNeedsApproval(false)
                }
                
                return userData
            } else {
                setAuthError("Tu cuenta ha sido eliminada.")
                await logout()
                return null
            }
        } catch (error) {
            console.error("❌ Error al refrescar datos:", error)
            return null
        }
    }

    return {
        // Estados
        user,
        isAdmin,
        loading,
        authError,
        needsApproval,
        isAuthenticated: !!user,
        
        // Estados computados
        isActive: !!user && !needsApproval,
        canAccessSystem: !!user && !needsApproval && !authError,
        
        // Funciones
        loginWithGoogle,
        logout,
        refreshUserData,
        
        // Datos del usuario
        userEmail: user?.email || null,
        userName: user?.displayName || user?.email?.split('@')[0] || null,
        userPhoto: user?.photoURL || null,
        userId: user?.uid || null,
        
        // Helpers
        clearError: () => setAuthError(null)
    }
}