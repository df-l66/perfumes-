import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-red-100">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Ups! Algo salió mal</h2>
        <p className="text-slate-600 mb-6">
          Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
        </p>
        
        {/* Solo en desarrollo, mostramos el error técnico */}
        {import.meta.env.DEV && (
          <div className="bg-slate-100 p-4 rounded text-left overflow-auto mb-6 max-h-40 text-xs text-red-800 font-mono">
            {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        <button
          onClick={resetErrorBoundary}
          className="flex items-center justify-center w-full space-x-2 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Recargar Página</span>
        </button>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Recargar la ventana completamente para limpiar cualquier estado corrupto
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
