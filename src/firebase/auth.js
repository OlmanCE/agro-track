// src/firebase/auth.js
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "./config.js";
import { createOrUpdateUser, getUserData } from "./userService.js";

/**
 * Inicia sesión con Google
 * @returns {Promise<Object>} Usuario autenticado con datos de Firestore
 */
export const signInWithGoogle = async () => {
    try {
        console.log("🔐 Iniciando login con Google...");

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        console.log("✅ Login exitoso:", user.email);

        // Crear o actualizar usuario en Firestore
        await createOrUpdateUser({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL
        });

        // Obtener datos completos del usuario desde Firestore
        const userData = await getUserData(user.uid);

        return {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            ...userData // Incluye isAdmin, createdAt, etc.
        };

    } catch (error) {
        console.error("❌ Error en login:", error.message);
        throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
};

/**
 * Cierra la sesión del usuario
 * @returns {Promise<void>}
 */
export const signOut = async () => {
    try {
        console.log("🚪 Cerrando sesión...");
        await firebaseSignOut(auth);
        console.log("✅ Sesión cerrada exitosamente");
    } catch (error) {
        console.error("❌ Error al cerrar sesión:", error.message);
        throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
};

/**
 * Obtiene el usuario actual con datos completos de Firestore
 * @returns {Promise<Object|null>} Usuario actual o null si no está autenticado
 */
export const getCurrentUser = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const userData = await getUserData(user.uid);
        return {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            ...userData
        };
    } catch (error) {
        console.error("❌ Error obteniendo datos del usuario:", error.message);
        return {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            isAdmin: false // Valor por defecto si hay error
        };
    }
};

/**
 * Escucha cambios en el estado de autenticación
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado
 * @returns {Function} Función para cancelar la suscripción
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Usuario autenticado - obtener datos completos
            try {
                const userData = await getUserData(user.uid);
                const fullUserData = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    ...userData
                };
                callback(fullUserData);
            } catch (error) {
                console.error("❌ Error obteniendo datos del usuario:", error.message);
                // Enviar datos básicos si hay error con Firestore
                callback({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    isAdmin: false
                });
            }
        } else {
            // Usuario no autenticado
            callback(null);
        }
    });
};