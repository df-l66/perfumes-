import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Productos } from './pages/Productos';
import { Proveedores } from './pages/Proveedores';
import { Clientes } from './pages/Clientes';
import { Ventas } from './pages/Ventas';
import { Compras } from './pages/Compras';

import { Configuracion } from './pages/Configuracion';

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? "/dashboard" : "/ventas"} replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
      <Route path="/proveedores" element={<ProtectedRoute adminOnly><Proveedores /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
      <Route path="/compras" element={<ProtectedRoute adminOnly><Compras /></ProtectedRoute>} />

      <Route path="/configuracion" element={<ProtectedRoute adminOnly><Configuracion /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? (isAdmin ? '/dashboard' : '/ventas') : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
