// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthChange, signInWithGoogle, signOut } from "../firebase/auth.js";

// Context para compartir el estado de autenticación
const AuthContext = createContext();

/**
 * Provider del contexto de autenticación
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("🔄 Inicializando listener de autenticación...");

        const unsubscribe = onAuthChange((userData) => {
            setUser(userData);
            setLoading(false);

            if (userData) {
                console.log("✅ Usuario autenticado:", userData.email, "- Admin:", userData.isAdmin);
            } else {
                console.log("🚪 Usuario no autenticado");
            }
        });

        // Cleanup function
        return () => {
            console.log("🧹 Limpiando listener de autenticación");
            unsubscribe();
        };
    }, []);

    /**
     * Función para hacer login con Google
     */
    const login = async () => {
        try {
            setError(null);
            setLoading(true);

            const userData = await signInWithGoogle();
            console.log("🎉 Login completado exitosamente");

            // El user se actualizará automáticamente por el onAuthChange
            return userData;
        } catch (error) {
            console.error("❌ Error en login:", error.message);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Función para cerrar sesión
     */
    const logout = async () => {
        try {
            setError(null);
            await signOut();
            console.log("👋 Logout completado");

            // El user se actualizará a null automáticamente por el onAuthChange
        } catch (error) {
            console.error("❌ Error en logout:", error.message);
            setError(error.message);
            throw error;
        }
    };

    /**
     * Limpia el error actual
     */
    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        clearError,
        // Helpers útiles
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para usar el contexto de autenticación
 * @returns {Object} Contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }

    return context;
};

export default useAuth;