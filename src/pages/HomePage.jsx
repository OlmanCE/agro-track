// src/pages/HomePage.jsx
import React from 'react'
import { Container, Typography, Button, Box, Card, CardContent } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🌱 Bienvenido a Agro-Track
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Hola {user?.displayName || user?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Rol: {isAdmin ? 'Administrador' : 'Usuario'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {isAdmin && (
              <Button 
                variant="contained" 
                onClick={() => navigate('/admin')}
              >
                Panel de Admin
              </Button>
            )}
            <Button 
              variant="outlined" 
              onClick={logout}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default HomePage