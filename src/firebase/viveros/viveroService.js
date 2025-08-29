// src/firebase/viveros/viveroService.js
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
    writeBatch
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * 🏡 VIVERO SERVICE - CRUD Operations
 * ============================================================================
 * Responsabilidad: Operaciones básicas CRUD para viveros
 * - Crear, leer, actualizar y eliminar viveros
 * - Validaciones básicas
 * - Gestión de documentos en Firestore
 * ============================================================================
 */

/**
 * Crea un nuevo vivero en Firestore
 * @param {Object} viveroData - Datos del vivero
 * @param {string} viveroData.id - ID único del vivero (slug)
 * @param {string} viveroData.nombre - Nombre del vivero
 * @param {string} viveroData.descripcion - Descripción del vivero
 * @param {Object} viveroData.ubicacion - Datos de ubicación
 * @param {string} viveroData.responsable - Nombre del responsable
 * @param {Object} viveroData.configuracion - Configuraciones del vivero
 * @param {string} createdBy - Email del usuario que crea el vivero
 * @returns {Promise<string>} ID del vivero creado
 */
export const createVivero = async (viveroData, createdBy) => {
    try {
        const { id, nombre, descripcion, ubicacion, responsable, configuracion } = viveroData;

        // Validar datos requeridos
        if (!id || !nombre) {
            throw new Error("ID y nombre del vivero son requeridos");
        }

        // Verificar que el ID no exista
        const viveroRef = doc(db, "viveros", id);
        const existingVivero = await getDoc(viveroRef);

        if (existingVivero.exists()) {
            throw new Error(`Ya existe un vivero con ID: ${id}`);
        }

        console.log("🌱 Creando nuevo vivero:", nombre);

        // Estructura completa del vivero según documentación v2.0
        const viveroDocument = {
            id,
            nombre,
            descripcion: descripcion || "",
            ubicacion: {
                tipo: ubicacion?.tipo || "vacio",
                coordenadas: ubicacion?.coordenadas || null,
                direccion: ubicacion?.direccion || "",
                timestamp: ubicacion?.timestamp || null
            },
            responsable: responsable || "",
            configuracion: {
                permitirQRPublico: configuracion?.permitirQRPublico ?? true,
                mostrarEnListaPublica: configuracion?.mostrarEnListaPublica ?? true,
                ...configuracion
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
            createdBy
        };

        await setDoc(viveroRef, viveroDocument);

        console.log("✅ Vivero creado exitosamente:", id);
        return id;

    } catch (error) {
        console.error("❌ Error creando vivero:", error.message);
        throw new Error(`Error al crear vivero: ${error.message}`);
    }
};

/**
 * Obtiene un vivero por su ID
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<Object|null>} Datos del vivero o null si no existe
 */
export const getVivero = async (viveroId) => {
    try {
        const viveroRef = doc(db, "viveros", viveroId);
        const viveroDoc = await getDoc(viveroRef);

        if (!viveroDoc.exists()) {
            console.log("❌ Vivero no encontrado:", viveroId);
            return null;
        }

        const viveroData = { id: viveroDoc.id, ...viveroDoc.data() };
        console.log("📄 Vivero obtenido:", viveroData.nombre);
        return viveroData;

    } catch (error) {
        console.error("❌ Error obteniendo vivero:", error.message);
        throw new Error(`Error al obtener vivero: ${error.message}`);
    }
};

/**
 * Obtiene todos los viveros con filtros opcionales
 * @param {Object} options - Opciones de filtrado
 * @param {boolean} options.publicOnly - Solo viveros públicos
 * @param {number} options.limitResults - Límite de resultados
 * @param {string} options.orderBy - Campo para ordenar
 * @returns {Promise<Array>} Lista de viveros
 */
export const getAllViveros = async (options = {}) => {
    try {
        const {
            publicOnly = false,
            limitResults = null,
            orderBy: orderField = "createdAt"
        } = options;

        console.log("📋 Obteniendo lista de viveros...");

        const viverosRef = collection(db, "viveros");
        let q = query(viverosRef, orderBy(orderField, "desc"));

        // Filtrar solo viveros públicos si se requiere
        if (publicOnly) {
            q = query(q, where("configuracion.mostrarEnListaPublica", "==", true));
        }

        // Aplicar límite si se especifica
        if (limitResults) {
            q = query(q, limit(limitResults));
        }

        const querySnapshot = await getDocs(q);
        const viveros = [];

        querySnapshot.forEach((doc) => {
            viveros.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ ${viveros.length} viveros obtenidos`);
        return viveros;

    } catch (error) {
        console.error("❌ Error obteniendo viveros:", error.message);
        throw new Error(`Error al obtener viveros: ${error.message}`);
    }
};

/**
 * Actualiza un vivero existente
 * @param {string} viveroId - ID del vivero
 * @param {Object} updateData - Datos a actualizar
 * @param {string} updatedBy - Email del usuario que actualiza
 * @returns {Promise<void>}
 */
export const updateVivero = async (viveroId, updateData, updatedBy) => {
    try {
        const viveroRef = doc(db, "viveros", viveroId);

        // Verificar que el vivero existe
        const viveroDoc = await getDoc(viveroRef);
        if (!viveroDoc.exists()) {
            throw new Error(`Vivero no encontrado: ${viveroId}`);
        }

        console.log("🔄 Actualizando vivero:", viveroId);

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

        await updateDoc(viveroRef, updatePayload);

        console.log("✅ Vivero actualizado exitosamente");

    } catch (error) {
        console.error("❌ Error actualizando vivero:", error.message);
        throw new Error(`Error al actualizar vivero: ${error.message}`);
    }
};

/**
 * Elimina un vivero y todas sus camas (operación peligrosa)
 * @param {string} viveroId - ID del vivero a eliminar
 * @returns {Promise<void>}
 */
export const deleteVivero = async (viveroId) => {
    try {
        console.log("🗑️ Eliminando vivero:", viveroId);

        const batch = writeBatch(db);
        const viveroRef = doc(db, "viveros", viveroId);

        // Verificar que el vivero existe
        const viveroDoc = await getDoc(viveroRef);
        if (!viveroDoc.exists()) {
            throw new Error(`Vivero no encontrado: ${viveroId}`);
        }

        // Obtener todas las camas del vivero para eliminarlas
        const camasRef = collection(db, "viveros", viveroId, "camas");
        const camasSnapshot = await getDocs(camasRef);

        // Eliminar cada cama y sus cortes de esquejes
        for (const camaDoc of camasSnapshot.docs) {
            const camaId = camaDoc.id;

            // Eliminar cortes de esquejes de la cama
            const cortesRef = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes");
            const cortesSnapshot = await getDocs(cortesRef);

            cortesSnapshot.forEach((corteDoc) => {
                batch.delete(corteDoc.ref);
            });

            // Eliminar la cama
            batch.delete(camaDoc.ref);
        }

        // Eliminar el vivero
        batch.delete(viveroRef);

        // Ejecutar todas las eliminaciones
        await batch.commit();

        console.log("✅ Vivero eliminado completamente");

    } catch (error) {
        console.error("❌ Error eliminando vivero:", error.message);
        throw new Error(`Error al eliminar vivero: ${error.message}`);
    }
};

/**
 * Verifica si un vivero existe
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<boolean>} Si el vivero existe
 */
export const viveroExists = async (viveroId) => {
    try {
        const viveroRef = doc(db, "viveros", viveroId);
        const viveroDoc = await getDoc(viveroRef);
        return viveroDoc.exists();
    } catch (error) {
        console.error("❌ Error verificando existencia del vivero:", error.message);
        return false;
    }
};

// Exports por defecto para facilitar importación
export default {
    createVivero,
    getVivero,
    getAllViveros,
    updateVivero,
    deleteVivero,
    viveroExists
};