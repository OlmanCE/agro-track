// src/firebase/chartService.js
import { 
    collection,
    getDocs,
    query,
    where,
    orderBy,
    collectionGroup,
    Timestamp
} from "firebase/firestore"
import { db } from "./config"

// ===================================
// 📊 CHART & ANALYTICS SERVICES
// ===================================

export const chartService = {
    // 📊 Obtener esquejes por vivero (para gráfico de barras)
    getEsquejesByVivero: async (periodo = 'ultimo_mes') => {
        try {
            const fechaLimite = getFechaLimite(periodo)
            const viverosCollection = collection(db, "viveros")
            const viverosSnapshot = await getDocs(viverosCollection)
            
            const resultados = []
            
            for (const viveroDoc of viverosSnapshot.docs) {
                const viveroId = viveroDoc.id
                const viveroData = viveroDoc.data()
                
                // Obtener todos los cortes del vivero en el período
                const totalEsquejes = await getTotalEsquejesByViveroEnPeriodo(viveroId, fechaLimite)
                
                resultados.push({
                    viveroId: viveroId,
                    viveroNombre: viveroData.nombre,
                    totalEsquejes: totalEsquejes,
                    color: generateColorForVivero(viveroId)
                })
            }
            
            // Ordenar por cantidad de esquejes (mayor a menor)
            resultados.sort((a, b) => b.totalEsquejes - a.totalEsquejes)
            
            return { success: true, data: resultados }
        } catch (error) {
            console.error("❌ Error obteniendo esquejes por vivero:", error)
            return { success: false, error: "Error al cargar datos de esquejes por vivero" }
        }
    },

    // 📈 Obtener datos temporales de esquejes para un vivero específico
    getEsquejesByViveroTemporal: async (viveroId, periodo = 'ultimo_mes') => {
        try {
            const fechaLimite = getFechaLimite(periodo)
            const intervalos = getIntervalos(periodo)
            
            const resultados = []
            
            for (const intervalo of intervalos) {
                const totalEsquejes = await getTotalEsquejesByViveroEnPeriodo(
                    viveroId, 
                    intervalo.inicio, 
                    intervalo.fin
                )
                
                resultados.push({
                    periodo: intervalo.label,
                    fecha: intervalo.fin,
                    totalEsquejes: totalEsquejes,
                    viveroId: viveroId
                })
            }
            
            return { success: true, data: resultados }
        } catch (error) {
            console.error("❌ Error obteniendo datos temporales:", error)
            return { success: false, error: "Error al cargar datos temporales" }
        }
    },

    // 🌱 Obtener esquejes por cama dentro de un vivero
    getEsquejesByCama: async (viveroId, periodo = 'ultimo_mes') => {
        try {
            const fechaLimite = getFechaLimite(periodo)
            const camasCollection = collection(db, "viveros", viveroId, "camas")
            const camasSnapshot = await getDocs(camasCollection)
            
            const resultados = []
            
            for (const camaDoc of camasSnapshot.docs) {
                const camaId = camaDoc.id
                const camaData = camaDoc.data()
                
                // Obtener cortes de la cama en el período
                const totalEsquejes = await getTotalEsquejesByCamaEnPeriodo(viveroId, camaId, fechaLimite)
                
                resultados.push({
                    camaId: camaId,
                    camaNombre: `Cama ${camaId}`,
                    nombrePlanta: camaData.nombrePlanta,
                    totalEsquejes: totalEsquejes,
                    color: generateColorForPlanta(camaData.nombrePlanta)
                })
            }
            
            // Ordenar por cantidad de esquejes (mayor a menor)
            resultados.sort((a, b) => b.totalEsquejes - a.totalEsquejes)
            
            return { success: true, data: resultados }
        } catch (error) {
            console.error("❌ Error obteniendo esquejes por cama:", error)
            return { success: false, error: "Error al cargar datos de esquejes por cama" }
        }
    },

    // 🏆 Top camas más productivas (global)
    getTopCamasProductivas: async (limite = 10, periodo = 'ultimo_mes') => {
        try {
            const fechaLimite = getFechaLimite(periodo)
            const viverosCollection = collection(db, "viveros")
            const viverosSnapshot = await getDocs(viverosCollection)
            
            const todasLasCamas = []
            
            for (const viveroDoc of viverosSnapshot.docs) {
                const viveroId = viveroDoc.id
                const viveroData = viveroDoc.data()
                
                const camasCollection = collection(db, "viveros", viveroId, "camas")
                const camasSnapshot = await getDocs(camasCollection)
                
                for (const camaDoc of camasSnapshot.docs) {
                    const camaId = camaDoc.id
                    const camaData = camaDoc.data()
                    
                    const totalEsquejes = await getTotalEsquejesByCamaEnPeriodo(viveroId, camaId, fechaLimite)
                    
                    if (totalEsquejes > 0) {
                        todasLasCamas.push({
                            viveroId: viveroId,
                            viveroNombre: viveroData.nombre,
                            camaId: camaId,
                            camaNombre: `${viveroData.nombre} - Cama ${camaId}`,
                            nombrePlanta: camaData.nombrePlanta,
                            totalEsquejes: totalEsquejes,
                            color: generateColorForPlanta(camaData.nombrePlanta)
                        })
                    }
                }
            }
            
            // Ordenar por cantidad de esquejes y tomar los top
            todasLasCamas.sort((a, b) => b.totalEsquejes - a.totalEsquejes)
            const topCamas = todasLasCamas.slice(0, limite)
            
            return { success: true, data: topCamas }
        } catch (error) {
            console.error("❌ Error obteniendo top camas:", error)
            return { success: false, error: "Error al cargar top camas productivas" }
        }
    },

    // 📊 Datos generales para el dashboard
    getDashboardData: async (periodo = 'ultimo_mes') => {
        try {
            const [
                esquejesPorVivero,
                topCamas,
                estadisticasGlobales
            ] = await Promise.all([
                chartService.getEsquejesByVivero(periodo),
                chartService.getTopCamasProductivas(5, periodo),
                chartService.getEstadisticasGlobales(periodo)
            ])

            return {
                success: true,
                data: {
                    esquejesPorVivero: esquejesPorVivero.data || [],
                    topCamas: topCamas.data || [],
                    estadisticas: estadisticasGlobales.data || {}
                }
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del dashboard:", error)
            return { success: false, error: "Error al cargar datos del dashboard" }
        }
    },

    // 📈 Estadísticas globales del sistema
    getEstadisticasGlobales: async (periodo = 'ultimo_mes') => {
        try {
            const fechaLimite = getFechaLimite(periodo)
            
            // Obtener datos básicos
            const viverosCollection = collection(db, "viveros")
            const viverosSnapshot = await getDocs(viverosCollection)
            
            let totalViveros = viverosSnapshot.docs.length
            let totalCamas = 0
            let totalPlantas = 0
            let totalEsquejesPeriodo = 0
            let totalEsquejesHistorico = 0
            let plantasUnicas = new Set()
            
            for (const viveroDoc of viverosSnapshot.docs) {
                const viveroId = viveroDoc.id
                const viveroData = viveroDoc.data()
                
                // Contar camas y plantas del vivero
                const camasCollection = collection(db, "viveros", viveroId, "camas")
                const camasSnapshot = await getDocs(camasCollection)
                totalCamas += camasSnapshot.docs.length
                
                for (const camaDoc of camasSnapshot.docs) {
                    const camaData = camaDoc.data()
                    totalPlantas += camaData.cantidadPlantas || 0
                    totalEsquejesHistorico += camaData.estadisticas?.totalEsquejesHistorico || 0
                    
                    if (camaData.nombrePlanta) {
                        plantasUnicas.add(camaData.nombrePlanta)
                    }
                    
                    // Esquejes del período
                    const esquejesPeriodo = await getTotalEsquejesByCamaEnPeriodo(viveroId, camaDoc.id, fechaLimite)
                    totalEsquejesPeriodo += esquejesPeriodo
                }
            }
            
            const estadisticas = {
                totalViveros,
                totalCamas,
                totalPlantas,
                tiposPlantasUnicas: plantasUnicas.size,
                totalEsquejesPeriodo,
                totalEsquejesHistorico,
                promedioEsquejesPorCama: totalCamas > 0 ? Math.round(totalEsquejesHistorico / totalCamas) : 0,
                promedioPlantasPorCama: totalCamas > 0 ? Math.round(totalPlantas / totalCamas) : 0
            }
            
            return { success: true, data: estadisticas }
        } catch (error) {
            console.error("❌ Error obteniendo estadísticas globales:", error)
            return { success: false, error: "Error al cargar estadísticas globales" }
        }
    },

    // 📊 Datos para gráfico temporal comparativo (múltiples viveros)
    getComparativaViverosEnTiempo: async (viveroIds, periodo = 'ultimo_mes') => {
        try {
            const intervalos = getIntervalos(periodo)
            const resultados = []
            
            for (const intervalo of intervalos) {
                const dataPunto = {
                    periodo: intervalo.label,
                    fecha: intervalo.fin
                }
                
                for (const viveroId of viveroIds) {
                    const totalEsquejes = await getTotalEsquejesByViveroEnPeriodo(
                        viveroId,
                        intervalo.inicio,
                        intervalo.fin
                    )
                    dataPunto[viveroId] = totalEsquejes
                }
                
                resultados.push(dataPunto)
            }
            
            return { success: true, data: resultados }
        } catch (error) {
            console.error("❌ Error en comparativa temporal:", error)
            return { success: false, error: "Error al cargar comparativa temporal" }
        }
    }
}

// ===================================
// 🛠️ HELPER FUNCTIONS
// ===================================

// Obtener fecha límite basada en el período
const getFechaLimite = (periodo) => {
    const ahora = new Date()
    
    switch (periodo) {
        case 'ultima_semana':
            return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'ultimo_mes':
            return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
        case 'ultimos_3_meses':
            return new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000)
        case 'ultimo_año':
            return new Date(ahora.getTime() - 365 * 24 * 60 * 60 * 1000)
        default:
            return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
}

// Generar intervalos para gráficos temporales
const getIntervalos = (periodo) => {
    const ahora = new Date()
    const intervalos = []
    
    switch (periodo) {
        case 'ultima_semana':
            // 7 días
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000)
                intervalos.push({
                    label: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                    inicio: new Date(fecha.setHours(0, 0, 0, 0)),
                    fin: new Date(fecha.setHours(23, 59, 59, 999))
                })
            }
            break
        
        case 'ultimo_mes':
            // 4 semanas
            for (let i = 3; i >= 0; i--) {
                const inicioSemana = new Date(ahora.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
                const finSemana = new Date(ahora.getTime() - i * 7 * 24 * 60 * 60 * 1000)
                intervalos.push({
                    label: `Sem ${4 - i}`,
                    inicio: inicioSemana,
                    fin: finSemana
                })
            }
            break
        
        case 'ultimos_3_meses':
            // 12 semanas
            for (let i = 11; i >= 0; i--) {
                const inicioSemana = new Date(ahora.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
                const finSemana = new Date(ahora.getTime() - i * 7 * 24 * 60 * 60 * 1000)
                intervalos.push({
                    label: inicioSemana.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                    inicio: inicioSemana,
                    fin: finSemana
                })
            }
            break
        
        case 'ultimo_año':
            // 12 meses
            for (let i = 11; i >= 0; i--) {
                const mes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
                const finMes = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0)
                intervalos.push({
                    label: mes.toLocaleDateString('es-ES', { month: 'short' }),
                    inicio: mes,
                    fin: finMes
                })
            }
            break
    }
    
    return intervalos
}

