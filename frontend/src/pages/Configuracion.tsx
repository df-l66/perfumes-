import React, { useState } from 'react';
import { Save, Building2, Landmark, Users, UserPlus, Edit2, X } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { AlertBox } from '../components/ui/AlertBox';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import type { CompanyConfig, Role } from '../types';

export function Configuracion() {
  const { configuracion, updateConfiguracion, createUser, users, updateUserContext } = useAppData();
  const { user, isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'parametros' | 'usuarios'>('parametros');
  
  // Parámetros form state
  const [form, setForm] = useState<CompanyConfig>({ ...configuracion });
  const [success, setSuccess] = useState(false);

  // User creation form state
  const [userForm, setUserForm] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' as Role });
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' as Role });
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);

  const handleSubmitConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfiguracion(form, user?.name || 'Admin', user?.role || 'admin');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setCreatingUser(true);
    try {
      await createUser(userForm, user?.name || 'Admin', user?.role || 'admin');
      setUserSuccess('Usuario creado exitosamente. Ya puede iniciar sesión.');
      setUserForm({ nombre: '', email: '', password: '', rol: 'vendedor' });
    } catch (err: any) {
      setUserError(err.message || 'Error al crear usuario.');
    } finally {
      setCreatingUser(false);
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditForm({
      nombre: u.nombre || '',
      email: u.email || '',
      password: '',
      rol: u.rol as Role
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setEditSuccess('');
    setUpdatingUser(true);
    try {
      await updateUserContext(editingUser.id, editForm, user?.name || 'Admin', user?.role || 'admin');
      setEditSuccess('Usuario actualizado exitosamente.');
      setTimeout(() => setEditingUser(null), 1500);
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar usuario.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';
  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  return (
    <Layout
      title="Configuración"
      subtitle="Parámetros corporativos y gestión de acceso"
    >
      <div className="max-w-4xl">
        {!isAdmin && (
          <AlertBox type="warning" title="Acceso restringido" className="mb-6">
            Solo los usuarios con el rol de <strong>Administrador</strong> pueden modificar la configuración o crear usuarios.
          </AlertBox>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('parametros')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'parametros'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 size={16} />
            Parámetros Fiscales
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'usuarios'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users size={16} />
              Gestión de Usuarios
            </button>
          )}
        </div>

        {activeTab === 'parametros' && (
          <form onSubmit={handleSubmitConfig} className="space-y-6">
            {success && (
              <AlertBox type="note" title="Configuración guardada" className="mb-6">
                Los parámetros fiscales se han actualizado y se aplicarán a todas las facturas y comprobantes emitidos a partir de este momento.
              </AlertBox>
            )}

            {/* Card: Datos Corporativos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Building2 size={18} className="text-teal-600" />
                <h2 className="text-sm font-bold text-slate-800">Información de la Empresa</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Nombre Comercial o Razón Social', (
                  <input
                    required
                    disabled={!isAdmin}
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className={inp}
                  />
                ))}
                {field('NIT / Identificación Tributaria', (
                  <input
                    required
                    disabled={!isAdmin}
                    value={form.nit}
                    onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                    className={inp}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Dirección Fiscal', (
                  <input
                    required
                    disabled={!isAdmin}
                    value={form.direccion}
                    onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                    className={inp}
                  />
                ))}
                {field('Teléfono de Contacto', (
                  <input
                    required
                    disabled={!isAdmin}
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className={inp}
                  />
                ))}
              </div>
            </div>

            {/* Card: Parámetros Fiscales */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Landmark size={18} className="text-teal-600" />
                <h2 className="text-sm font-bold text-slate-800">Impuestos y Parámetros de Facturación</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {field('IVA (%)', (
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      disabled={!isAdmin}
                      value={form.iva_porcentaje}
                      onChange={e => setForm(f => ({ ...f, iva_porcentaje: +e.target.value }))}
                      className={`${inp} pr-8`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                ))}
                {field('Giro / Rubro Comercial', (
                  <select
                    disabled={true}
                    value={form.giro}
                    className={`${inp} bg-slate-50 cursor-not-allowed`}
                  >
                    <option value="perfumeria">Perfumería y Fragancias (Fijo)</option>
                  </select>
                ))}
                {field('Prefijo Facturación', (
                  <input
                    required
                    disabled
                    className={inp}
                    value="FAC-2025-"
                  />
                ))}
              </div>

              {field('Resolución Legal de Facturación', (
                <textarea
                  required
                  rows={3}
                  disabled={!isAdmin}
                  value={form.resolucion}
                  onChange={e => setForm(f => ({ ...f, resolucion: e.target.value }))}
                  className={inp}
                  placeholder="Texto legal que aparece en la parte inferior de las facturas (resoluciones fiscales, etc.)"
                />
              ))}
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <Button type="submit" icon={<Save size={16} />} className="shadow-lg shadow-teal-600/10">
                  Guardar Configuración
                </Button>
              </div>
            )}
          </form>
        )}

        {activeTab === 'usuarios' && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <UserPlus size={18} className="text-teal-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Crear Nuevo Usuario</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Agrega vendedores o administradores al sistema</p>
                </div>
              </div>
            </div>

            {userSuccess && (
              <AlertBox type="note" title="¡Usuario creado!">
                {userSuccess}
              </AlertBox>
            )}
            
            {userError && (
              <AlertBox type="warning" title="Error">
                {userError}
              </AlertBox>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Nombre Completo', (
                  <input
                    required
                    placeholder="Ej. Juan Pérez"
                    value={userForm.nombre}
                    onChange={e => setUserForm({ ...userForm, nombre: e.target.value })}
                    className={inp}
                  />
                ))}
                {field('Rol en el Sistema', (
                  <select
                    required
                    value={userForm.rol}
                    onChange={e => setUserForm({ ...userForm, rol: e.target.value as Role })}
                    className={inp}
                  >
                    <option value="vendedor">Vendedor (Acceso limitado)</option>
                    <option value="admin">Administrador (Acceso total)</option>
                  </select>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Correo Electrónico', (
                  <input
                    type="email"
                    required
                    placeholder="usuario@ejemplo.com"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className={inp}
                  />
                ))}
                {field('Contraseña', (
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className={inp}
                  />
                ))}
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={creatingUser} 
                  icon={<UserPlus size={16} />} 
                  className="w-full sm:w-auto shadow-lg shadow-teal-600/10"
                >
                  {creatingUser ? 'Creando usuario...' : 'Registrar Usuario'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* User List Table */}
        {activeTab === 'usuarios' && isAdmin && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Usuarios Registrados</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800 text-sm">{u.nombre}</td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.rol === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                          title="Editar usuario"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                        Cargando usuarios...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Editar Usuario</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Modificando a {editingUser.nombre}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {editSuccess && (
                <AlertBox type="note" title="¡Actualizado!" className="mb-6">
                  {editSuccess}
                </AlertBox>
              )}
              {editError && (
                <AlertBox type="warning" title="Error" className="mb-6">
                  {editError}
                </AlertBox>
              )}

              <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Nombre Completo', (
                    <input
                      required
                      value={editForm.nombre}
                      onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                      className={inp}
                    />
                  ))}
                  {field('Rol en el Sistema', (
                    <select
                      required
                      value={editForm.rol}
                      onChange={e => setEditForm({ ...editForm, rol: e.target.value as Role })}
                      className={inp}
                    >
                      <option value="vendedor">Vendedor (Acceso limitado)</option>
                      <option value="admin">Administrador (Acceso total)</option>
                    </select>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Correo Electrónico', (
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className={inp}
                    />
                  ))}
                  {field('Nueva Contraseña (Opcional)', (
                    <input
                      type="password"
                      minLength={6}
                      placeholder="Dejar en blanco para no cambiar"
                      value={editForm.password}
                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      className={inp}
                    />
                  ))}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" form="edit-user-form" disabled={updatingUser} icon={<Save size={16} />}>
                {updatingUser ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
