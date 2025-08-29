// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getAllUsers } from '../../firebase/userService.js';
import {
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    totalUsers: users.length,
    totalAdmins: users.filter(u => u.isAdmin).length,
    totalRegularUsers: users.filter(u => !u.isAdmin).length,
    recentUsers: users.slice(0, 5)
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Panel de Administración
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido/a, {user?.name || user?.email}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Estadísticas Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.totalUsers}
                      </Typography>
                      <Typography color="text.secondary">
                        Total Usuarios
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AdminIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.totalAdmins}
                      </Typography>
                      <Typography color="text.secondary">
                        Administradores
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <PersonAddIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.totalRegularUsers}
                      </Typography>
                      <Typography color="text.secondary">
                        Usuarios Estándar
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <ScheduleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.recentUsers.length}
                      </Typography>
                      <Typography color="text.secondary">
                        Usuarios Recientes
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla de Usuarios */}
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Lista de Usuarios Registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gestión y visualización de todos los usuarios del sistema
              </Typography>
            </Box>
            
            <Divider />
            
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Rol</TableCell>
                    <TableCell>Registro</TableCell>
                    <TableCell>Último Acceso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow 
                      key={userData.uid}
                      hover
                      sx={{ 
                        backgroundColor: userData.uid === user?.uid ? 'action.selected' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
                          >
                            {userData.name?.charAt(0)?.toUpperCase() || userData.email?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {userData.name || 'Sin nombre'}
                              {userData.uid === user?.uid && ' (Tú)'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {userData.email}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          label={userData.isAdmin ? 'Admin' : 'Usuario'}
                          color={userData.isAdmin ? 'secondary' : 'default'}
                          size="small"
                          icon={userData.isAdmin ? <AdminIcon /> : <PeopleIcon />}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(userData.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(userData.lastLogin)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {users.length === 0 && (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="text.secondary">
                  No hay usuarios registrados en el sistema
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Info adicional */}
          <Box mt={3}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Vista previa del panel de administración.</strong>
                <br />
                En futuras versiones se añadirán funcionalidades de gestión de viveros, 
                camas de cultivo y tracking de esquejes.
              </Typography>
            </Alert>
          </Box>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;