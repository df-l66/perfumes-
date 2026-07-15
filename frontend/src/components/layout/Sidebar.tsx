import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Users, ShoppingCart, ShoppingBag,
  LogOut, ChevronRight, Building2, Settings, Wallet, Menu, X
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-[13px] sm:top-[17px] left-4 z-40 p-1.5 bg-white/50 backdrop-blur-sm border border-zinc-200 rounded-lg text-zinc-700 shadow-sm hover:bg-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Wrapper to preserve layout space */}
      <div
        className="hidden md:block w-20 shrink-0 min-h-screen relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <aside
        className={`flex flex-col fixed top-0 bottom-0 left-0 bg-zinc-950 text-zinc-100 border-r border-zinc-800/40 z-50 transition-all duration-300 ease-in-out select-none overflow-hidden overflow-y-auto ${
          isHovered || mobileMenuOpen ? 'w-64 shadow-2xl shadow-zinc-950/80 tranzinc-x-0' : 'w-20 -tranzinc-x-full md:tranzinc-x-0'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between py-6 border-b border-zinc-800/60 transition-all duration-300 ${
          isHovered || mobileMenuOpen ? 'px-6' : 'justify-center px-4'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Building2 size={18} className="text-white" />
            </div>
            <div className={`transition-all duration-300 origin-left ${
              isHovered || mobileMenuOpen ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
            }`}>
              <p className="font-bold text-white text-sm tracking-tight leading-none">GestiónPro</p>
              <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mt-1">Control Panel</p>
            </div>
          </div>
          {/* Close button on mobile */}
          {mobileMenuOpen && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User badge */}
        <div className={`mx-3 mt-5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-800 transition-all duration-300 shrink-0 ${
          isHovered || mobileMenuOpen ? 'px-4 py-3.5' : 'p-2 hidden md:block'
        }`}>
          <div className={`flex items-center gap-3 ${!(isHovered || mobileMenuOpen) && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className={`min-w-0 transition-all duration-300 origin-left ${
              isHovered || mobileMenuOpen ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
            }`}>
              <p className="text-white text-sm font-semibold truncate leading-none">{user?.name || 'Usuario'}</p>
              <span className="inline-block text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1 leading-none">{user?.role || 'rol'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-1 transition-all duration-300 ${isHovered || mobileMenuOpen ? 'px-3' : 'px-2'}`}>
          <p className={`text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2 transition-all duration-300 ${
            isHovered || mobileMenuOpen ? 'px-3 opacity-100' : 'opacity-0 h-0 overflow-hidden'
          }`}>
            Módulos
          </p>
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isHovered || mobileMenuOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-3'
                } ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform duration-200 group-hover:scale-115 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-amber-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`transition-all duration-300 origin-left flex-1 whitespace-nowrap truncate ${
                    isHovered || mobileMenuOpen ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
                  }`}>
                    {item.label}
                  </span>
                  {(isHovered || mobileMenuOpen) && (
                    isActive ? (
                      <ChevronRight size={14} className="text-amber-200 animate-pulse shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="opacity-0 -tranzinc-x-2 group-hover:opacity-100 group-hover:tranzinc-x-0 transition-all duration-200 text-zinc-500 shrink-0" />
                    )
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800/60 mt-auto shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer active:scale-98 ${
              isHovered || mobileMenuOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-3'
            }`}
          >
            <LogOut size={18} className="transition-transform group-hover:tranzinc-x-0.5 shrink-0" />
            <span className={`transition-all duration-300 origin-left whitespace-nowrap ${
              isHovered || mobileMenuOpen ? 'opacity-100 scale-100 w-auto visible' : 'opacity-0 scale-95 w-0 hidden'
            }`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
