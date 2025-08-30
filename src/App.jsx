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

// Importar nuevos componentes de viveros
import ViverosList from './components/viveros/ViverosList.jsx';
import ViveroForm from './components/viveros/ViveroForm.jsx';

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

                            {/* Rutas protegidas con Navbar */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Navbar />
                                        <HomePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Gestión de Viveros */}
                            <Route
                                path="/viveros"
                                element={
                                    <ProtectedRoute>
                                        <Navbar />
                                        <ViverosList />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Vista de vivero individual */}
                            <Route
                                path="/vivero/:id"
                                element={
                                    <ProtectedRoute>
                                        <Navbar />
                                        {/* TODO: Implementar ViveroDetail */}
                                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                                            <h2>Vista de Vivero Individual</h2>
                                            <p>Próximamente: Detalle completo del vivero</p>
                                        </div>
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

                            {/* Formulario crear vivero (solo admins) */}
                            <Route
                                path="/admin/vivero/nuevo"
                                element={
                                    <ProtectedRoute requireAdmin={true}>
                                        <Navbar />
                                        <ViveroForm mode="create" />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Formulario editar vivero (solo admins) */}
                            <Route
                                path="/admin/vivero/:id/editar"
                                element={
                                    <ProtectedRoute requireAdmin={true}>
                                        <Navbar />
                                        <ViveroFormWrapper mode="edit" />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Dashboard - Próximamente */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Navbar />
                                        <div style={{ 
                                            padding: '2rem', 
                                            textAlign: 'center',
                                            minHeight: '60vh',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            <h2>🚧 Dashboard en Construcción</h2>
                                            <p>El dashboard con gráficos y analytics estará disponible próximamente.</p>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rutas QR públicas (sin autenticación) */}
                            {/* Vista QR de vivero */}
                            <Route
                                path="/v/:viveroId"
                                element={
                                    // TODO: Implementar ViveroViewer
                                    <div style={{ 
                                        padding: '2rem', 
                                        textAlign: 'center',
                                        minHeight: '100vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <h2>📱 Vista QR - Vivero</h2>
                                        <p>Próximamente: Vista pública QR del vivero</p>
                                        <small>URL: {window.location.pathname}</small>
                                    </div>
                                }
                            />

                            {/* Vista QR de cama */}
                            <Route
                                path="/v/:viveroId/c/:camaId"
                                element={
                                    // TODO: Implementar CamaViewer
                                    <div style={{ 
                                        padding: '2rem', 
                                        textAlign: 'center',
                                        minHeight: '100vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <h2>📱 Vista QR - Cama</h2>
                                        <p>Próximamente: Vista pública QR de la cama</p>
                                        <small>URL: {window.location.pathname}</small>
                                    </div>
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

// Necesitamos importar useParams
import { useParams } from 'react-router-dom';

// Wrapper para ViveroForm en modo edición que extrae el ID de los params
const ViveroFormWrapper = ({ mode }) => {
    const { id } = useParams();
    return <ViveroForm mode={mode} viveroId={id} />;
};

export default App;