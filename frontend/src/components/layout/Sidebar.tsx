import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Users, ShoppingCart, ShoppingBag,
  LogOut, ChevronRight, Building2, Settings, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Panel', adminOnly: true },
  { to: '/productos', icon: <Package size={18} />, label: 'Productos' },
  { to: '/materias-primas', icon: <Package size={18} />, label: 'Materias Primas', adminOnly: true },
  { to: '/proveedores', icon: <Truck size={18} />, label: 'Proveedores', adminOnly: true },
  { to: '/clientes', icon: <Users size={18} />, label: 'Clientes' },
  { to: '/ventas', icon: <ShoppingCart size={18} />, label: 'Ventas' },
  { to: '/compras', icon: <ShoppingBag size={18} />, label: 'Compras', adminOnly: true },
  { to: '/configuracion', icon: <Settings size={18} />, label: 'Configuración', adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:block w-20 shrink-0 min-h-screen relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      <aside
        className={`flex flex-col fixed top-0 left-0 bottom-0 bg-slate-950 text-slate-100 border-r border-slate-800/40 z-30 transition-all duration-300 ease-in-out select-none overflow-hidden ${
          isHovered ? 'w-64 shadow-2xl shadow-slate-950/80' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 py-6 border-b border-slate-800/60 transition-all duration-300 ${
          isHovered ? 'px-6' : 'justify-center px-4'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
            <Building2 size={18} className="text-white" />
          </div>
          <div className={`transition-all duration-300 origin-left ${
            isHovered ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
          }`}>
            <p className="font-bold text-white text-sm tracking-tight leading-none">GestiónPro</p>
            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mt-1">Control Panel</p>
          </div>
        </div>

        {/* User badge */}
        <div className={`mx-3 mt-5 rounded-xl bg-slate-900/80 border border-slate-800/60 hover:border-slate-800 transition-all duration-300 ${
          isHovered ? 'px-4 py-3.5' : 'p-2'
        }`}>
          <div className={`flex items-center gap-3 ${!isHovered && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
              {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className={`min-w-0 transition-all duration-300 origin-left ${
              isHovered ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
            }`}>
              <p className="text-white text-sm font-semibold truncate leading-none">{user?.name}</p>
              <span className="inline-block text-[10px] text-teal-400 font-bold uppercase tracking-wider mt-1 leading-none">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-1 transition-all duration-300 ${isHovered ? 'px-3' : 'px-2'}`}>
          <p className={`text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 transition-all duration-300 ${
            isHovered ? 'px-3 opacity-100' : 'opacity-0 h-0 overflow-hidden'
          }`}>
            Módulos
          </p>
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isHovered ? 'gap-3 px-3 py-2.5' : 'justify-center p-3'
                } ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform duration-200 group-hover:scale-115 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`transition-all duration-300 origin-left flex-1 whitespace-nowrap truncate ${
                    isHovered ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
                  }`}>
                    {item.label}
                  </span>
                  {isHovered && (
                    isActive ? (
                      <ChevronRight size={14} className="text-teal-200 animate-pulse shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-slate-500 shrink-0" />
                    )
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-sm font-medium text-slate-500 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer active:scale-98 ${
              isHovered ? 'gap-3 px-3 py-2.5' : 'justify-center p-3'
            }`}
          >
            <LogOut size={18} className="transition-transform group-hover:translate-x-0.5 shrink-0" />
            <span className={`transition-all duration-300 origin-left whitespace-nowrap ${
              isHovered ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
            }`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-800/60 z-40 flex items-center justify-around px-2 pb-safe">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-teal-400' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="text-[9px] font-medium truncate w-full text-center px-1">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-[9px] font-medium truncate w-full text-center px-1">Salir</span>
        </button>
      </div>
    </>
  );
}
