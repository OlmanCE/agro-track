import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

// Componentes de autenticación
import LoginPage from './components/auth/LoginPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PendingApprovalPage from './components/auth/PendingApprovalPage'

// Páginas principales
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import CamaPage from './pages/CamaPage'

// Nuevas páginas para formularios
import CamaFormPage from './pages/CamaFormPage'

// Hook de autenticación
import { useAuth } from './hooks/useAuth'

// Tema personalizado para Agro-Track
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4CAF50', // Verde principal
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#8BC34A', // Verde lima
      light: '#AED581',
      dark: '#689F38',
      contrastText: '#ffffff'
    },
    success: {
      main: '#4CAF50',
    },
    background: {
      default: '#F1F8E9', // Verde muy claro
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        }
      }
    }
  }
})

// Componente para manejar redirección automática
const AuthRedirect = () => {
  const { isAuthenticated, isAdmin, needsApproval, loading } = useAuth()
  
  if (loading) return null
  
  if (isAuthenticated) {
    if (needsApproval) {
      return <Navigate to="/pending-approval" replace />
    }
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />
  }
  
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Ruta raíz - redirige según autenticación */}
          <Route path="/auth" element={<AuthRedirect />} />
          
          {/* Página de login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Página de aprobación pendiente */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          
          {/* Página principal (requiere autenticación) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Panel de administración (requiere ser admin) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />

          {/* Nueva cama - Solo admins */}
          <Route 
            path="/admin/cama/nueva" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <CamaFormPage mode="create" />
              </ProtectedRoute>
            } 
          />

          {/* Editar cama - Solo admins */}
          <Route 
            path="/admin/cama/:camaId/editar" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <CamaFormPage mode="edit" />
              </ProtectedRoute>
            } 
          />
          
          {/* Página pública de cama (accesible via QR) */}
          <Route path="/cama/:camaId" element={<CamaPage />} />
          
          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App