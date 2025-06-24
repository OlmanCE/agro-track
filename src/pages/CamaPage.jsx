// src/pages/CamaPage.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Card, CardContent, Alert } from '@mui/material'

const CamaPage = () => {
  const { camaId } = useParams()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            📱 Vista de Cama
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            Acceso público via QR - ID: {camaId}
          </Alert>
          <Typography variant="body1">
            Aquí se mostrará la información completa de la cama de cultivo.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}

export default CamaPage