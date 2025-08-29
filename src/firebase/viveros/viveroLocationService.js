// src/firebase/viveros/viveroLocationService.js
import {
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../config.js";

/**
 * ============================================================================
 * 📍 VIVERO LOCATION SERVICE
 * ============================================================================
 * Responsabilidad: Gestión de ubicación y geolocalización GPS
 * - Actualización de coordenadas GPS
 * - Gestión de ubicaciones manuales
 * - Obtención de ubicación actual del navegador
 * - Cálculo de distancias entre ubicaciones
 * ============================================================================
 */

/**
 * Actualiza la ubicación GPS de un vivero
 * @param {string} viveroId - ID del vivero
 * @param {Object} gpsData - Datos de GPS
 * @param {number} gpsData.lat - Latitud
 * @param {number} gpsData.lng - Longitud
 * @param {string} gpsData.direccion - Dirección opcional obtenida del GPS
 * @returns {Promise<void>}
 */
export const updateViveroGPS = async (viveroId, gpsData) => {
    try {
        const { lat, lng, direccion } = gpsData;

        if (!lat || !lng) {
            throw new Error("Coordenadas GPS requeridas");
        }

        // Validar que las coordenadas sean números válidos
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new Error("Las coordenadas deben ser números válidos");
        }

        // Validar rango de coordenadas
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error("Coordenadas fuera del rango válido");
        }

        console.log("📍 Actualizando GPS del vivero:", viveroId);

        const viveroRef = doc(db, "viveros", viveroId);
        
        await updateDoc(viveroRef, {
            "ubicacion.tipo": "gps",
            "ubicacion.coordenadas": { lat, lng },
            "ubicacion.direccion": direccion || "",
            "ubicacion.timestamp": serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ GPS actualizado: ${lat}, ${lng}`);

    } catch (error) {
        console.error("❌ Error actualizando GPS:", error.message);
        throw new Error(`Error al actualizar GPS: ${error.message}`);
    }
};

/**
 * Actualiza la ubicación manual de un vivero
 * @param {string} viveroId - ID del vivero
 * @param {string} direccionManual - Dirección ingresada manualmente
 * @returns {Promise<void>}
 */
export const updateViveroUbicacionManual = async (viveroId, direccionManual) => {
    try {
        if (!direccionManual || direccionManual.trim().length === 0) {
            throw new Error("Dirección manual requerida");
        }

        console.log("📝 Actualizando ubicación manual del vivero:", viveroId);

        const viveroRef = doc(db, "viveros", viveroId);
        
        await updateDoc(viveroRef, {
            "ubicacion.tipo": "manual",
            "ubicacion.coordenadas": null,
            "ubicacion.direccion": direccionManual.trim(),
            "ubicacion.timestamp": serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log("✅ Ubicación manual actualizada");

    } catch (error) {
        console.error("❌ Error actualizando ubicación manual:", error.message);
        throw new Error(`Error al actualizar ubicación manual: ${error.message}`);
    }
};

/**
 * Limpia la ubicación de un vivero (la deja vacía)
 * @param {string} viveroId - ID del vivero
 * @returns {Promise<void>}
 */
export const clearViveroUbicacion = async (viveroId) => {
    try {
        console.log("🧹 Limpiando ubicación del vivero:", viveroId);

        const viveroRef = doc(db, "viveros", viveroId);
        
        await updateDoc(viveroRef, {
            "ubicacion.tipo": "vacio",
            "ubicacion.coordenadas": null,
            "ubicacion.direccion": "",
            "ubicacion.timestamp": null,
            updatedAt: serverTimestamp()
        });

        console.log("✅ Ubicación limpiada");

    } catch (error) {
        console.error("❌ Error limpiando ubicación:", error.message);
        throw new Error(`Error al limpiar ubicación: ${error.message}`);
    }
};

/**
 * Obtiene la ubicación GPS actual del navegador
 * @param {Object} options - Opciones de geolocalización
 * @param {number} options.timeout - Timeout en ms (default: 10000)
 * @param {boolean} options.enableHighAccuracy - Alta precisión (default: true)
 * @param {number} options.maximumAge - Edad máxima del cache (default: 300000)
 * @returns {Promise<Object>} Coordenadas GPS actuales
 */
export const getCurrentGPSLocation = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada por este navegador"));
            return;
        }

        const {
            timeout = 10000,
            enableHighAccuracy = true,
            maximumAge = 300000 // 5 minutos
        } = options;

        console.log("🌍 Obteniendo ubicación GPS actual...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: lat, longitude: lng, accuracy } = position.coords;
                
                console.log(`✅ GPS obtenido: ${lat}, ${lng} (precisión: ${accuracy}m)`);
                
                resolve({
                    lat,
                    lng,
                    accuracy,
                    timestamp: new Date(position.timestamp)
                });
            },
            (error) => {
                let errorMessage = "Error desconocido al obtener GPS";
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permisos de geolocalización denegados";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Ubicación no disponible";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Timeout al obtener ubicación GPS";
                        break;
                }

                console.error("❌ Error GPS:", errorMessage);
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );
    });
};

/**
 * Obtiene la ubicación GPS y actualiza el vivero automáticamente
 * @param {string} viveroId - ID del vivero
 * @param {Object} options - Opciones de geolocalización
 * @returns {Promise<Object>} Coordenadas obtenidas y guardadas
 */
export const captureAndSaveGPS = async (viveroId, options = {}) => {
    try {
        console.log("📡 Capturando GPS y guardando en vivero:", viveroId);

        // Obtener ubicación GPS actual
        const gpsLocation = await getCurrentGPSLocation(options);
        
        // Intentar obtener dirección legible (geocodificación inversa)
        let direccion = "";
        try {
            direccion = await reverseGeocode(gpsLocation.lat, gpsLocation.lng);
        } catch (geocodeError) {
            console.warn("⚠️ No se pudo obtener dirección:", geocodeError.message);
            direccion = `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}`;
        }

        // Guardar en el vivero
        await updateViveroGPS(viveroId, {
            lat: gpsLocation.lat,
            lng: gpsLocation.lng,
            direccion
        });

        const result = {
            ...gpsLocation,
            direccion,
            saved: true
        };

        console.log("✅ GPS capturado y guardado exitosamente");
        return result;

    } catch (error) {
        console.error("❌ Error capturando y guardando GPS:", error.message);
        throw error;
    }
};

/**
 * Calcula la distancia entre dos puntos GPS (en kilómetros)
 * Utiliza la fórmula de Haversine
 * @param {Object} point1 - Primer punto {lat, lng}
 * @param {Object} point2 - Segundo punto {lat, lng}
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (point1, point2) => {
    try {
        const { lat: lat1, lng: lng1 } = point1;
        const { lat: lat2, lng: lng2 } = point2;

        const R = 6371; // Radio de la Tierra en km
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);

        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Redondear a 2 decimales

    } catch (error) {
        console.error("❌ Error calculando distancia:", error.message);
        return null;
    }
};

/**
 * Convierte grados a radianes
 * @param {number} degrees - Grados
 * @returns {number} Radianes
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Obtiene la dirección legible desde coordenadas GPS (geocodificación inversa)
 * Utiliza la API de OpenStreetMap Nominatim (gratuita)
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<string>} Dirección legible
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Agro-Track/1.0'
            }
        });

        if (!response.ok) {
            throw new Error("Error en la respuesta de geocodificación");
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Construir dirección legible
        const address = data.address || {};
        const components = [
            address.road || address.path,
            address.city || address.town || address.village,
            address.state || address.county,
            address.country
        ].filter(Boolean);

        const direccion = components.length > 0 
            ? components.join(', ')
            : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        console.log("📍 Dirección obtenida:", direccion);
        return direccion;

    } catch (error) {
        console.error("❌ Error en geocodificación inversa:", error.message);
        throw new Error(`Error obteniendo dirección: ${error.message}`);
    }
};

/**
 * Valida si unas coordenadas GPS son válidas
 * @param {Object} coords - Coordenadas {lat, lng}
 * @returns {Object} Resultado de validación {valid, errors}
 */
export const validateGPSCoordinates = (coords) => {
    const errors = [];
    
    if (!coords || typeof coords !== 'object') {
        errors.push("Las coordenadas deben ser un objeto");
        return { valid: false, errors };
    }

    const { lat, lng } = coords;

    if (typeof lat !== 'number' || isNaN(lat)) {
        errors.push("Latitud debe ser un número válido");
    } else if (lat < -90 || lat > 90) {
        errors.push("Latitud debe estar entre -90 y 90");
    }

    if (typeof lng !== 'number' || isNaN(lng)) {
        errors.push("Longitud debe ser un número válido");
    } else if (lng < -180 || lng > 180) {
        errors.push("Longitud debe estar entre -180 y 180");
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Obtiene viveros cercanos a una ubicación específica
 * @param {Object} centerPoint - Punto central {lat, lng}
 * @param {number} radiusKm - Radio en kilómetros
 * @param {Array} viveros - Lista de viveros a filtrar
 * @returns {Array} Viveros cercanos con distancia calculada
 */
export const getNearbyViveros = (centerPoint, radiusKm, viveros) => {
    try {
        const nearbyViveros = viveros
            .filter(vivero => {
                // Solo considerar viveros con GPS
                const coords = vivero.ubicacion?.coordenadas;
                return coords && coords.lat && coords.lng;
            })
            .map(vivero => {
                const distance = calculateDistance(centerPoint, vivero.ubicacion.coordenadas);
                return {
                    ...vivero,
                    distanceKm: distance
                };
            })
            .filter(vivero => vivero.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        console.log(`🗺️ ${nearbyViveros.length} viveros encontrados en radio de ${radiusKm}km`);
        return nearbyViveros;

    } catch (error) {
        console.error("❌ Error buscando viveros cercanos:", error.message);
        return [];
    }
};

/**
 * Formatea coordenadas GPS para mostrar
 * @param {Object} coords - Coordenadas {lat, lng}
 * @param {number} precision - Decimales de precisión (default: 6)
 * @returns {string} Coordenadas formateadas
 */
export const formatGPSCoordinates = (coords, precision = 6) => {
    try {
        if (!coords || !coords.lat || !coords.lng) {
            return "Sin coordenadas";
        }

        const lat = parseFloat(coords.lat).toFixed(precision);
        const lng = parseFloat(coords.lng).toFixed(precision);
        
        return `${lat}, ${lng}`;

    } catch (error) {
        return "Coordenadas inválidas";
    }
};

// Exports por defecto
export default {
    updateViveroGPS,
    updateViveroUbicacionManual,
    clearViveroUbicacion,
    getCurrentGPSLocation,
    captureAndSaveGPS,
    calculateDistance,
    reverseGeocode,
    validateGPSCoordinates,
    getNearbyViveros,
    formatGPSCoordinates
};