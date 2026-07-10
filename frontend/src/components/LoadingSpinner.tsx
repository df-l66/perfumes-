export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
      <div className="relative">
        {/* Círculo de fondo */}
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        {/* Círculo animado */}
        <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Cargando...</p>
    </div>
  );
}
