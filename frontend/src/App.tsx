import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy loading de las páginas para optimizar el bundle (Code Splitting)
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Productos = lazy(() => import('./pages/Productos').then(m => ({ default: m.Productos })));
const Proveedores = lazy(() => import('./pages/Proveedores').then(m => ({ default: m.Proveedores })));
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const Ventas = lazy(() => import('./pages/Ventas').then(m => ({ default: m.Ventas })));
const Compras = lazy(() => import('./pages/Compras').then(m => ({ default: m.Compras })));
const MateriasPrimas = lazy(() => import('./pages/MateriasPrimas').then(m => ({ default: m.MateriasPrimas })));
const Configuracion = lazy(() => import('./pages/Configuracion').then(m => ({ default: m.Configuracion })));
const RegistroCliente = lazy(() => import('./pages/RegistroCliente').then(m => ({ default: m.RegistroCliente })));

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/registro-cliente" element={<RegistroCliente />} />
        <Route path="/login" element={user ? <Navigate to={isAdmin ? "/dashboard" : "/ventas"} replace /> : <Login />} />
        <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute adminOnly><Proveedores /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/compras" element={<ProtectedRoute adminOnly><Compras /></ProtectedRoute>} />
        <Route path="/materias-primas" element={<ProtectedRoute adminOnly><MateriasPrimas /></ProtectedRoute>} />

        <Route path="/configuracion" element={<ProtectedRoute adminOnly><Configuracion /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? (isAdmin ? '/dashboard' : '/ventas') : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider>
            <AppRoutes />
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}
