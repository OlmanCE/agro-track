// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './hooks/useAuth.jsx';

// Importar componentes
import LoginPage from './components/auth/LoginPage.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import HomePage from './pages/HomePage.jsx';
import Navbar from './components/layout/Navbar.jsx';

// Tema personalizado para Agro-Track
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#4caf50', // Verde para agricultura
            light: '#81c784',
            dark: '#388e3c',
        },
        secondary: {
            main: '#ff9800', // Naranja complementario
            light: '#ffb74d',
            dark: '#f57c00',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {/* Ruta pública de login */}
                            <Route path="/login" element={<LoginPage />} />

                            {/* Rutas protegidas */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Navbar />
                                        <HomePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Panel de administración (solo admins) */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute requireAdmin={true}>
                                        <Navbar />
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Redirect por defecto */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;