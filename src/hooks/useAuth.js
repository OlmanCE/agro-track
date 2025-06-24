"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"

export const useAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Verificar si el usuario existe en Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid)
                    const userDoc = await getDoc(userDocRef)

                    if (!userDoc.exists()) {
                        // Crear documento de usuario si no existe
                        const userData = {
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || firebaseUser.email,
                            isAdmin: false, // Por defecto no es admin
                        }
                        await setDoc(userDocRef, userData)
                        setIsAdmin(false)
                    } else {
                        // Usuario existe, obtener rol
                        const userData = userDoc.data()
                        setIsAdmin(userData.isAdmin || false)
                    }

                    setUser(firebaseUser)
                } catch (error) {
                    console.error("Error al verificar/crear usuario:", error)
                }
            } else {
                setUser(null)
                setIsAdmin(false)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return {
        user,
        isAdmin,
        loading,
        isAuthenticated: !!user,
    }
}
