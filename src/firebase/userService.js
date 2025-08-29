// src/firebase/userService.js
import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "./config.js";

/**
 * Crea o actualiza un usuario en Firestore
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.uid - ID único del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.name - Nombre del usuario
 * @returns {Promise<void>}
 */
export const createOrUpdateUser = async (userData) => {
    try {
        const { uid, email, name } = userData;
        const userRef = doc(db, "users", uid);

        // Verificar si el usuario ya existe
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // Usuario existente - actualizar solo lastLogin y nombre
            console.log("👤 Actualizando usuario existente:", email);
            await updateDoc(userRef, {
                name,
                lastLogin: serverTimestamp()
            });
        } else {
            // Usuario nuevo - crear con valores por defecto
            console.log("🆕 Creando nuevo usuario:", email);
            await setDoc(userRef, {
                email,
                name,
                isAdmin: false, // Por defecto no es admin
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        }

        console.log("✅ Usuario guardado correctamente en Firestore");
    } catch (error) {
        console.error("❌ Error guardando usuario:", error.message);
        throw new Error(`Error al guardar usuario: ${error.message}`);
    }
};

/**
 * Obtiene los datos de un usuario desde Firestore
 * @param {string} uid - ID único del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export const getUserData = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("📄 Datos del usuario obtenidos:", data.email, "- Admin:", data.isAdmin);
            return data;
        } else {
            console.log("❌ Usuario no encontrado en Firestore:", uid);
            // Retornar datos por defecto si no existe
            return {
                isAdmin: false,
                createdAt: null,
                lastLogin: null
            };
        }
    } catch (error) {
        console.error("❌ Error obteniendo datos del usuario:", error.message);
        throw new Error(`Error al obtener datos del usuario: ${error.message}`);
    }
};

/**
 * Obtiene todos los usuarios (solo para administradores)
 * @returns {Promise<Array>} Lista de todos los usuarios
 */
export const getAllUsers = async () => {
    try {
        console.log("📋 Obteniendo lista de todos los usuarios...");

        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ ${users.length} usuarios obtenidos`);
        return users;
    } catch (error) {
        console.error("❌ Error obteniendo usuarios:", error.message);
        throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
};