// Obtener total de esquejes de un vivero en un período
const getTotalEsquejesByViveroEnPeriodo = async (viveroId, fechaInicio, fechaFin = new Date()) => {
    try {
        const camasCollection = collection(db, "viveros", viveroId, "camas")
        const camasSnapshot = await getDocs(camasCollection)
        
        let totalEsquejes = 0
        
        for (const camaDoc of camasSnapshot.docs) {
            const camaId = camaDoc.id
            const esquejesCama = await getTotalEsquejesByCamaEnPeriodo(viveroId, camaId, fechaInicio, fechaFin)
            totalEsquejes += esquejesCama
        }
        
        return totalEsquejes
    } catch (error) {
        console.error("❌ Error calculando esquejes del vivero:", error)
        return 0
    }
}

// Obtener total de esquejes de una cama en un período
const getTotalEsquejesByCamaEnPeriodo = async (viveroId, camaId, fechaInicio, fechaFin = new Date()) => {
    try {
        const cortesCollection = collection(db, "viveros", viveroId, "camas", camaId, "cortes_esquejes")
        
        const q = query(
            cortesCollection,
            where("fecha", ">=", Timestamp.fromDate(fechaInicio)),
            where("fecha", "<=", Timestamp.fromDate(fechaFin))
        )
        
        const cortesSnapshot = await getDocs(q)
        
        let totalEsquejes = 0
        cortesSnapshot.docs.forEach(doc => {
            const corteData = doc.data()
            totalEsquejes += corteData.cantidadEsquejes || 0
        })
        
        return totalEsquejes
    } catch (error) {
        console.error("❌ Error calculando esquejes de la cama:", error)
        return 0
    }
}

// Generar colores para viveros
const generateColorForVivero = (viveroId) => {
    const colores = [
        '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
        '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
    ]
    
    const hash = viveroId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colores[hash % colores.length]
}

// Generar colores para plantas
const generateColorForPlanta = (nombrePlanta) => {
    const colores = [
        '#81C784', '#64B5F6', '#FFB74D', '#BA68C8', '#EF5350',
        '#4DB6AC', '#FFF176', '#A1887F', '#90A4AE', '#F06292'
    ]
    
    const hash = nombrePlanta.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colores[hash % colores.length]
}

// Opciones de período disponibles
export const PERIODOS_DISPONIBLES = [
    { value: 'ultima_semana', label: 'Última semana', icon: '📅' },
    { value: 'ultimo_mes', label: 'Último mes', icon: '📆' },
    { value: 'ultimos_3_meses', label: 'Últimos 3 meses', icon: '📊' },
    { value: 'ultimo_año', label: 'Último año', icon: '📈' }
]