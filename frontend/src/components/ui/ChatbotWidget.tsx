import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  X,
  RefreshCw,
  User,
  Sparkles,
  AlertCircle,
  Terminal,
  ExternalLink,
  UserPlus,
  PackagePlus,
  Truck,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export type FormType = 'cliente' | 'producto' | 'proveedor' | 'gasto' | 'venta';

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  formType?: FormType;
}

// Funciones auxiliares para cargar estado persistente desde sessionStorage
const getInitialMessages = (): Message[] => {
  try {
    const saved = sessionStorage.getItem('n8n_chat_messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    }
  } catch (e) {
    console.error('Error cargando mensajes del chat de sessionStorage:', e);
  }
  return [
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! 👋 Soy tu asistente IA de n8n. Puedo ayudarte a consultar cualquier módulo o **registrar Clientes, Productos, Proveedores, Ventas y Gastos** directamente desde nuestro chat.',
      timestamp: new Date()
    }
  ];
};

const getInitialIsOpen = (): boolean => {
  try {
    const saved = sessionStorage.getItem('n8n_chat_is_open');
    return saved === 'true';
  } catch (e) {
    return false;
  }
};

// ── Componente Renderizador Estético de Mensajes y Datos ──────────────────────

function renderInlineStyles(text: string, navigate: (path: string) => void) {
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\$[0-9,]+(?:\.[0-9]{2})?)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];

    if (token.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        const label = linkMatch[1];
        const target = linkMatch[2];
        if (target.startsWith('/')) {
          parts.push(
            <button
              key={match.index}
              onClick={() => navigate(target)}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3 h-3 text-indigo-600" />
              {label}
            </button>
          );
        } else {
          parts.push(
            <a key={match.index} href={target} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-medium">
              {label}
            </a>
          );
        }
      }
    } else if (token.startsWith('**')) {
      const boldContent = token.slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-900">
          {boldContent}
        </strong>
      );
    } else if (token.startsWith('$')) {
      parts.push(
        <span key={match.index} className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded text-[11px]">
          {token}
        </span>
      );
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

function FormattedMessageContent({ text, navigate }: { text: string; navigate: (path: string) => void }) {
  let parsedJson: any = null;
  const trimmed = text.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      parsedJson = JSON.parse(trimmed);
    } catch (e) {
      parsedJson = null;
    }
  }

  if (parsedJson) {
    const list = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
    if (list.length > 0 && typeof list[0] === 'object' && list[0] !== null) {
      const keys = Object.keys(list[0]).slice(0, 4);
      return (
        <div className="my-2 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-indigo-50/80 text-indigo-900 font-semibold border-b border-indigo-100">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="px-2.5 py-1.5 capitalize">{k.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}>
                  {keys.map((k) => (
                    <td key={k} className="px-2.5 py-1.5 text-zinc-700">
                      {String(row[k] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm text-zinc-800 leading-relaxed">
      {lines.map((line, idx) => {
        const lineTrim = line.trim();
        if (!lineTrim) return <div key={idx} className="h-1" />;

        if (lineTrim.startsWith('###') || lineTrim.startsWith('##') || lineTrim.startsWith('#')) {
          const titleText = lineTrim.replace(/^#+\s*/, '');
          return (
            <div key={idx} className="font-bold text-indigo-900 border-b border-indigo-100 pb-1 mt-2 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block"></span>
              <span>{titleText}</span>
            </div>
          );
        }

        if (lineTrim.startsWith('- ') || lineTrim.startsWith('* ') || lineTrim.startsWith('• ')) {
          const content = lineTrim.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1">{renderInlineStyles(content, navigate)}</div>
            </div>
          );
        }

        return <div key={idx}>{renderInlineStyles(lineTrim, navigate)}</div>;
      })}
    </div>
  );
}

// ── Componentes de Formularios Interactivos para el Chat ─────────────────────

function ClienteFormCard({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    limite_credito: '0'
  });

  return (
    <div className="mt-2.5 p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-2.5 text-xs text-zinc-700">
      <div className="font-semibold text-indigo-700 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
        <UserPlus className="w-4 h-4 text-indigo-600" />
        <span>Registrar Nuevo Cliente</span>
      </div>
      <div>
        <label className="block font-medium mb-1 text-zinc-600">Nombre / Razón Social *</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Distribuidora Perfumes S.A."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">DNI / NIT *</label>
          <input
            type="text"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            placeholder="12345678-9"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="300 123 4567"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="cliente@email.com"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Cupo Crédito ($)</label>
          <input
            type="number"
            value={formData.limite_credito}
            onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
            placeholder="0"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1 text-zinc-600">Dirección</label>
        <input
          type="text"
          value={formData.direccion}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          placeholder="Av. Principal #12-34"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!formData.nombre.trim() || !formData.documento.trim()}
          onClick={() => onSubmit(formData)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Guardar Cliente
        </button>
      </div>
    </div>
  );
}

function ProductoFormCard({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: 'PROD-' + Math.floor(1000 + Math.random() * 9000),
    categoria: 'Perfumes',
    precio_venta: '',
    precio_costo: '',
    stock: '10'
  });

  return (
    <div className="mt-2.5 p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-2.5 text-xs text-zinc-700">
      <div className="font-semibold text-indigo-700 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
        <PackagePlus className="w-4 h-4 text-indigo-600" />
        <span>Registrar Nuevo Producto</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block font-medium mb-1 text-zinc-600">Nombre Producto *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej. Chanel No 5 100ml"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Código</label>
          <input
            type="text"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Precio Venta ($) *</label>
          <input
            type="number"
            value={formData.precio_venta}
            onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
            placeholder="50.00"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Precio Costo ($)</label>
          <input
            type="number"
            value={formData.precio_costo}
            onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
            placeholder="30.00"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Stock Inicial</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="10"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1 text-zinc-600">Categoría</label>
        <select
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
        >
          <option value="Perfumes">Perfumes</option>
          <option value="Esencias">Esencias</option>
          <option value="Envases">Envases</option>
          <option value="General">General</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!formData.nombre.trim() || !formData.precio_venta}
          onClick={() => onSubmit(formData)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Guardar Producto
        </button>
      </div>
    </div>
  );
}

function ProveedorFormCard({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    contacto: '',
    telefono: '',
    email: '',
    ciudad: ''
  });

  return (
    <div className="mt-2.5 p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-2.5 text-xs text-zinc-700">
      <div className="font-semibold text-indigo-700 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
        <Truck className="w-4 h-4 text-indigo-600" />
        <span>Registrar Nuevo Proveedor</span>
      </div>
      <div>
        <label className="block font-medium mb-1 text-zinc-600">Nombre Proveedor / Empresa *</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Fragancias del Mundo S.A.S."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">NIT / RUT *</label>
          <input
            type="text"
            value={formData.nit}
            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
            placeholder="900123456-1"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Persona de Contacto</label>
          <input
            type="text"
            value={formData.contacto}
            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
            placeholder="Carlos Gómez"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="310 987 6543"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contacto@proveedor.com"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!formData.nombre.trim() || !formData.nit.trim()}
          onClick={() => onSubmit(formData)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Guardar Proveedor
        </button>
      </div>
    </div>
  );
}

function GastoFormCard({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Insumos'
  });

  return (
    <div className="mt-2.5 p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-2.5 text-xs text-zinc-700">
      <div className="font-semibold text-indigo-700 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
        <DollarSign className="w-4 h-4 text-indigo-600" />
        <span>Registrar Nuevo Gasto</span>
      </div>
      <div>
        <label className="block font-medium mb-1 text-zinc-600">Descripción del Gasto *</label>
        <input
          type="text"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Ej: Pago de envío insumos o empaques"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Monto ($) *</label>
          <input
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            placeholder="150.00"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-zinc-600">Categoría</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          >
            <option value="Insumos">Insumos</option>
            <option value="Servicios">Servicios</option>
            <option value="Logística">Logística</option>
            <option value="Arriendo">Arriendo</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!formData.descripcion.trim() || !formData.monto}
          onClick={() => onSubmit(formData)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Guardar Gasto
        </button>
      </div>
    </div>
  );
}

function VentaFormCard({
  clientes,
  productos,
  onSubmit,
  onCancel
}: {
  clientes: any[];
  productos: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id || '');
  const [selectedProdId, setSelectedProdId] = useState(productos[0]?.id || '');
  const [cantidad, setCantidad] = useState('1');
  const [items, setItems] = useState<{ producto_id: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]>([]);
  const [metodoPago, setMetodoPago] = useState<'contado' | 'credito'>('contado');

  const handleAddItem = () => {
    const prod = productos.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const cantNum = parseInt(cantidad, 10) || 1;
    const precio = prod.precio_venta || prod.precio || 0;
    const subtotal = cantNum * precio;

    setItems((prev) => [
      ...prev,
      {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: cantNum,
        precio_unitario: precio,
        subtotal
      }
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalVenta = items.reduce((acc, it) => acc + it.subtotal, 0);

  return (
    <div className="mt-2.5 p-3.5 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-2.5 text-xs text-zinc-700">
      <div className="font-semibold text-indigo-700 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
        <ShoppingCart className="w-4 h-4 text-indigo-600" />
        <span>Registrar Nueva Venta</span>
      </div>

      <div>
        <label className="block font-medium mb-1 text-zinc-600">Cliente *</label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
        >
          {clientes.length === 0 ? (
            <option value="">Cliente General (Mostrador)</option>
          ) : (
            clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.documento ? `(${c.documento})` : ''}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Agregar productos */}
      <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
        <label className="block font-medium text-zinc-700 text-[11px]">Agregar Productos a la Venta</label>
        <div className="flex gap-1.5">
          <select
            value={selectedProdId}
            onChange={(e) => setSelectedProdId(e.target.value)}
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs outline-none"
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} - ${p.precio_venta || p.precio} (Stock: {p.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-14 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-center outline-none"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-xs shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        </div>

        {/* Lista de Items Agregados */}
        {items.length > 0 && (
          <div className="mt-2 divide-y divide-zinc-200 border-t border-zinc-200 pt-1.5 space-y-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] pt-1">
                <span>
                  <strong>{it.cantidad}x</strong> {it.nombre} (${it.precio_unitario})
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-800">${it.subtotal.toLocaleString()}</span>
                  <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center font-bold text-xs pt-1.5 text-indigo-900 border-t border-zinc-200">
              <span>TOTAL:</span>
              <span>${totalVenta.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1 text-zinc-600">Método de Pago</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="metodoPago"
              value="contado"
              checked={metodoPago === 'contado'}
              onChange={() => setMetodoPago('contado')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Contado
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="metodoPago"
              value="credito"
              checked={metodoPago === 'credito'}
              onChange={() => setMetodoPago('credito')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Crédito
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => onSubmit({ clienteId, items, metodoPago, total: totalVenta })}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Registrar Venta (${totalVenta.toLocaleString()})
        </button>
      </div>
    </div>
  );
}

// ── Componente Principal ChatbotWidget ───────────────────────────────────────

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(getInitialIsOpen);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Acceso al contexto global de la aplicación
  const appData = useAppData();
  const { user } = useAuth();

  const autorNombre = user?.name || 'Asistente Chatbot';
  const autorRol = user?.role || 'vendedor';

  // Guardar mensajes en sessionStorage cada vez que cambien
  useEffect(() => {
    try {
      sessionStorage.setItem('n8n_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Error guardando mensajes en sessionStorage:', e);
    }
  }, [messages]);

  // Guardar estado abierto/cerrado en sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('n8n_chat_is_open', String(isOpen));
    } catch (e) {
      console.error('Error guardando estado del chat en sessionStorage:', e);
    }
  }, [isOpen]);

  // Obtener URL de Webhook desde variables de entorno
  const n8nWebhookUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || '';

  // Generar o recuperar sessionId persistente en sessionStorage
  const getSessionId = () => {
    let sid = sessionStorage.getItem('n8n_chat_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('n8n_chat_session_id', sid);
    }
    return sid;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Sugerencias contextuales según la página actual del usuario
  const getContextPrompts = () => {
    const path = location.pathname;
    const common = '📊 Reporte del Día';

    if (path.includes('/ventas')) {
      return ['➕ Registrar Venta', common, '🧾 Venta más grande hoy', '💰 Resumen ventas'];
    }
    if (path.includes('/clientes')) {
      return ['➕ Registrar Cliente', common, '💳 Clientes con crédito', '🔍 Buscar cliente'];
    }
    if (path.includes('/productos')) {
      return ['➕ Registrar Producto', common, '⚠️ Stock bajo', '🧪 Ver lista productos'];
    }
    if (path.includes('/proveedores')) {
      return ['➕ Registrar Proveedor', common, '🚚 Ver proveedores'];
    }

    return ['➕ Registrar Cliente', '➕ Registrar Venta', '➕ Registrar Producto', '➕ Registrar Gasto', common];
  };

  // Manejadores de envío de formularios
  const handleSaveCliente = (data: any, msgId: string) => {
    if (!appData) return;
    appData.addCliente(
      {
        nombre: data.nombre,
        documento: data.documento,
        telefono: data.telefono || '',
        email: data.email || '',
        direccion: data.direccion || '',
        tipo: 'persona',
        ciudad: 'Ciudad',
        fecha_registro: new Date().toISOString().slice(0, 10),
        limite_credito: parseFloat(data.limite_credito) || 0,
        credito_usado: 0
      },
      autorNombre,
      autorRol
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: `✅ **Cliente Creado Exitosamente**\n- **Nombre:** ${data.nombre}\n- **Documento:** ${data.documento}\n- **Teléfono:** ${data.telefono || 'No especificado'}\n\nEl cliente ya está disponible en el sistema.`
            }
          : m
      )
    );
  };

  const handleSaveProducto = (data: any, msgId: string) => {
    if (!appData) return;
    const stockNum = parseInt(data.stock, 10) || 0;
    appData.addProducto(
      {
        codigo: data.codigo || 'PROD-' + Math.floor(1000 + Math.random() * 9000),
        nombre: data.nombre,
        categoria: data.categoria || 'Perfumes',
        precio_venta: parseFloat(data.precio_venta) || 0,
        precio_costo: parseFloat(data.precio_costo) || 0,
        stock: stockNum,
        stock_minimo: 5,
        estado: stockNum > 0 ? 'activo' : 'stock_bajo',
        unidad: 'Unidad',
        descripcion: 'Creado desde Asistente Chatbot'
      },
      autorNombre,
      autorRol
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: `✅ **Producto Creado Exitosamente**\n- **Producto:** ${data.nombre}\n- **Código:** ${data.codigo}\n- **Precio Venta:** $${parseFloat(data.precio_venta).toLocaleString()}\n- **Stock Inicial:** ${data.stock} unidades.`
            }
          : m
      )
    );
  };

  const handleSaveProveedor = (data: any, msgId: string) => {
    if (!appData) return;
    appData.addProveedor(
      {
        nombre: data.nombre,
        nit: data.nit,
        contacto: data.contacto || '',
        telefono: data.telefono || '',
        email: data.email || '',
        ciudad: data.ciudad || 'Ciudad',
        estado: 'activo'
      },
      autorNombre,
      autorRol
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: `✅ **Proveedor Creado Exitosamente**\n- **Empresa:** ${data.nombre}\n- **NIT:** ${data.nit}\n- **Contacto:** ${data.contacto || 'No especificado'}.`
            }
          : m
      )
    );
  };

  const handleSaveGasto = (data: any, msgId: string) => {
    if (!appData) return;
    appData.addGasto(
      {
        descripcion: data.descripcion,
        monto: parseFloat(data.monto) || 0,
        categoria: data.categoria || 'Otros',
        fecha: new Date().toISOString().slice(0, 10),
        registrado_por: autorNombre
      },
      autorNombre,
      autorRol
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: `✅ **Gasto Registrado Exitosamente**\n- **Descripción:** ${data.descripcion}\n- **Monto:** $${parseFloat(data.monto).toLocaleString()}\n- **Categoría:** ${data.categoria}.`
            }
          : m
      )
    );
  };

  const handleSaveVenta = (data: any, msgId: string) => {
    if (!appData) return;
    const clienteObj = appData.clientes.find((c) => c.id === data.clienteId);

    appData.addVenta(
      data.items,
      data.clienteId || 'c_general',
      user?.id || 'v1',
      autorNombre,
      autorRol,
      data.metodoPago
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: `✅ **Venta Registrada Exitosamente**\n- **Cliente:** ${clienteObj ? clienteObj.nombre : 'Mostrador / General'}\n- **Items:** ${data.items.length} productos\n- **Método de Pago:** ${data.metodoPago.toUpperCase()}\n- **Total:** $${data.total.toLocaleString()}`
            }
          : m
      )
    );
  };

  const handleCancelForm = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              formType: undefined,
              text: '❌ Operación cancelada por el usuario.'
            }
          : m
      )
    );
  };

  // Enviar mensaje o disparar intenciones
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    const queryLower = query.toLowerCase();

    // Detección directa de intenciones de Creación / Formularios
    let targetForm: FormType | null = null;
    let formPromptText = '';

    if (queryLower.includes('cliente') && (queryLower.includes('crear') || queryLower.includes('registrar') || queryLower.includes('nuevo') || queryLower.includes('añadir') || queryLower.includes('agregar'))) {
      targetForm = 'cliente';
      formPromptText = '📝 **Formulario de Registro de Cliente**\nCompleta la información a continuación:';
    } else if (queryLower.includes('producto') && (queryLower.includes('crear') || queryLower.includes('registrar') || queryLower.includes('nuevo') || queryLower.includes('añadir') || queryLower.includes('agregar'))) {
      targetForm = 'producto';
      formPromptText = '📝 **Formulario de Registro de Producto**\nCompleta los datos del producto:';
    } else if (queryLower.includes('proveedor') && (queryLower.includes('crear') || queryLower.includes('registrar') || queryLower.includes('nuevo') || queryLower.includes('añadir') || queryLower.includes('agregar'))) {
      targetForm = 'proveedor';
      formPromptText = '📝 **Formulario de Registro de Proveedor**\nIngresa la información del proveedor:';
    } else if (queryLower.includes('gasto') && (queryLower.includes('crear') || queryLower.includes('registrar') || queryLower.includes('nuevo') || queryLower.includes('añadir') || queryLower.includes('agregar'))) {
      targetForm = 'gasto';
      formPromptText = '📝 **Formulario de Registro de Gasto**\nIngresa los detalles del gasto:';
    } else if (queryLower.includes('venta') && (queryLower.includes('crear') || queryLower.includes('registrar') || queryLower.includes('nueva') || queryLower.includes('añadir') || queryLower.includes('agregar'))) {
      targetForm = 'venta';
      formPromptText = '📝 **Formulario de Registro de Venta**\nSelecciona el cliente y productos:';
    }

    if (targetForm) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: formPromptText,
            timestamp: new Date(),
            formType: targetForm!
          }
        ]);
      }, 300);
      return;
    }

    // Consultas directas de reportes e información del sistema
    if (queryLower.includes('reporte') || queryLower.includes('resumen') || queryLower.includes('estado del día') || queryLower.includes('ejecutivo')) {
      const hoyStr = new Date().toISOString().slice(0, 10);
      const ventasHoy = appData?.ventas.filter((v) => v.fecha.startsWith(hoyStr) && v.estado !== 'anulada') || [];
      const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + (v.total || 0), 0);
      const ventaMayor = ventasHoy.length > 0 ? Math.max(...ventasHoy.map((v) => v.total || 0)) : 0;
      const stockBajoCount = appData?.productos.filter((p) => p.stock <= p.stock_minimo).length || 0;
      const totalClientes = appData?.clientes.length || 0;

      const reportText = `### 📊 REPORTE EJECUTIVO DEL DÍA
• **Ventas Registradas Hoy:** ${ventasHoy.length} facturas
• **Total Recaudado Hoy:** $${totalVentasHoy.toLocaleString()}
• **Venta Más Alta Hoy:** $${ventaMayor.toLocaleString()}
• **Productos en Stock Bajo:** ${stockBajoCount} productos
• **Total Clientes Registrados:** ${totalClientes} clientes

[Ver Ventas de Hoy](/ventas) | [Ver Inventario](/productos)`;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: reportText,
            timestamp: new Date()
          }
        ]);
      }, 300);
      return;
    }

    if (queryLower.includes('stock bajo') || queryLower.includes('sin stock')) {
      const prodsBajo = appData?.productos.filter((p) => p.stock <= p.stock_minimo) || [];
      let replyText = '';
      if (prodsBajo.length === 0) {
        replyText = '✅ **Estado de Inventario Excelente**\nTodos los productos cuentan con niveles de stock óptimos.';
      } else {
        const listStr = prodsBajo.map((p) => `• **${p.nombre}**: ${p.stock} unidades en stock (Min: ${p.stock_minimo})`).join('\n');
        replyText = `### ⚠️ PRODUCTOS EN STOCK BAJO (${prodsBajo.length})\n${listStr}\n\n[Ir a Productos](/productos)`;
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: replyText,
            timestamp: new Date()
          }
        ]);
      }, 300);
      return;
    }

    if (queryLower.includes('venta más grande') || queryLower.includes('mayor venta')) {
      const ventasValidas = appData?.ventas.filter((v) => v.estado !== 'anulada') || [];
      let replyText = '';
      if (ventasValidas.length === 0) {
        replyText = 'ℹ️ No hay ventas registradas en el sistema aún.';
      } else {
        const topVenta = [...ventasValidas].sort((a, b) => b.total - a.total)[0];
        replyText = `### 🏆 VENTA MÁS GRANDE REGISTRADA
• **Factura:** ${topVenta.factura}
• **Cliente:** ${topVenta.cliente_nombre}
• **Total:** $${topVenta.total.toLocaleString()}
• **Vendedor:** ${topVenta.vendedor_nombre}
• **Fecha:** ${topVenta.fecha}

[Ver Ventas](/ventas)`;
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: replyText,
            timestamp: new Date()
          }
        ]);
      }, 300);
      return;
    }

    setIsLoading(true);

    if (!n8nWebhookUrl) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'system',
            text: '⚠️ La URL del webhook de n8n no está configurada. Define `VITE_N8N_CHAT_WEBHOOK_URL` en tu archivo `frontend/.env`.',
            timestamp: new Date()
          }
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: query,
          message: query,
          sessionId: getSessionId(),
          activeRoute: location.pathname
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el webhook (${response.status})`);
      }

      const data = await response.json();

      let botResponseText = '';
      if (typeof data === 'string') {
        botResponseText = data;
      } else if (data && typeof data === 'object') {
        botResponseText = data.output || data.text || data.response || data.message || JSON.stringify(data);
      }

      if (!botResponseText) {
        botResponseText = 'Sin respuesta del bot. Verifica la salida de tu nodo de n8n.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponseText,
          timestamp: new Date()
        }
      ]);
    } catch (error: any) {
      console.error('Error enviando mensaje a n8n:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: `❌ Error de comunicación con n8n: ${error.message || 'No se pudo conectar con el webhook.'}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const defaultMsg: Message = {
      id: 'welcome_' + Date.now(),
      sender: 'bot',
      text: 'Conversación reiniciada. ¿En qué puedo ayudarte ahora?',
      timestamp: new Date()
    };
    setMessages([defaultMsg]);
  };

  const quickPrompts = getContextPrompts();

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)]">
      {/* Botón flotante para abrir/cerrar chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 sm:gap-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          aria-label="Abrir asistente n8n"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="hidden sm:inline font-semibold">Asistente n8n</span>
        </button>
      )}

      {/* Ventana Modal del Chat */}
      {isOpen && (
        <div className="flex flex-col w-[calc(100vw-1.5rem)] sm:w-105 h-[82vh] sm:h-137.5 max-h-[calc(100vh-3.5rem)] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Cabecera del Chat */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3.5 bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Bot className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Asistente IA (n8n)
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-indigo-200 flex items-center gap-1">
                  <span>{n8nWebhookUrl ? '● Conectado' : '○ Webhook pendiente'}</span>
                  <span className="opacity-75">({location.pathname})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Reiniciar chat"
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alerta si falta configurar .env */}
          {!n8nWebhookUrl && (
            <div className="shrink-0 bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Modo Demostración / Configuración</p>
                <p className="mt-0.5">
                  Agrega <code className="bg-amber-100 px-1 rounded text-amber-900 font-mono">VITE_N8N_CHAT_WEBHOOK_URL</code> en tu archivo <code className="bg-amber-100 px-1 rounded text-amber-900 font-mono">frontend/.env</code>.
                </p>
              </div>
            </div>
          )}

          {/* Lista de Mensajes con scroll interno estricto */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.sender === 'system' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white'
                  }`}>
                    {msg.sender === 'system' ? <Terminal className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none whitespace-pre-wrap'
                      : msg.sender === 'system'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none font-mono text-[11px] whitespace-pre-wrap'
                      : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'user' || msg.sender === 'system' ? (
                    msg.text
                  ) : (
                    <FormattedMessageContent text={msg.text} navigate={navigate} />
                  )}

                  {/* Formularios Interactivos según el tipo de formulario activo */}
                  {msg.formType === 'cliente' && (
                    <ClienteFormCard
                      onSubmit={(data) => handleSaveCliente(data, msg.id)}
                      onCancel={() => handleCancelForm(msg.id)}
                    />
                  )}
                  {msg.formType === 'producto' && (
                    <ProductoFormCard
                      onSubmit={(data) => handleSaveProducto(data, msg.id)}
                      onCancel={() => handleCancelForm(msg.id)}
                    />
                  )}
                  {msg.formType === 'proveedor' && (
                    <ProveedorFormCard
                      onSubmit={(data) => handleSaveProveedor(data, msg.id)}
                      onCancel={() => handleCancelForm(msg.id)}
                    />
                  )}
                  {msg.formType === 'gasto' && (
                    <GastoFormCard
                      onSubmit={(data) => handleSaveGasto(data, msg.id)}
                      onCancel={() => handleCancelForm(msg.id)}
                    />
                  )}
                  {msg.formType === 'venta' && (
                    <VentaFormCard
                      clientes={appData?.clientes || []}
                      productos={appData?.productos || []}
                      onSubmit={(data) => handleSaveVenta(data, msg.id)}
                      onCancel={() => handleCancelForm(msg.id)}
                    />
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl rounded-bl-none text-xs text-zinc-500 flex items-center gap-1.5 shadow-xs">
                  <span>Procesando consulta</span>
                  <span className="flex gap-1 items-center ml-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompts Rápidos Sugeridos (Sensibles al Contexto) */}
          {!isLoading && (
            <div className="shrink-0 px-3 py-2 bg-white border-t border-zinc-100 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="whitespace-nowrap bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-100 transition-all font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input de Mensaje */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="shrink-0 p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje o 'Crear cliente'..."
              disabled={isLoading}
              className="flex-1 bg-zinc-100 border-0 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
